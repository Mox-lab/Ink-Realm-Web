import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router';
import { t } from '@/shared/i18n';
import { useLangSync } from '@/shared/i18n/LangContext';
import { notifyError } from '@/shared/api/errorToast';
import { track } from '@/shared/track';
import { deleteNovel, downloadNovelExport, getNovel, listNovels, type ExportFormat, type NovelItem } from '../api';
import NovelCard from '../components/NovelCard';
import DeleteNovelDialog from '../components/DeleteNovelDialog';

/**
 * /novels 作品列表(功能文档 §5.3):卡片网格 + 搜索 + 新建 + 删除确认。
 *
 * <p>状态机:L 卡片骨架 / E 空态引导 / X 错误重试 / T 由 client 超时兜底走 X。
 * 搜索为前端即时过滤(个人作品量级小,不设后端分页)。</p>
 *
 * @author Moma
 */

/** 待删除目标(弹窗数据) */
interface DeleteTarget {
  novel: NovelItem;
  chapterCount: number;
  loreCount: number;
}

/** 骨架卡片 */
function CardSkeleton(): React.ReactElement {
  return (
    <div className="sf-panel flex flex-col gap-3 p-4" aria-hidden>
      <div className="h-5 w-3/5 animate-pulse rounded bg-[var(--sf-border)]" />
      <div className="h-4 w-2/5 animate-pulse rounded bg-[var(--sf-border)]" />
      <div className="mt-auto h-3 w-1/3 animate-pulse rounded bg-[var(--sf-border)]" />
    </div>
  );
}

export default function NovelListPage() {
  useLangSync();
  const navigate = useNavigate();
  const [novels, setNovels] = useState<NovelItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [target, setTarget] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);
  /** 正在导出的作品 ID(仅禁用对应卡片图标) */
  const [exportingId, setExportingId] = useState<number | null>(null);

  /** 卡片导出:blob 下载,失败提示(逻辑内聚 api.downloadNovelExport) */
  const handleExport = (novel: NovelItem, format: ExportFormat): void => {
    setExportingId(novel.id);
    downloadNovelExport(novel.id, novel.title, format)
      .catch((err) => notifyError(t('novels.overview.exportFailed'), err))
      .finally(() => setExportingId(null));
  };

  /** 加载列表(失败可重试) */
  const load = useCallback((): void => {
    setFailed(false);
    listNovels()
      .then(setNovels)
      .catch((err) => {
        setFailed(true);
        notifyError(t('novels.list.loadFailed'), err);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** 搜索即时过滤:标题/题材包含关键词(大小写不敏感) */
  const filtered = useMemo(() => {
    if (!novels) return null;
    const kw = keyword.trim().toLowerCase();
    if (!kw) return novels;
    return novels.filter(
      (n) => n.title.toLowerCase().includes(kw) || (n.genre ?? '').toLowerCase().includes(kw),
    );
  }, [novels, keyword]);

  /** 点删除:先取详情拿统计(N 章 N 设定),再弹确认 */
  const askDelete = (novel: NovelItem): void => {
    getNovel(novel.id)
      .then((d) => setTarget({ novel, chapterCount: d.chapterCount, loreCount: d.loreCount }))
      .catch((err) => notifyError(t('novels.delete.failed'), err));
  };

  const confirmDelete = (): void => {
    if (!target) return;
    setDeleting(true);
    track('novel.delete', { novelId: target.novel.id });
    deleteNovel(target.novel.id)
      .then(() => {
        setTarget(null);
        // 局部刷新:从列表移除,避免整页重拉
        setNovels((prev) => (prev ? prev.filter((n) => n.id !== target.novel.id) : prev));
      })
      .catch((err) => notifyError(t('novels.delete.failed'), err))
      .finally(() => setDeleting(false));
  };

  return (
    <div className="sf-page">
      {/* 工具行:标题 + 搜索 + 新建 */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h1 className="sf-heading mr-auto text-xl font-semibold">{t('nav.novels')}</h1>
        <div className="sf-input-group relative w-44 sm:w-56">
          <Search size={15} aria-hidden />
          <input
            className="sf-input min-h-10 w-full"
            value={keyword}
            placeholder={t('novels.list.search')}
            aria-label={t('novels.list.search')}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="sf-btn sf-btn-primary flex min-h-10 items-center gap-1.5 px-4"
          onClick={() => {
            track('novel.createStart');
            navigate('/novels/new');
          }}
        >
          <Plus size={16} aria-hidden />
          {t('novels.list.new')}
        </button>
      </div>

      {/* 状态区:错误 / L 骨架 / E 空态 / 数据网格。
          failed 分支必须放在 filtered === null 之前:复合条件(failed && filtered===null)
          会让 TS 无法在后续分支收窄 filtered 为非空(TS18047),先判 failed 即可链式收窄 */}
      {failed ? (
        <div className="sf-panel p-8 text-center">
          <p className="mb-3 text-sm text-[var(--sf-text-dim)]">{t('novels.list.loadFailed')}</p>
          <button type="button" className="sf-btn sf-btn-primary min-h-10 px-5" onClick={load}>
            {t('novels.list.retry')}
          </button>
        </div>
      ) : filtered === null ? (
        <div className="novel-card-wall">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filtered.length === 0 ? (
        <div className="sf-panel p-10 text-center">
          {novels && novels.length > 0 ? (
            <p className="text-sm text-[var(--sf-text-dim)]">{t('novels.list.search')}</p>
          ) : (
            <>
              <p className="mb-4 text-sm text-[var(--sf-text-dim)]">{t('novels.list.empty')}</p>
              <button
                type="button"
                className="sf-btn sf-btn-primary min-h-10 px-5"
                onClick={() => {
                  track('novel.createStart');
                  navigate('/novels/new');
                }}
              >
                {t('novels.list.emptyCta')}
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="novel-card-wall">
          {filtered.map((n) => (
            <NovelCard
              key={n.id}
              novel={n}
              onEnter={(novel) => {
                track('novel.enter', { novelId: novel.id });
                navigate(`/novels/${novel.id}/overview`);
              }}
              onEdit={(novel) => navigate(`/novels/${novel.id}/edit`)}
              onDelete={askDelete}
              onExport={handleExport}
              exporting={exportingId === n.id}
            />
          ))}
        </div>
      )}

      {/* 删除确认(不可逆,显式选择) */}
      {target && (
        <DeleteNovelDialog
          title={target.novel.title}
          chapterCount={target.chapterCount}
          loreCount={target.loreCount}
          deleting={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setTarget(null)}
        />
      )}
    </div>
  );
}

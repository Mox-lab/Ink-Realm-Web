import { ArrowLeft, BookOpen, Users, Wand2 } from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router';
import { t } from '@/shared/i18n';
import { useLangSync } from '@/shared/i18n/LangContext';
import type { NovelDetail } from '../api';

/**
 * /novels/:novelId/overview 作品总览(功能文档 §5.5:作品驾驶舱)。
 *
 * <p>G2 交付:作品信息卡(导出入口在列表卡片右下角);剧情时间线(G5)/AI 续写建议(G4)/
 * 协作(collab 域)以空态卡与置灰按钮占位,后续批次挂载。
 * 数据来自 NovelLayout 的 Outlet context(工作台壳统一加载,避免重复请求)。</p>
 *
 * @author Moma
 */
export default function NovelOverviewPage() {
  useLangSync();
  const navigate = useNavigate();
  const detail = useOutletContext<NovelDetail>();
  const { novel } = detail;

  /** 统计项 */
  const stats = [
    { label: t('novels.overview.words'), value: novel.wordCount.toLocaleString() },
    { label: t('novels.overview.chapters'), value: String(detail.chapterCount) },
    { label: t('novels.overview.lores'), value: String(detail.loreCount) },
  ];

  return (
    <div className="sf-page flex flex-col gap-5">
      {/* 顶行:返回 + 标题 */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="sf-icon-btn min-h-10 min-w-10"
          aria-label={t('novels.overview.backToList')}
          onClick={() => navigate('/novels')}
        >
          <ArrowLeft size={16} aria-hidden />
        </button>
        <h1 className="sf-heading line-clamp-1 text-xl font-semibold">{novel.title}</h1>
      </div>

      {/* 作品信息卡 */}
      <section className="sf-panel p-5" aria-label={t('novels.overview.info')}>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="sf-chip">{novel.genre || t('novels.card.noGenre')}</span>
          <span className="sf-chip">{t('novels.overview.status.draft')}</span>
        </div>
        {novel.description && (
          <p className="mb-4 whitespace-pre-wrap text-sm leading-relaxed text-[var(--sf-text-dim)]">
            {novel.description}
          </p>
        )}
        <dl className="grid grid-cols-3 gap-3 text-center">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg bg-[var(--sf-bg-2)] px-2 py-3">
              <dt className="text-xs text-[var(--sf-text-dim)]">{s.label}</dt>
              <dd className="mt-1 text-lg font-semibold">{s.value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--sf-text-dim)]">
          <span>
            {t('novels.overview.createdAt')} {new Date(novel.createdAt).toLocaleDateString()}
          </span>
          <span>
            {t('novels.overview.updatedAt')} {new Date(novel.updatedAt).toLocaleDateString()}
          </span>
        </div>

        {/* 操作行:写作/设定/协作为后续批次占位 */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="sf-btn sf-btn-primary flex min-h-10 items-center gap-1.5 px-4"
            title={t('novels.overview.wip')}
            disabled
          >
            <Wand2 size={15} aria-hidden />
            {t('novels.overview.continue')}
          </button>
          <button
            type="button"
            className="sf-btn flex min-h-10 items-center gap-1.5 px-4"
            onClick={() => navigate(`/novels/${novel.id}/lore`)}
          >
            <BookOpen size={15} aria-hidden />
            {t('novels.overview.manageLore')}
          </button>
          <button
            type="button"
            className="sf-btn flex min-h-10 items-center gap-1.5 px-4"
            title={t('novels.overview.wip')}
            disabled
          >
            <Users size={15} aria-hidden />
            {t('novels.overview.collab')}
          </button>
        </div>
      </section>

      {/* 占位卡并排(桌面两列,减少垂直空旷;G5/G4 挂载后各自独立成行) */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* 剧情时间线(G5 挂载) */}
        <section className="sf-panel p-5" aria-label={t('novels.overview.timeline')}>
          <h2 className="sf-heading mb-3 text-base font-semibold">{t('novels.overview.timeline')}</h2>
          <p className="py-6 text-center text-sm text-[var(--sf-text-dim)]">
            {t('novels.overview.timelineEmpty')}
          </p>
        </section>

        {/* AI 续写建议(G4 挂载) */}
        <section className="sf-panel p-5" aria-label={t('novels.overview.suggest')}>
          <h2 className="sf-heading mb-3 text-base font-semibold">{t('novels.overview.suggest')}</h2>
          <p className="py-6 text-center text-sm text-[var(--sf-text-dim)]">
            {t('novels.overview.suggestEmpty')}
          </p>
        </section>
      </div>
    </div>
  );
}

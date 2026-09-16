import { useEffect, useRef, useState } from 'react';
import { BookOpen, Download, Pencil, Trash2 } from 'lucide-react';
import { t } from '@/shared/i18n';
import type { ExportFormat, NovelItem } from '../api';

/**
 * 作品卡片(功能文档 §5.3:标题/题材/更新时间/字数 + 进入/编辑/删除 + 右下角导出)。
 *
 * <p>卡片主体点击进入工作台;操作按钮 stopPropagation 防冒泡误触。
 * 导出菜单自卡片右下角向上展开——sf-panel 含 backdrop-filter 各自成层叠上下文,
 * 向下弹会跨面板被后续行卡片盖住,向上弹完全在宿主面板上下文内。
 * 触控目标 ≥40px(移动端纪律)。</p>
 *
 * @author Moma
 */

/** 卡片操作回调 */
interface Props {
  novel: NovelItem;
  onEnter: (novel: NovelItem) => void;
  onEdit: (novel: NovelItem) => void;
  onDelete: (novel: NovelItem) => void;
  /** 导出上抛(下载逻辑由列表页统一处理) */
  onExport: (novel: NovelItem, format: ExportFormat) => void;
  /** 本卡导出进行中(禁用图标) */
  exporting?: boolean;
}

/** 字数展示:千位分隔 */
function formatWords(count: number): string {
  return count.toLocaleString();
}

export default function NovelCard({ novel, onEnter, onEdit, onDelete, onExport, exporting = false }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // 菜单展开期间点击外部关闭(仅展开时挂监听,同时最多一张卡开菜单)
  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent): void => {
      if (!menuRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  return (
    <div
      className="sf-panel group flex cursor-pointer flex-col gap-3 p-4 transition-transform hover:-translate-y-0.5"
      role="button"
      tabIndex={0}
      aria-label={novel.title}
      onClick={() => onEnter(novel)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onEnter(novel);
        }
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="sf-heading line-clamp-2 text-base font-semibold leading-snug">{novel.title}</h3>
        <div className="flex shrink-0 items-center gap-1 opacity-60 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            className="sf-icon-btn min-h-10 min-w-10"
            aria-label={t('novels.card.enter')}
            title={t('novels.card.enter')}
            onClick={(e) => {
              e.stopPropagation();
              onEnter(novel);
            }}
          >
            <BookOpen size={16} aria-hidden />
          </button>
          <button
            type="button"
            className="sf-icon-btn min-h-10 min-w-10"
            aria-label={t('novels.card.edit')}
            title={t('novels.card.edit')}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(novel);
            }}
          >
            <Pencil size={16} aria-hidden />
          </button>
          <button
            type="button"
            className="sf-icon-btn min-h-10 min-w-10 hover:text-[var(--sf-error)]"
            aria-label={t('novels.card.delete')}
            title={t('novels.card.delete')}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(novel);
            }}
          >
            <Trash2 size={16} aria-hidden />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--sf-text-dim)]">
        <span className="sf-chip">{novel.genre || t('novels.card.noGenre')}</span>
        <span>
          {formatWords(novel.wordCount)} {t('novels.card.words')}
        </span>
      </div>

      {/* 底行:更新时间 + 右下角导出图标(菜单向上展开选 TXT/Markdown) */}
      <div className="mt-auto flex items-end justify-between gap-2 text-xs text-[var(--sf-text-dim)]">
        <span>
          {t('novels.overview.updatedAt')} {new Date(novel.updatedAt).toLocaleDateString()}
        </span>
        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            className="sf-icon-btn min-h-10 min-w-10 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={t('novels.card.export')}
            title={t('novels.overview.exportTip')}
            disabled={exporting}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((o) => !o);
            }}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <Download size={16} aria-hidden />
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute bottom-full right-0 z-20 mb-1 min-w-40 overflow-hidden rounded-lg border border-[var(--sf-border)] bg-[var(--sf-bg)] py-1 shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                className="block w-full px-4 py-2 text-left text-sm hover:bg-[var(--sf-bg-2)]"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onExport(novel, 'txt');
                }}
              >
                {t('novels.overview.exportTxt')}
              </button>
              <button
                type="button"
                role="menuitem"
                className="block w-full px-4 py-2 text-left text-sm hover:bg-[var(--sf-bg-2)]"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onExport(novel, 'md');
                }}
              >
                {t('novels.overview.exportMd')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

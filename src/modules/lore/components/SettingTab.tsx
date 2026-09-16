import { BookOpen, Plus, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { t } from '@/shared/i18n';
import { notifyError } from '@/shared/api/errorToast';
import {
  LORE_CATEGORIES,
  createSetting,
  deleteSetting,
  listSettings,
  updateSetting,
  type LoreCategory,
  type SettingItem,
  type SettingSaveReq,
} from '../api';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import SettingFormDialog from './SettingFormDialog';

/**
 * 设定 tab:分类页签(10 类) + 关键词搜索 + 词条卡片墙 + 新建/编辑/删除。
 *
 * <p>分类页签"全部"聚合展示;删除提示含级联关系语义(后端级联逻辑删关系)。
 * 错误码 40009(同分类重名)由后端中文 message 经 errorToast 直出。</p>
 *
 * @author Moba
 */

/** 'all' 表示聚合全部分类 */
type CategoryFilter = LoreCategory | 'all';

export default function SettingTab() {
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [keyword, setKeyword] = useState('');
  const [items, setItems] = useState<SettingItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 弹窗状态:编辑目标 null=关闭,'new'=新建,其余=编辑该词条
  const [editing, setEditing] = useState<SettingItem | 'new' | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<SettingItem | null>(null);

  /** 拉取列表(分类/关键词变化触发) */
  const reload = useCallback(() => {
    setLoading(true);
    listSettings(category === 'all' ? undefined : category, keyword.trim() || undefined)
      .then(setItems)
      .catch((err) => notifyError(t('lore.setting.loadFailed'), err))
      .finally(() => setLoading(false));
  }, [category, keyword]);

  useEffect(() => {
    reload();
  }, [reload]);

  /** 新建/编辑提交 */
  const submit = (req: SettingSaveReq): void => {
    setSaving(true);
    const action =
      editing === 'new' ? createSetting(req) : updateSetting((editing as SettingItem).id, req);
    action
      .then(() => {
        setEditing(null);
        reload();
      })
      .catch((err) => notifyError(t('lore.setting.saveFailed'), err))
      .finally(() => setSaving(false));
  };

  /** 确认删除(级联删除关联关系) */
  const confirmDelete = (): void => {
    if (!deleting) return;
    setSaving(true);
    deleteSetting(deleting.id)
      .then(() => {
        setDeleting(null);
        reload();
      })
      .catch((err) => notifyError(t('lore.setting.deleteFailed'), err))
      .finally(() => setSaving(false));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 工具行 1:分类页签(独立成行,避免与搜索/新建挤行换位) */}
      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          className={`sf-btn min-h-10 px-3 text-sm ${category === 'all' ? 'sf-btn-primary' : ''}`}
          onClick={() => setCategory('all')}
        >
          {t('lore.category.all')}
        </button>
        {LORE_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            className={`sf-btn min-h-10 px-3 text-sm ${category === c ? 'sf-btn-primary' : ''}`}
            onClick={() => setCategory(c)}
          >
            {t(`lore.category.${c}`)}
          </button>
        ))}
      </div>

      {/* 工具行 2:搜索 + 新建(移动端搜索占满,桌面限宽右置) */}
      <div className="flex items-center justify-end gap-2">
        <div className="sf-input-group w-full sm:max-w-64">
          <Search size={15} aria-hidden />
          <input
            className="sf-input"
            value={keyword}
            placeholder={t('lore.setting.search')}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <button
          type="button"
          className={`sf-btn sf-btn-primary min-h-10 flex-none items-center gap-1.5 px-4 ${
            !loading && items.length === 0 ? 'hidden' : ''
          }`}
          onClick={() => setEditing('new')}
        >
          <Plus size={15} aria-hidden />
          {t('lore.setting.new')}
        </button>
      </div>

      {/* 卡片墙 */}
      {loading ? (
        <p className="py-10 text-center text-sm text-[var(--sf-text-dim)]">{t('common.loading')}</p>
      ) : items.length === 0 ? (
        <div className="sf-panel flex flex-col items-center gap-3 py-14">
          <BookOpen size={28} aria-hidden className="text-[var(--sf-text-dim)]" />
          <p className="text-sm text-[var(--sf-text-dim)]">{t('lore.setting.empty')}</p>
          <button
            type="button"
            className="sf-btn sf-btn-primary min-h-10 items-center gap-1.5 px-4"
            onClick={() => setEditing('new')}
          >
            <Plus size={15} aria-hidden />
            {t('lore.setting.new')}
          </button>
        </div>
      ) : (
        <div className="novel-card-wall">
          {items.map((item) => (
            <article key={item.id} className="sf-panel flex flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="sf-heading line-clamp-1 text-base font-semibold">{item.name}</h3>
                <span className="sf-chip flex-none">{t(`lore.category.${item.category}`)}</span>
              </div>
              {item.structType && (
                <p className="text-xs text-[var(--sf-text-dim)]">
                  {t('lore.setting.structType')}: {item.structType}
                </p>
              )}
              <p className="line-clamp-2 min-h-8 text-xs leading-relaxed text-[var(--sf-text-dim)]">
                {item.content && item.content !== '{}' ? item.content : t('lore.setting.noContent')}
              </p>
              <div className="mt-auto flex items-center justify-between pt-1">
                <span className="text-xs text-[var(--sf-text-dim)]">
                  {t('lore.updatedAt')} {new Date(item.updatedAt).toLocaleDateString()}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="sf-icon-btn min-h-10 min-w-10"
                    aria-label={t('lore.edit')}
                    onClick={() => setEditing(item)}
                  >
                    {t('lore.edit')}
                  </button>
                  <button
                    type="button"
                    className="sf-icon-btn min-h-10 min-w-10 text-[var(--sf-error)]"
                    aria-label={t('common.delete')}
                    onClick={() => setDeleting(item)}
                  >
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* 弹窗层 */}
      {editing && (
        <SettingFormDialog
          initial={editing === 'new' ? undefined : editing}
          defaultCategory={category === 'all' ? undefined : category}
          saving={saving}
          onSubmit={submit}
          onCancel={() => setEditing(null)}
        />
      )}
      {deleting && (
        <DeleteConfirmDialog
          text={t('lore.setting.deleteText').replace('{name}', deleting.name)}
          deleting={saving}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

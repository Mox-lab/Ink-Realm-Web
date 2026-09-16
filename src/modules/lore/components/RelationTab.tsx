import { ArrowRight, Lock, LockOpen, Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { t } from '@/shared/i18n';
import { notifyError } from '@/shared/api/errorToast';
import {
  createRelation,
  deleteRelation,
  listRelations,
  lockRelationSeed,
  updateRelation,
  type RelationItem,
  type RelationSaveReq,
} from '../api';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import RelationFormDialog from './RelationFormDialog';

/**
 * 关系 tab:关系列表(起点 →(类型)→ 终点) + 种子锁定 + 增删改。
 *
 * <p>展示用名快照(改名级联由后端保证 0 悬空,M3-③);
 * 种子锁定开关即时保存——锁定后 AI 只读(M3-② 约束就位)。</p>
 *
 * @author Moba
 */
export default function RelationTab() {
  const [items, setItems] = useState<RelationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 弹窗状态
  const [editing, setEditing] = useState<RelationItem | 'new' | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<RelationItem | null>(null);

  /** 拉取全部关系 */
  const reload = useCallback(() => {
    setLoading(true);
    listRelations()
      .then(setItems)
      .catch((err) => notifyError(t('lore.relation.loadFailed'), err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  /** 新建/编辑提交 */
  const submit = (req: RelationSaveReq): void => {
    setSaving(true);
    const action =
      editing === 'new' ? createRelation(req) : updateRelation((editing as RelationItem).id, req);
    action
      .then(() => {
        setEditing(null);
        reload();
      })
      .catch((err) => notifyError(t('lore.relation.saveFailed'), err))
      .finally(() => setSaving(false));
  };

  /** 种子锁定/解锁(即时保存) */
  const toggleSeed = (item: RelationItem): void => {
    lockRelationSeed(item.id, !item.seed)
      .then((updated) => {
        setItems((list) => list.map((x) => (x.id === updated.id ? updated : x)));
      })
      .catch((err) => notifyError(t('lore.relation.seedFailed'), err));
  };

  /** 确认删除 */
  const confirmDelete = (): void => {
    if (!deleting) return;
    setSaving(true);
    deleteRelation(deleting.id)
      .then(() => {
        setDeleting(null);
        reload();
      })
      .catch((err) => notifyError(t('lore.relation.deleteFailed'), err))
      .finally(() => setSaving(false));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 工具行 */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-[var(--sf-text-dim)]">{t('lore.relation.hint')}</p>
        <button
          type="button"
          className="sf-btn sf-btn-primary min-h-10 items-center gap-1.5 px-4"
          onClick={() => setEditing('new')}
        >
          <Plus size={15} aria-hidden />
          {t('lore.relation.new')}
        </button>
      </div>

      {/* 关系列表 */}
      {loading ? (
        <p className="py-10 text-center text-sm text-[var(--sf-text-dim)]">{t('common.loading')}</p>
      ) : items.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--sf-text-dim)]">{t('lore.relation.empty')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id} className="sf-panel flex flex-wrap items-center gap-2 p-3">
              {/* 关系语义:起点 →(类型)→ 终点 */}
              <span className="text-sm font-semibold">{item.fromNameSnapshot}</span>
              <ArrowRight size={14} aria-hidden className="text-[var(--sf-text-dim)]" />
              <span className="sf-chip">{item.relationType}</span>
              <ArrowRight size={14} aria-hidden className="text-[var(--sf-text-dim)]" />
              <span className="text-sm font-semibold">{item.toNameSnapshot}</span>

              <div className="ml-auto flex flex-none items-center gap-1">
                {/* 种子锁定开关 */}
                <button
                  type="button"
                  className={`sf-btn min-h-10 items-center gap-1 px-2.5 text-xs ${
                    item.seed ? 'sf-btn-primary' : ''
                  }`}
                  aria-pressed={item.seed}
                  title={item.seed ? t('lore.relation.seedOn') : t('lore.relation.seedOff')}
                  onClick={() => toggleSeed(item)}
                >
                  {item.seed ? <Lock size={13} aria-hidden /> : <LockOpen size={13} aria-hidden />}
                  {item.seed ? t('lore.relation.seedOn') : t('lore.relation.seedOff')}
                </button>
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
            </li>
          ))}
        </ul>
      )}

      {/* 弹窗层 */}
      {editing && (
        <RelationFormDialog
          initial={editing === 'new' ? undefined : editing}
          saving={saving}
          onSubmit={submit}
          onCancel={() => setEditing(null)}
        />
      )}
      {deleting && (
        <DeleteConfirmDialog
          text={t('lore.relation.deleteText')
            .replace('{from}', deleting.fromNameSnapshot)
            .replace('{to}', deleting.toNameSnapshot)}
          deleting={saving}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

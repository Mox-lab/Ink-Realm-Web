import { ChevronDown, ChevronUp, Plus, ScrollText } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { t } from '@/shared/i18n';
import { notifyError } from '@/shared/api/errorToast';
import {
  LORE_DICT_TYPES,
  createDict,
  deleteDict,
  listDicts,
  reorderDicts,
  updateDict,
  updateDictStatus,
  type DictItem,
  type DictSaveReq,
  type DictStatus,
  type LoreDictType,
} from '../api';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import DictFormDialog from './DictFormDialog';

/**
 * 字典 tab:7 段页签 + 有序列表(拖拽排序/上移下移) + 增删改。
 *
 * <p>排序即时保存:拖拽或按钮重排后乐观更新本地序,调 reorder 持久化,
 * 失败回滚重拉。桌面拖拽(HTML5 DND) + 移动端上移/下移按钮兜底
 * (触控目标 ≥40px 纪律)。字典是 AI 硬注入的一致性约束源(7 段封闭),
 * 层级序即注入顺序。</p>
 *
 * @author Moba
 */
export default function DictTab() {
  const [dictType, setDictType] = useState<LoreDictType>('realm');
  const [items, setItems] = useState<DictItem[]>([]);
  const [loading, setLoading] = useState(true);
  /** 拖拽中的行下标(null=无拖拽) */
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // 弹窗状态
  const [editing, setEditing] = useState<DictItem | 'new' | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<DictItem | null>(null);

  /** 拉取当前段列表 */
  const reload = useCallback(() => {
    setLoading(true);
    listDicts(dictType)
      .then(setItems)
      .catch((err) => notifyError(t('lore.dict.loadFailed'), err))
      .finally(() => setLoading(false));
  }, [dictType]);

  useEffect(() => {
    reload();
  }, [reload]);

  /**
   * 按新顺序持久化(乐观更新,失败回滚重拉)。
   *
   * @param next 重排后的列表
   */
  const persistOrder = (next: DictItem[]): void => {
    setItems(next);
    reorderDicts(dictType, next.map((x) => x.id))
      .catch((err) => {
        notifyError(t('lore.dict.reorderFailed'), err);
        reload();
      });
  };

  /** 拖拽落点:把 dragIndex 行移动到 targetIndex */
  const handleDrop = (targetIndex: number): void => {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const next = [...items];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    setDragIndex(null);
    persistOrder(next);
  };

  /** 上移/下移(移动端兜底,与拖拽同持久化路径) */
  const move = (index: number, delta: -1 | 1): void => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    persistOrder(next);
  };

  /** 新建/编辑提交 */
  const submit = (req: DictSaveReq): void => {
    setSaving(true);
    const action = editing === 'new' ? createDict(req) : updateDict((editing as DictItem).id, req);
    action
      .then(() => {
        setEditing(null);
        reload();
      })
      .catch((err) => notifyError(t('lore.dict.saveFailed'), err))
      .finally(() => setSaving(false));
  };

  /** 确认删除 */
  const confirmDelete = (): void => {
    if (!deleting) return;
    setSaving(true);
    deleteDict(deleting.id)
      .then(() => {
        setDeleting(null);
        reload();
      })
      .catch((err) => notifyError(t('lore.dict.deleteFailed'), err))
      .finally(() => setSaving(false));
  };

  /** 启用/禁用切换(禁用后 G4 AI 注入跳过,列表仍展示) */
  const toggleStatus = (item: DictItem): void => {
    const next: DictStatus = item.status === 'active' ? 'disabled' : 'active';
    setSaving(true);
    updateDictStatus(item.id, next)
      .then(reload)
      .catch((err) => notifyError(t('lore.dict.statusFailed'), err))
      .finally(() => setSaving(false));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 7 段页签 */}
      <div className="flex flex-wrap gap-1">
        {LORE_DICT_TYPES.map((dt) => (
          <button
            key={dt}
            type="button"
            className={`sf-btn min-h-10 px-3 text-sm ${dictType === dt ? 'sf-btn-primary' : ''}`}
            onClick={() => setDictType(dt)}
          >
            {t(`lore.dictType.${dt}`)}
          </button>
        ))}
      </div>

      {/* 工具行 */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-[var(--sf-text-dim)]">{t('lore.dict.orderHint')}</p>
        <button
          type="button"
          className={`sf-btn sf-btn-primary min-h-10 items-center gap-1.5 px-4 ${
            !loading && items.length === 0 ? 'hidden' : ''
          }`}
          onClick={() => setEditing('new')}
        >
          <Plus size={15} aria-hidden />
          {t('lore.dict.new')}
        </button>
      </div>

      {/* 有序列表 */}
      {loading ? (
        <p className="py-10 text-center text-sm text-[var(--sf-text-dim)]">{t('common.loading')}</p>
      ) : items.length === 0 ? (
        <div className="sf-panel flex flex-col items-center gap-3 py-14">
          <ScrollText size={28} aria-hidden className="text-[var(--sf-text-dim)]" />
          <p className="text-sm text-[var(--sf-text-dim)]">{t('lore.dict.empty')}</p>
          <button
            type="button"
            className="sf-btn sf-btn-primary min-h-10 items-center gap-1.5 px-4"
            onClick={() => setEditing('new')}
          >
            <Plus size={15} aria-hidden />
            {t('lore.dict.new')}
          </button>
        </div>
      ) : (
        <ol className="flex flex-col gap-2">
          {items.map((item, index) => (
            <li
              key={item.id}
              className={`sf-panel flex items-center gap-3 p-3 ${
                item.status === 'disabled' ? 'opacity-55' : ''
              }`}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(index)}
              onDragEnd={() => setDragIndex(null)}
            >
              {/* 层级序徽标 */}
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[var(--sf-bg-2)] text-sm font-semibold">
                {item.tierNo}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate text-sm font-semibold">
                  <span className="truncate">{item.term}</span>
                  {item.status === 'disabled' && (
                    <span className="sf-chip flex-none text-xs">{t('lore.dict.disabledTag')}</span>
                  )}
                </p>
                {item.definition && (
                  <p className="line-clamp-1 text-xs text-[var(--sf-text-dim)]">{item.definition}</p>
                )}
              </div>
              {/* 排序按钮组(移动端兜底) */}
              <div className="flex flex-none gap-1">
                <button
                  type="button"
                  className="sf-icon-btn min-h-10 min-w-10"
                  aria-label={t('lore.dict.moveUp')}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ChevronUp size={15} aria-hidden />
                </button>
                <button
                  type="button"
                  className="sf-icon-btn min-h-10 min-w-10"
                  aria-label={t('lore.dict.moveDown')}
                  disabled={index === items.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ChevronDown size={15} aria-hidden />
                </button>
              </div>
              {/* 状态/编辑/删除 */}
              <div className="flex flex-none gap-1">
                <button
                  type="button"
                  className="sf-icon-btn min-h-10 min-w-10"
                  aria-label={
                    item.status === 'active' ? t('lore.dict.disable') : t('lore.dict.enable')
                  }
                  onClick={() => toggleStatus(item)}
                >
                  {item.status === 'active' ? t('lore.dict.disable') : t('lore.dict.enable')}
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
        </ol>
      )}

      {/* 弹窗层 */}
      {editing && (
        <DictFormDialog
          dictType={dictType}
          initial={editing === 'new' ? undefined : editing}
          saving={saving}
          onSubmit={submit}
          onCancel={() => setEditing(null)}
        />
      )}
      {deleting && (
        <DeleteConfirmDialog
          text={t('lore.dict.deleteText').replace('{term}', deleting.term)}
          deleting={saving}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

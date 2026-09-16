import { useEffect, useState } from 'react';
import { t } from '@/shared/i18n';
import { notifyError } from '@/shared/api/errorToast';
import { listSettings, type RelationItem, type RelationSaveReq, type SettingItem } from '../api';

/**
 * 设定关系新建/编辑弹窗(功能文档 §6.5)。
 *
 * <p>两端词条下拉数据源为本作品全量词条(listSettings 聚合拉取);
 * 前端预校验"两端不得相同",后端仍强校验(双保险)。</p>
 *
 * @author Moba
 */

interface Props {
  /** 编辑时的初始关系(新建时省略) */
  initial?: RelationItem;
  /** 提交中(禁用按钮) */
  saving: boolean;
  onSubmit: (req: RelationSaveReq) => void;
  onCancel: () => void;
}

export default function RelationFormDialog({ initial, saving, onSubmit, onCancel }: Props) {
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [fromId, setFromId] = useState(initial?.fromSettingId ? String(initial.fromSettingId) : '');
  const [toId, setToId] = useState(initial?.toSettingId ? String(initial.toSettingId) : '');
  const [relationType, setRelationType] = useState(initial?.relationType ?? '');
  const [seed, setSeed] = useState(initial?.seed ?? false);
  /** 字段级校验错误:挂在对应下拉/输入框下方并标红 */
  const [error, setError] = useState<{ field: 'from' | 'to' | 'type'; msg: string } | null>(null);

  // 拉取本作品全量词条作为两端下拉数据源
  useEffect(() => {
    listSettings()
      .then(setSettings)
      .catch((err) => notifyError(t('lore.setting.loadFailed'), err));
  }, []);

  const submit = (): void => {
    const from = Number.parseInt(fromId, 10);
    const to = Number.parseInt(toId, 10);
    if (!Number.isInteger(from)) {
      setError({ field: 'from', msg: t('lore.relation.bothRequired') });
      return;
    }
    if (!Number.isInteger(to)) {
      setError({ field: 'to', msg: t('lore.relation.bothRequired') });
      return;
    }
    if (from === to) {
      setError({ field: 'to', msg: t('lore.relation.sameEnds') });
      return;
    }
    const trimmedType = relationType.trim();
    if (!trimmedType) {
      setError({ field: 'type', msg: t('lore.relation.typeRequired') });
      return;
    }
    if (trimmedType.length > 64) {
      setError({ field: 'type', msg: t('lore.relation.typeMax') });
      return;
    }
    setError(null);
    onSubmit({ fromSettingId: from, toSettingId: to, relationType: trimmedType, seed });
  };

  /** 词条下拉选项 */
  const options = settings.map((s) => (
    <option key={s.id} value={s.id}>
      {s.name}({t(`lore.category.${s.category}`)})
    </option>
  ));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" aria-hidden />
      <div
        className="sf-panel relative z-10 w-full max-w-md p-5"
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancel();
        }}
      >
        <h2 className="sf-heading mb-4 text-base font-semibold">
          {initial ? t('lore.relation.editTitle') : t('lore.relation.createTitle')}
        </h2>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-[var(--sf-text-dim)]">{t('lore.relation.from')} *</span>
            <span className="sf-select-group">
              <select
                className={`sf-input sf-select min-h-10 ${error?.field === 'from' ? 'sf-input-invalid' : ''}`}
                value={fromId}
                onChange={(e) => setFromId(e.target.value)}
              >
                <option value="">{t('lore.relation.pickSetting')}</option>
                {options}
              </select>
            </span>
            {error?.field === 'from' && (
              <p className="text-xs text-[var(--sf-error)]">{error.msg}</p>
            )}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-[var(--sf-text-dim)]">{t('lore.relation.to')} *</span>
            <span className="sf-select-group">
              <select
                className={`sf-input sf-select min-h-10 ${error?.field === 'to' ? 'sf-input-invalid' : ''}`}
                value={toId}
                onChange={(e) => setToId(e.target.value)}
              >
                <option value="">{t('lore.relation.pickSetting')}</option>
                {options}
              </select>
            </span>
            {error?.field === 'to' && (
              <p className="text-xs text-[var(--sf-error)]">{error.msg}</p>
            )}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-[var(--sf-text-dim)]">{t('lore.relation.type')} *</span>
            <input
              className={`sf-input ${error?.field === 'type' ? 'sf-input-invalid' : ''}`}
              value={relationType}
              maxLength={64}
              placeholder={t('lore.relation.typePlaceholder')}
              onChange={(e) => setRelationType(e.target.value)}
            />
            {error?.field === 'type' && (
              <p className="text-xs text-[var(--sf-error)]">{error.msg}</p>
            )}
          </label>

          {/* 种子锁定:锁定后 AI 只读(M3-② 约束);checkbox 缩至常规尺寸,触控目标由 label 整体保证 */}
          <label className="flex min-h-10 items-center gap-2">
            <input
              type="checkbox"
              className="h-5 w-5 accent-[var(--sf-accent)]"
              checked={seed}
              onChange={(e) => setSeed(e.target.checked)}
            />
            <span className="text-sm">{t('lore.relation.seed')}</span>
          </label>
          <p className="-mt-2 text-xs text-[var(--sf-text-dim)]">{t('lore.relation.seedHint')}</p>

          <div className="flex items-center justify-end gap-2">
            <button type="button" className="sf-btn min-h-10 px-4" disabled={saving} onClick={onCancel}>
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className="sf-btn sf-btn-primary min-h-10 px-5"
              disabled={saving}
              onClick={submit}
            >
              {t('common.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

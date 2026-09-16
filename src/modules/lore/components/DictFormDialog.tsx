import { useState } from 'react';
import { t } from '@/shared/i18n';
import type { DictItem, DictSaveReq, LoreDictType } from '../api';

/**
 * 字典词条新建/编辑弹窗(功能文档 §6.5 字典维护按钮)。
 *
 * <p>字典段锁定为当前浏览段(段切换由页签承担);tier_no 留空追加段尾。
 * 段内重名(40009)由后端拦截,errorToast 直出中文 message。</p>
 *
 * @author Moba
 */

interface Props {
  /** 当前字典段(锁定不可改) */
  dictType: LoreDictType;
  /** 编辑时的初始词条(新建时省略) */
  initial?: DictItem;
  /** 提交中(禁用按钮) */
  saving: boolean;
  onSubmit: (req: DictSaveReq) => void;
  onCancel: () => void;
}

export default function DictFormDialog({ dictType, initial, saving, onSubmit, onCancel }: Props) {
  const [term, setTerm] = useState(initial?.term ?? '');
  const [definition, setDefinition] = useState(initial?.definition ?? '');
  const [tierNo, setTierNo] = useState(initial?.tierNo != null ? String(initial.tierNo) : '');
  /** 字段级校验错误:挂在词条输入框下方并标红 */
  const [error, setError] = useState<{ field: 'term'; msg: string } | null>(null);

  const submit = (): void => {
    const trimmedTerm = term.trim();
    if (!trimmedTerm) {
      setError({ field: 'term', msg: t('lore.dict.termRequired') });
      return;
    }
    if (trimmedTerm.length > 128) {
      setError({ field: 'term', msg: t('lore.dict.termMax') });
      return;
    }
    // tier_no 留空=追加段尾(后端 nextTierNo 兜底)
    const parsedTier = tierNo.trim() === '' ? null : Number.parseInt(tierNo, 10);
    setError(null);
    onSubmit({
      dictType,
      term: trimmedTerm,
      definition: definition.trim() || null,
      tierNo: parsedTier != null && Number.isInteger(parsedTier) ? parsedTier : null,
    });
  };

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
          {initial ? t('lore.dict.editTitle') : t('lore.dict.createTitle')}
        </h2>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-[var(--sf-text-dim)]">{t('lore.dict.dictType')}</span>
            <span className="sf-chip w-fit">{t(`lore.dictType.${dictType}`)}</span>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-[var(--sf-text-dim)]">{t('lore.dict.term')} *</span>
            <input
              className={`sf-input ${error?.field === 'term' ? 'sf-input-invalid' : ''}`}
              value={term}
              maxLength={128}
              autoFocus
              onChange={(e) => setTerm(e.target.value)}
            />
            {error?.field === 'term' && (
              <p className="text-xs text-[var(--sf-error)]">{error.msg}</p>
            )}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-[var(--sf-text-dim)]">{t('lore.dict.definition')}</span>
            <textarea
              className="sf-input min-h-24 resize-y"
              value={definition}
              maxLength={2000}
              placeholder={t('lore.dict.definitionPlaceholder')}
              onChange={(e) => setDefinition(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-[var(--sf-text-dim)]">{t('lore.dict.tierNo')}</span>
            <input
              className="sf-input"
              type="number"
              value={tierNo}
              placeholder={t('lore.dict.tierNoPlaceholder')}
              onChange={(e) => setTierNo(e.target.value)}
            />
          </label>

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

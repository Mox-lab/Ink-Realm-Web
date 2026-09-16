import { useState } from 'react';
import { t } from '@/shared/i18n';
import { LORE_DICT_TYPES, type CandidateAdoptReq, type CandidateItem, type LoreDictType } from '../api';

/**
 * 候选采纳弹窗(功能文档 §6.5 采纳候选按钮)。
 *
 * <p>预填来自候选 payload(DICT_TERM 结构),用户可改段与层级序——
 * 以请求体为准写入字典(后端同事务推进候选状态机 PENDING→APPLIED)。</p>
 *
 * @author Moba
 */

interface Props {
  /** 待采纳候选 */
  candidate: CandidateItem;
  /** 提交中(禁用按钮) */
  saving: boolean;
  onSubmit: (req: CandidateAdoptReq) => void;
  onCancel: () => void;
}

/** 解析 DICT_TERM 载荷(失败返回空对象,表单退化为手填) */
function parsePayload(candidate: CandidateItem): Partial<CandidateAdoptReq> {
  try {
    return JSON.parse(candidate.payload) as Partial<CandidateAdoptReq>;
  } catch {
    return {};
  }
}

export default function AdoptCandidateDialog({ candidate, saving, onSubmit, onCancel }: Props) {
  const prefill = parsePayload(candidate);
  const [dictType, setDictType] = useState<LoreDictType>(prefill.dictType ?? 'realm');
  const [term, setTerm] = useState(prefill.term ?? '');
  const [definition, setDefinition] = useState(prefill.definition ?? '');
  const [tierNo, setTierNo] = useState(prefill.tierNo != null ? String(prefill.tierNo) : '');
  /** 字段级校验错误:挂在词条输入框下方并标红 */
  const [error, setError] = useState<{ field: 'term'; msg: string } | null>(null);

  const submit = (): void => {
    const trimmedTerm = term.trim();
    if (!trimmedTerm) {
      setError({ field: 'term', msg: t('lore.dict.termRequired') });
      return;
    }
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
        className="sf-panel relative z-10 flex max-h-[90vh] w-full max-w-md flex-col overflow-y-auto p-5"
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancel();
        }}
      >
        <h2 className="sf-heading mb-1 text-base font-semibold">{t('lore.candidate.adoptTitle')}</h2>
        {candidate.reason && (
          <p className="mb-4 text-xs leading-relaxed text-[var(--sf-text-dim)]">
            {t('lore.candidate.reason')}: {candidate.reason}
          </p>
        )}

        <div className="flex flex-col gap-4">
          {/* 目标段:预判可改 */}
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-[var(--sf-text-dim)]">{t('lore.dict.dictType')} *</span>
            <span className="sf-select-group">
              <select
                className="sf-input sf-select min-h-10"
                value={dictType}
                onChange={(e) => setDictType(e.target.value as LoreDictType)}
              >
                {LORE_DICT_TYPES.map((dt) => (
                  <option key={dt} value={dt}>
                    {t(`lore.dictType.${dt}`)}
                  </option>
                ))}
              </select>
            </span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-[var(--sf-text-dim)]">{t('lore.dict.term')} *</span>
            <input
              className={`sf-input ${error?.field === 'term' ? 'sf-input-invalid' : ''}`}
              value={term}
              maxLength={128}
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
              {t('lore.candidate.adopt')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

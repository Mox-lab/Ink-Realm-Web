import { useCallback, useEffect, useState } from 'react';
import { t } from '@/shared/i18n';
import { notifyError } from '@/shared/api/errorToast';
import {
  CANDIDATE_STATUSES,
  adoptCandidate,
  listCandidates,
  rejectCandidate,
  type CandidateAdoptReq,
  type CandidateItem,
  type CandidateStatus,
} from '../api';
import AdoptCandidateDialog from './AdoptCandidateDialog';

/**
 * 候选审核区 tab:状态过滤 + 候选卡片 + 忽略/采纳。
 *
 * <p>G3 诚实空态:AI 提取链路 G4 上线,当前队列恒空——空态文案明示,
 * 不做假数据。状态机单向:PENDING → APPLIED/REJECTED,已处理条目只读展示。</p>
 *
 * @author Moba
 */

/** 状态过滤:'all' 表示全部 */
type StatusFilter = CandidateStatus | 'all';

export default function CandidateTab() {
  const [status, setStatus] = useState<StatusFilter>('all');
  const [items, setItems] = useState<CandidateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adopting, setAdopting] = useState<CandidateItem | null>(null);
  const [saving, setSaving] = useState(false);

  /** 拉取候选列表 */
  const reload = useCallback(() => {
    setLoading(true);
    listCandidates(status === 'all' ? undefined : status)
      .then(setItems)
      .catch((err) => notifyError(t('lore.candidate.loadFailed'), err))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => {
    reload();
  }, [reload]);

  /** 忽略候选(PENDING→REJECTED,单向) */
  const ignore = (item: CandidateItem): void => {
    setSaving(true);
    rejectCandidate(item.id)
      .then(reload)
      .catch((err) => notifyError(t('lore.candidate.rejectFailed'), err))
      .finally(() => setSaving(false));
  };

  /** 采纳提交(以弹窗请求体为准) */
  const submitAdopt = (req: CandidateAdoptReq): void => {
    if (!adopting) return;
    setSaving(true);
    adoptCandidate(adopting.id, req)
      .then(() => {
        setAdopting(null);
        reload();
      })
      .catch((err) => notifyError(t('lore.candidate.adoptFailed'), err))
      .finally(() => setSaving(false));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 状态过滤 */}
      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          className={`sf-btn min-h-10 px-3 text-sm ${status === 'all' ? 'sf-btn-primary' : ''}`}
          onClick={() => setStatus('all')}
        >
          {t('lore.candidate.statusAll')}
        </button>
        {CANDIDATE_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            className={`sf-btn min-h-10 px-3 text-sm ${status === s ? 'sf-btn-primary' : ''}`}
            onClick={() => setStatus(s)}
          >
            {t(`lore.candidate.status.${s}`)}
          </button>
        ))}
      </div>

      {/* 候选列表 */}
      {loading ? (
        <p className="py-10 text-center text-sm text-[var(--sf-text-dim)]">{t('common.loading')}</p>
      ) : items.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--sf-text-dim)]">{t('lore.candidate.empty')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id} className="sf-panel flex flex-wrap items-center gap-2 p-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="sf-chip">{t(`lore.candidate.status.${item.status}`)}</span>
                  <span className="text-xs text-[var(--sf-text-dim)]">{item.candidateType}</span>
                </div>
                {item.reason && (
                  <p className="mt-1 line-clamp-1 text-xs text-[var(--sf-text-dim)]">
                    {t('lore.candidate.reason')}: {item.reason}
                  </p>
                )}
              </div>
              {/* 仅 PENDING 可操作(状态机单向) */}
              {item.status === 'PENDING' && (
                <div className="flex flex-none gap-1">
                  <button
                    type="button"
                    className="sf-btn sf-btn-primary min-h-10 px-3 text-sm"
                    disabled={saving}
                    onClick={() => setAdopting(item)}
                  >
                    {t('lore.candidate.adopt')}
                  </button>
                  <button
                    type="button"
                    className="sf-btn min-h-10 px-3 text-sm"
                    disabled={saving}
                    onClick={() => ignore(item)}
                  >
                    {t('lore.candidate.reject')}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* 采纳弹窗 */}
      {adopting && (
        <AdoptCandidateDialog
          candidate={adopting}
          saving={saving}
          onSubmit={submitAdopt}
          onCancel={() => setAdopting(null)}
        />
      )}
    </div>
  );
}

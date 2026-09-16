import { useEffect, useState, type SubmitEvent } from 'react';
import { createPortal } from 'react-dom';
import { t } from '@/shared/i18n';

/**
 * 修改密码弹窗(表单 UI 就绪)。
 *
 * <p>后端 changePassword 端点在后续批次接入;当前提交给出明确提示,
 * 不假装成功(诚实 UI 原则)。</p>
 */
export default function PasswordDialog({ onClose }: { onClose: () => void }) {
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState(false);

  // Esc 关闭
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = (e: SubmitEvent): void => {
    e.preventDefault();
    if (!oldPwd || !newPwd || !confirmPwd) {
      setError(t('password.required'));
      return;
    }
    if (newPwd !== confirmPwd) {
      setError(t('password.mismatch'));
      return;
    }
    if (newPwd.length < 6) {
      setError(t('password.tooShort'));
      return;
    }
    // 接口未接入:清错误,展示提示条(不假装成功)
    setError(null);
    setNotice(true);
  };

  // portal 到 body:脱离顶栏层叠上下文,且避免 fixed 被 backdrop-filter 祖先劫持为相对定位
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('password.title')}
      onClick={onClose}
    >
      <div className="sf-panel w-[400px] max-w-full p-5 sm:p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="sf-heading text-lg">{t('password.title')}</h2>

        {error && (
          <div
            role="alert"
            className="mt-4 flex items-center gap-2 rounded-md bg-[var(--sf-status-error)]/10 px-3 py-2 text-sm text-[var(--sf-status-error)]"
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--sf-status-error)]" />
            {error}
          </div>
        )}
        {notice && (
          <div className="mt-4 rounded-md bg-[var(--sf-input-bg)] px-3 py-2 text-sm text-[var(--sf-text-dim)]">
            {t('password.tip')}
          </div>
        )}

        <form onSubmit={submit} className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-[var(--sf-text-dim)]">{t('password.old')}</span>
            <input
              className="sf-input"
              type="password"
              autoComplete="current-password"
              value={oldPwd}
              onChange={(e) => {
                setOldPwd(e.target.value);
                setError(null);
              }}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-[var(--sf-text-dim)]">{t('password.new')}</span>
            <input
              className="sf-input"
              type="password"
              autoComplete="new-password"
              value={newPwd}
              onChange={(e) => {
                setNewPwd(e.target.value);
                setError(null);
              }}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-[var(--sf-text-dim)]">{t('password.confirmNew')}</span>
            <input
              className="sf-input"
              type="password"
              autoComplete="new-password"
              value={confirmPwd}
              onChange={(e) => {
                setConfirmPwd(e.target.value);
                setError(null);
              }}
            />
          </label>
          <div className="mt-1 flex gap-3">
            <button type="button" className="sf-btn-ghost flex-1" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="sf-btn flex-1">
              {t('common.confirm')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

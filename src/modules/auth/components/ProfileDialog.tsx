import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { SessionUser } from '@/shared/stores/authStore';
import { t } from '@/shared/i18n';

/**
 * 个人信息弹窗(只读展示当前会话用户)。
 *
 * <p>资料编辑/头像上传依赖后端接口(R2 文件存储 + 用户资料更新端点),
 * 后续批次接入;当前仅展示 me() 回填的真实数据。</p>
 */
export default function ProfileDialog({ user, onClose }: { user: SessionUser; onClose: () => void }) {
  // Esc 关闭
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const initial = user.nickname?.[0] ?? user.username[0] ?? '?';

  // portal 到 body:脱离顶栏层叠上下文,且避免 fixed 被 backdrop-filter 祖先劫持为相对定位
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('profile.title')}
      onClick={onClose}
    >
      <div className="sf-panel w-[400px] max-w-full p-5 sm:p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="sf-heading text-lg">{t('profile.title')}</h2>

        {/* 头像 + 名称区 */}
        <div className="mt-5 flex items-center gap-4">
          <span className="sf-avatar h-14 w-14 text-xl">{initial}</span>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-[var(--sf-text)]">
              {user.nickname || user.username}
            </p>
            <p className="mt-0.5 truncate text-xs text-[var(--sf-text-dim)]">@{user.username}</p>
          </div>
        </div>

        {/* 字段列表 */}
        <dl className="mt-5 flex flex-col gap-3 text-sm">
          {[
            [t('profile.username'), user.username],
            [t('profile.nickname'), user.nickname || '—'],
            [t('profile.role'), t(`user.role.${user.role}`)],
            [t('profile.userId'), String(user.id)],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4">
              <dt className="text-[var(--sf-text-dim)]">{label}</dt>
              <dd className="truncate font-medium text-[var(--sf-text)]">{value}</dd>
            </div>
          ))}
        </dl>

        {/* 后续接入提示 */}
        <p className="mt-5 rounded-md bg-[var(--sf-input-bg)] px-3 py-2 text-xs text-[var(--sf-text-dim)]">
          {t('profile.tip')}
        </p>

        <button type="button" className="sf-btn mt-5 w-full" onClick={onClose}>
          {t('common.close')}
        </button>
      </div>
    </div>,
    document.body,
  );
}

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { KeyRound, Languages, LogOut, UserRound } from 'lucide-react';
import { useAuthStore } from '@/shared/stores/authStore';
import { useLang } from '@/shared/i18n/LangContext';
import { t } from '@/shared/i18n';
import ProfileDialog from './ProfileDialog';
import PasswordDialog from './PasswordDialog';

/**
 * 顶栏用户菜单:头像触发器 → 下拉浮框。
 *
 * <p>浮框内容:用户信息头(头像/昵称/角色) + 个人信息 + 修改密码 +
 * 语言切换(中/EN 行内切换) + 登出。悬停头像超 250ms 自动展开,
 * 移出 250ms 后收起(缓冲期供鼠标移入浮框);点击切换/Esc/点击外部关闭;
 * 语言切换从顶栏独立控件收编入浮框(参考通用系统信息区整合惯例)。</p>
 */
export default function UserMenu() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<'profile' | 'password' | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 进入触发器/浮框任一区域:取消收起(缓冲期内折返立即存活)
  const onRootEnter = (): void => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  // 悬停头像 250ms 自动展开;期间移出则取消
  const onTriggerEnter = (): void => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (open) return;
    openTimer.current = setTimeout(() => setOpen(true), 250);
  };

  // 移出触发器+浮框整体区域后 250ms 收起(缓冲期供鼠标移入浮框)
  const onRootLeave = (): void => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (!open) return;
    closeTimer.current = setTimeout(() => setOpen(false), 250);
  };

  // 卸载清理悬停定时器
  useEffect(
    () => () => {
      if (openTimer.current) clearTimeout(openTimer.current);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  // 点击外部 / Esc 关闭浮框
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent): void => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;
  const initial = user.nickname?.[0] ?? user.username[0] ?? '?';

  /** 菜单项通用样式 */
  const itemCls =
    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[var(--sf-text)] transition-colors hover:bg-[var(--sf-input-bg)]';

  return (
    <div ref={rootRef} className="relative" onMouseEnter={onRootEnter} onMouseLeave={onRootLeave}>
      {/* 触发器:纯头像(无箭头),悬停 250ms 自动展开,点击兜底 */}
      <button
        type="button"
        className="rounded-full p-0.5 transition-colors hover:bg-[var(--sf-input-bg)]"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={user.nickname || user.username}
        onMouseEnter={onTriggerEnter}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="sf-avatar h-9 w-9 text-sm">{initial}</span>
      </button>

      {/* 下拉浮框(B 站式:浮出文档流 + 指示箭头) */}
      {open && (
        <div role="menu" className="sf-popover w-72 p-2">
          {/* 用户信息头:大头像横向卡片 */}
          <div className="flex items-center gap-3 px-2 py-3">
            <span className="sf-avatar h-12 w-12 text-lg">{initial}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--sf-text)]">
                {user.nickname || user.username}
              </p>
              <p className="mt-0.5 truncate text-xs text-[var(--sf-text-dim)]">@{user.username}</p>
              <span className="sf-chip mt-1.5">{t(`user.role.${user.role}`)}</span>
            </div>
          </div>

          <div className="my-1 h-px bg-[var(--sf-border)]" />

          {/* 个人信息 */}
          <button
            type="button"
            role="menuitem"
            className={itemCls}
            onClick={() => {
              setOpen(false);
              setDialog('profile');
            }}
          >
            <UserRound size={16} aria-hidden className="text-[var(--sf-text-dim)]" />
            {t('user.menu.profile')}
          </button>

          {/* 修改密码 */}
          <button
            type="button"
            role="menuitem"
            className={itemCls}
            onClick={() => {
              setOpen(false);
              setDialog('password');
            }}
          >
            <KeyRound size={16} aria-hidden className="text-[var(--sf-text-dim)]" />
            {t('user.menu.password')}
          </button>

          {/* 语言切换(行内) */}
          <div className={`${itemCls} justify-between`}>
            <span className="flex items-center gap-2.5">
              <Languages size={16} aria-hidden className="text-[var(--sf-text-dim)]" />
              {t('user.menu.language')}
            </span>
            <span className="flex gap-1" role="group" aria-label={t('lang.switch')}>
              {(['zh', 'en'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  className="rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors"
                  style={
                    lang === l
                      ? {
                          background: 'var(--sf-accent)',
                          color: 'var(--sf-bg)',
                        }
                      : { color: 'var(--sf-text-dim)' }
                  }
                  aria-pressed={lang === l}
                  onClick={() => setLang(l)}
                >
                  {l === 'zh' ? '中文' : 'EN'}
                </button>
              ))}
            </span>
          </div>

          <div className="my-1 h-px bg-[var(--sf-border)]" />

          {/* 登出 */}
          <button
            type="button"
            role="menuitem"
            className={`${itemCls} text-[var(--sf-status-error)]`}
            onClick={() => {
              setOpen(false);
              logout();
              navigate('/login', { replace: true });
            }}
          >
            <LogOut size={16} aria-hidden />
            {t('auth.logout')}
          </button>
        </div>
      )}

      {/* 弹窗层 */}
      {dialog === 'profile' && <ProfileDialog user={user} onClose={() => setDialog(null)} />}
      {dialog === 'password' && <PasswordDialog onClose={() => setDialog(null)} />}
    </div>
  );
}

import { useState, type SubmitEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { tokenStore } from '@/shared/api/token';
import { useAuthStore } from '@/shared/stores/authStore';
import { track } from '@/shared/track';
import { t } from '@/shared/i18n';
import { useLangSync } from '@/shared/i18n/LangContext';
import ThemeSwitcher from '@/shared/ui/ThemeSwitcher';
import LangSwitcher from '@/shared/ui/LangSwitcher';
import { login, register } from '../api';
import { assessPasswordStrength } from '../utils/passwordStrength';

/** 强度条点亮色:弱红/中橙/强绿(主题语义状态色,随主题联动) */
const STRENGTH_COLORS = ['var(--sf-status-error)', 'var(--sf-status-warning)', 'var(--sf-status-success)'] as const;

/** 强度等级对应的 i18n 键(索引即等级 0/1/2) */
const STRENGTH_LABEL_KEYS = ['auth.strength.weak', 'auth.strength.medium', 'auth.strength.strong'] as const;

/**
 * 登录/注册页(功能文档 4.1,双模式同页切换)。
 *
 * <p>验收红线(M0):①凭据错误内联红字不弹窗;②必填缺失内联提示;
 * ③注册两次密码不一致内联提示;④已登录访问重定向 /novels;
 * ⑤Enter 提交;⑥输入即清除错误。</p>
 */
export default function LoginPage() {
  // 订阅语言变更:t() 非响应式,无此订阅则切换语言后页面文本不更新
  useLangSync();
  const navigate = useNavigate();
  const location = useLocation();
  const setUser = useAuthStore((s) => s.setUser);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 密码强度(注册模式实时展示):随输入即时评估,0 弱/1 中/2 强
  const strength = assessPasswordStrength(password);

  // 已登录访问 → 重定向 /novels(P 态)
  const access = tokenStore.getAccess();
  if (access && !tokenStore.isExpired(access)) {
    return <Navigate to="/novels" replace />;
  }

  /** 登录↔注册同页切换,清错误 */
  const switchMode = (): void => {
    if (mode === 'login') track('auth.viewRegister');
    setMode((m) => (m === 'login' ? 'register' : 'login'));
    setError(null);
  };

  /** 提交:非空校验 → 一致性校验(注册) → API → 存令牌 → 跳来源页 */
  const submit = async (e: SubmitEvent): Promise<void> => {
    e.preventDefault();
    if (!username || !password || (mode === 'register' && !confirm)) {
      setError(t('auth.required'));
      return;
    }
    // 前置长度校验:与后端规则一致,不合规直接内联提示,不发请求
    if (username.length < 3 || username.length > 64) {
      setError(t('auth.usernameHint'));
      return;
    }
    if (password.length < 6) {
      setError(t('auth.passwordMin'));
      return;
    }
    if (mode === 'register' && password !== confirm) {
      setError(t('auth.passwordMismatch'));
      return;
    }
    setLoading(true);
    try {
      const result = mode === 'login' ? await login(username, password) : await register(username, password);
      tokenStore.setTokens(result.accessToken, result.refreshToken);
      setUser(result.user);
      track(mode === 'login' ? 'auth.login' : 'auth.register');
      const from = (location.state as { from?: string } | null)?.from ?? '/novels';
      navigate(from, { replace: true });
    } catch (err) {
      // 内联红字不弹窗;ApiError.message 为后端中文描述
      setError(err instanceof Error ? err.message : t('common.networkError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* 柔光背景层(主题令牌光斑) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[var(--sf-accent)] opacity-10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-[var(--sf-accent-2)] opacity-10 blur-3xl"
      />

      {/* 悬浮顶栏:主题/语言切换 */}
      <div className="absolute top-4 right-4 z-10 flex gap-3">
        <ThemeSwitcher />
        <LangSwitcher />
      </div>

      {/* 砚台面板:砚身/墨池颜色随主题(比面板深一档),表单置于墨池 */}
      <div className="sf-inkstone relative z-10 w-[420px] max-w-[90vw] p-6 sm:p-8">
        {/* 砚额品牌区:主标+副标,分层渐入;负 margin 补偿字距造成的视觉偏移 */}
        <header className="text-center">
          <h1 className="sf-ink-title sf-animate-in -mr-[0.25em] text-3xl sm:text-4xl">墨域</h1>
          <p className="sf-animate-in-delay-1 -mr-[0.4em] mt-2 text-xs tracking-[0.4em] text-[var(--sf-accent)] opacity-80">
            INK REALM
          </p>
        </header>

        {/* 砚面分隔:双侧渐变细线 + 菱形印点 */}
        <div aria-hidden className="sf-animate-in-delay-1 my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--sf-accent)]/50" />
          <span className="h-1.5 w-1.5 rotate-45 bg-[var(--sf-accent)]/70" />
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[var(--sf-accent)]/50" />
        </div>

        {/* 墨池:中央凹陷承载表单 */}
        <div className="sf-inkstone-pool sf-animate-in-delay-2 p-5 sm:p-6">

        {/* 内联错误条(圆点+文案,不弹窗) */}
        {error && (
          <div
            role="alert"
            className="mb-4 flex items-center gap-2 rounded-md bg-[var(--sf-status-error)]/10 px-3 py-2 text-sm text-[var(--sf-status-error)]"
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--sf-status-error)]" />
            {error}
          </div>
        )}

        {/* autoComplete="off":禁止浏览器自动填充已保存账密;密码框用 new-password 才能真正抑制 Chrome 填充 */}
        <form onSubmit={submit} autoComplete="off" className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-[var(--sf-text-dim)]">{t('auth.username')}</span>
            <input
              className="sf-input"
              value={username}
              autoComplete="off"
              onChange={(e) => {
                setUsername(e.target.value);
                setError(null);
              }}
            />
            {/* 实时长度提示:非空且不满足 3-64 时红字内联反馈 */}
            {username.length > 0 && (username.length < 3 || username.length > 64) && (
              <span className="text-xs text-[var(--sf-status-error)]">{t('auth.usernameHint')}</span>
            )}
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-[var(--sf-text-dim)]">{t('auth.password')}</span>
            <input
              className="sf-input"
              type="password"
              value={password}
              autoComplete="new-password"
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
            />
            {/* 密码强度条(仅注册模式):三段式 弱红/中橙/强绿,随输入实时点亮 */}
            {mode === 'register' && password.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex flex-1 gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1 flex-1 rounded-full transition-colors"
                      style={{
                        backgroundColor:
                          i <= strength
                            ? STRENGTH_COLORS[strength]
                            : 'rgba(128, 128, 128, 0.25)',
                      }}
                    />
                  ))}
                </div>
                <span className="text-xs" style={{ color: STRENGTH_COLORS[strength] }}>
                  {t(STRENGTH_LABEL_KEYS[strength])}
                </span>
              </div>
            )}
          </label>
          {mode === 'register' && (
            <label className="flex flex-col gap-1">
              <span className="text-sm text-[var(--sf-text-dim)]">{t('auth.confirmPassword')}</span>
              <input
                className="sf-input"
                type="password"
                value={confirm}
                autoComplete="new-password"
                onChange={(e) => {
                  setConfirm(e.target.value);
                  setError(null);
                }}
              />
            </label>
          )}
          <button type="submit" className="sf-btn mt-2" disabled={loading}>
            {mode === 'login' ? t('auth.login') : t('auth.register')}
          </button>
        </form>

        <button
          type="button"
          className="mt-4 w-full text-center text-sm text-[var(--sf-accent)] hover:underline"
          onClick={switchMode}
        >
          {mode === 'login' ? t('auth.viewRegister') : t('auth.viewLogin')}
        </button>
        </div>
      </div>
    </main>
  );
}

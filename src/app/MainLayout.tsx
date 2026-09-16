import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { tokenStore } from '@/shared/api/token';
import { useAuthStore } from '@/shared/stores/authStore';
import { t } from '@/shared/i18n';
import { useLangSync } from '@/shared/i18n/LangContext';
import ThemeSwitcher from '@/shared/ui/ThemeSwitcher';
import UserMenu from '@/modules/auth/components/UserMenu';
import { me } from '@/modules/auth/api';

/**
 * 全局壳(功能文档 4.2 简版):顶栏(品牌印章/主题/用户菜单) + 侧栏 + Outlet。
 *
 * <p>顶栏右侧整合:主题切换独立保留,语言切换/个人信息/修改密码/登出
 * 收编进用户下拉浮框(UserMenu,参考通用系统信息区惯例)。
 * 会话恢复:刷新页面后 Zustand store 清空,凭本地令牌调 /auth/me 回填用户;
 * 令牌失效由 client 拦截器自动刷新或跳 /login。G2 起侧栏按模块扩充。</p>
 *
 * @author Moma
 */
export default function MainLayout() {
  // 订阅语言变更:t() 非响应式,无此订阅则切换语言后壳层文本不更新
  useLangSync();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 刷新页面后会话恢复:store 空 + 本地有令牌 → me() 回填
  useEffect(() => {
    if (!user && tokenStore.getAccess()) {
      me()
        .then(setUser)
        .catch(() => {
          // 401 已由 client 拦截器处理(刷新重放/跳登录);此处仅吞错
        });
    }
  }, [user, setUser]);

  // 移动端抽屉:Esc 关闭 + 开启时锁定 body 滚动
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  /** 侧栏导航内容(桌面侧栏与移动抽屉共用,G2 起扩充) */
  const navContent = (
    <nav className="flex flex-col gap-2">
      <button
        type="button"
        className={`sf-btn min-h-10 justify-start px-3 text-sm ${
          location.pathname.startsWith('/novels') ? 'sf-btn-primary' : ''
        }`}
        aria-current={location.pathname.startsWith('/novels') ? 'page' : undefined}
        onClick={() => {
          setDrawerOpen(false);
          navigate('/novels');
        }}
      >
        {t('nav.novels')}
      </button>
    </nav>
  );

  return (
    <div className="flex min-h-screen flex-col">
      {/* z-30:顶栏含下拉浮框,须整体高于侧栏(sf-panel 的 backdrop-filter 使二者各成层叠上下文,DOM 靠后者默认在上) */}
      <header className="sf-panel relative z-30 flex items-center justify-between rounded-none border-x-0 border-t-0 px-4 py-3 md:px-6">
        <div className="flex items-center gap-1.5">
          {/* 移动端汉堡:窄屏展开侧栏抽屉 */}
          <button
            type="button"
            className="sf-icon-btn p-2 md:hidden"
            aria-label={t('nav.menu')}
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            <Menu size={18} aria-hidden />
          </button>
          {/* 品牌:印章"墨" + 墨域 + INK REALM */}
          <button
            type="button"
            className="flex items-center gap-2.5"
            aria-label={t('brand.name')}
            onClick={() => navigate('/novels')}
          >
            <span className="sf-brand-seal" aria-hidden>
              墨
            </span>
            <span className="flex flex-col items-start gap-1 leading-none">
              <span className="sf-brand-name">{t('brand.name')}</span>
              <span className="text-2xs tracking-[0.3em] text-[var(--sf-text-dim)]">INK REALM</span>
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <UserMenu />
        </div>
      </header>

      <div className="flex flex-1">
        {/* 桌面侧栏(≥md) */}
        <aside className="sf-panel hidden w-48 rounded-none border-y-0 border-l-0 p-4 md:block">
          {navContent}
        </aside>
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      {/* 移动端抽屉(<md):遮罩 + 左侧滑入面板,复用桌面侧栏内容 */}
      <div className="md:hidden">
        {drawerOpen && (
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setDrawerOpen(false)} aria-hidden />
        )}
        <aside
          className={`sf-panel fixed inset-y-0 left-0 z-40 w-60 rounded-none border-y-0 border-r-0 p-4 transition-transform duration-200 ${
            drawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          aria-hidden={!drawerOpen}
        >
          {navContent}
        </aside>
      </div>
    </div>
  );
}

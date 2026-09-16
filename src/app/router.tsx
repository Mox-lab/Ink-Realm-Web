import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, createBrowserRouter } from 'react-router';
import { t } from '@/shared/i18n';
import MainLayout from './MainLayout';
import RequireAuth from './RequireAuth';

/**
 * 应用路由表(G2):登录页无壳,业务页统一挂 MainLayout + RequireAuth 守卫;
 * 工作台(/novels/:novelId/**)额外挂 NovelLayout 注册 X-Novel-Id 隔离键。
 * 页面组件一律路由级懒加载(规范 §9);壳组件直接引入保证首屏不闪。
 *
 * @author Moma
 */

// 页面级懒加载
const LoginPage = lazy(() => import('@/modules/auth/pages/LoginPage'));
const NovelListPage = lazy(() => import('@/modules/novels/pages/NovelListPage'));
const NovelEditPage = lazy(() => import('@/modules/novels/pages/NovelEditPage'));
const NovelLayout = lazy(() => import('./NovelLayout'));
const NovelOverviewPage = lazy(() => import('@/modules/novels/pages/NovelOverviewPage'));
const LorePage = lazy(() => import('@/modules/lore/pages/LorePage'));
const Forbidden = lazy(() => import('./pages/Forbidden'));

/** 懒加载统一包裹 */
const lazyEl = (node: ReactNode): ReactNode => (
  <Suspense fallback={<div className="p-8 text-[var(--sf-text-dim)]">{t('common.loading')}</div>}>
    {node}
  </Suspense>
);

/** 应用路由表 */
export const router = createBrowserRouter([
  // 无壳页:登录/注册、403
  { path: '/login', element: lazyEl(<LoginPage />) },
  { path: '/403', element: lazyEl(<Forbidden />) },
  // 壳内业务页:守卫只拦"完全未登录",过期令牌由 client 拦截器无感续期
  {
    path: '/',
    element: (
      <RequireAuth>
        <MainLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/novels" replace /> },
      // M1 小说管理:列表/创建/编辑(工作台壳外)
      { path: 'novels', element: lazyEl(<NovelListPage />) },
      { path: 'novels/new', element: lazyEl(<NovelEditPage />) },
      { path: 'novels/:novelId/edit', element: lazyEl(<NovelEditPage />) },
      // 工作台壳:注册 X-Novel-Id 隔离键,子路由随批次扩充(writing/lore/chapter…)
      {
        path: 'novels/:novelId',
        element: lazyEl(<NovelLayout />),
        children: [
          { index: true, element: <Navigate to="overview" replace /> },
          { path: 'overview', element: lazyEl(<NovelOverviewPage />) },
          // G3 设定集:设定/字典/关系/候选四页签
          { path: 'lore', element: lazyEl(<LorePage />) },
        ],
      },
    ],
  },
  // 兜底:未知路径回首页(由守卫决定去登录还是业务页)
  { path: '*', element: <Navigate to="/" replace /> },
]);

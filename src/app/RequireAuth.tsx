import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { tokenStore } from '@/shared/api/token';

/**
 * 路由守卫:无本地令牌跳 /login 并记录来源页(登录成功回跳)。
 *
 * <p>令牌存在但已过期仍放行——由 client 拦截器自动刷新重放(无感续期),
 * 刷新也失败时拦截器统一跳 /login;守卫只拦"完全未登录"。</p>
 */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const access = tokenStore.getAccess();
  if (!access) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}

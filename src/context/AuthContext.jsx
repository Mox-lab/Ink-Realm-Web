import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { login as apiLogin, logout as apiLogout, refresh as apiRefresh } from '../api/index.js';
import { tokenStore } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 解析 JWT payload → 构造 user 对象(含 username / nickname / roles)
  // 注意:JWT payload 是 base64url 编码的 UTF-8 JSON。
  // atob 返回的是 Latin1 二进制串,若直接 JSON.parse 会导致中文等非 ASCII
  // 字符乱码(如 "你" 显示为 "ä½ "),故需先还原为字节再以 UTF-8 解码。
  const parseUser = useCallback((access) => {
    try {
      const b64 = access.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const bin = atob(b64);
      const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
      const payload = JSON.parse(new TextDecoder('utf-8').decode(bytes));
      return {
        username: payload.sub,
        // nickname 可能缺失(旧 token),统一回退为空串,由弹窗引导补充
        nickname: payload.nickname || '',
        roles: payload.roles || []
      };
    } catch {
      return null;
    }
  }, []);

  // 解析 JWT 过期时间(exp,秒)。无 exp 字段或解析失败返回 null
  const getExpiry = useCallback((access) => {
    try {
      const b64 = access.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const bin = atob(b64);
      const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
      const payload = JSON.parse(new TextDecoder('utf-8').decode(bytes));
      return typeof payload.exp === 'number' ? payload.exp : null;
    } catch {
      return null;
    }
  }, []);

  // 从 localStorage 恢复登录状态:校验 token 是否过期,过期则尝试 refresh 续期,
  // 续期失败或无 refresh 令牌则清除,交由 ProtectedRoute 跳转登录页。
  useEffect(() => {
    const access = tokenStore.getAccess();
    if (!access) {
      setLoading(false);
      return;
    }
    const parsed = parseUser(access);
    if (!parsed) {
      // token 无法解析,直接视为未登录
      tokenStore.clear();
      setUser(null);
      setLoading(false);
      return;
    }
    const exp = getExpiry(access);
    const now = Date.now() / 1000;
    if (!exp || exp > now) {
      // 未过期(或无过期声明)直接恢复
      setUser(parsed);
      setLoading(false);
      return;
    }
    // access 已过期:尝试用 refresh 续期
    const refreshToken = tokenStore.getRefresh();
    if (!refreshToken) {
      tokenStore.clear();
      setUser(null);
      setLoading(false);
      return;
    }
    apiRefresh(refreshToken)
      .then((data) => setUser(parseUser(data.accessToken)))
      .catch(() => {
        tokenStore.clear();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [parseUser, getExpiry]);

  // 写入 token + 同步 user(登录、昵称更新等统一入口)
  const applyAuthData = useCallback((data) => {
    tokenStore.set(data.accessToken, data.refreshToken);
    setUser(parseUser(data.accessToken));
  }, [parseUser]);

  const login = useCallback(async (username, password) => {
    const data = await apiLogin(username, password);
    applyAuthData(data);
    return data;
  }, [applyAuthData]);

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    applyAuthData
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth 必须在 AuthProvider 内使用');
  return ctx;
}

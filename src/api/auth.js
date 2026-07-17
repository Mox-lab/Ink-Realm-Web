import api, { tokenStore } from './client.js';

/**
 * 登录:用用户名密码换 access + refresh token
 */
export async function login(username, password) {
  // skipErrorToast:登录失败不走全局弹窗,由登录页内联标红展示
  const { data } = await api.post(
    '/auth/login',
    { username, password },
    { skipErrorToast: true }
  );
  tokenStore.set(data.accessToken, data.refreshToken);
  return data;
}

/**
 * 注册:用户名/密码/确认密码,成功后后端直接返回 token,前端无需二次登录。
 * 返回字段与 login 一致(accessToken/refreshToken/expiresIn)。
 */
export async function register(username, password, confirmPassword) {
  const { data } = await api.post(
    '/auth/register',
    { username, password, confirmPassword },
    { skipErrorToast: true }
  );
  tokenStore.set(data.accessToken, data.refreshToken);
  return data;
}

/**
 * 更新昵称:注册后补充昵称(全局唯一),成功后后端重新签发 token 并携带最新昵称。
 * 返回字段与 login 一致(accessToken/refreshToken/expiresIn)。
 */
export async function updateNickname(nickname) {
  const { data } = await api.post(
    '/auth/nickname',
    { nickname },
    { skipErrorToast: true }
  );
  tokenStore.set(data.accessToken, data.refreshToken);
  return data;
}

/**
 * 登出:清空本地 token
 */
export function logout() {
  tokenStore.clear();
}

/**
 * 刷新令牌:用 refreshToken 换新的 access + refresh token。
 * 用于 AuthContext 启动恢复或拦截器外的主动续期。
 */
export async function refresh(refreshToken) {
  const { data } = await api.post('/auth/refresh', { refreshToken });
  tokenStore.set(data.accessToken, data.refreshToken);
  return data;
}


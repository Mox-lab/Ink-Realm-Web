import { client } from '@/shared/api/client';
import type { SessionUser } from '@/shared/stores/authStore';

/**
 * auth 模块 API:注册/登录/刷新/当前用户。
 * client 拦截器已解包 Result,直接返回业务载荷。
 */

/** 登录/注册/刷新响应载荷(与后端 LoginVO 对齐) */
export interface LoginResult {
  /** 访问令牌(2h) */
  accessToken: string;
  /** 刷新令牌(7d) */
  refreshToken: string;
  /** 用户信息 */
  user: SessionUser;
}

/**
 * 注册并自动登录。
 *
 * @param username 用户名
 * @param password 密码
 * @returns 双令牌 + 用户信息
 */
export function register(username: string, password: string): Promise<LoginResult> {
  return client.post('/auth/register', { username, password }).then((r) => r.data);
}

/**
 * 登录。
 *
 * @param username 用户名
 * @param password 密码
 * @returns 双令牌 + 用户信息
 */
export function login(username: string, password: string): Promise<LoginResult> {
  return client.post('/auth/login', { username, password }).then((r) => r.data);
}

/**
 * 当前登录用户(会话恢复用)。
 *
 * @returns 用户信息
 */
export function me(): Promise<SessionUser> {
  return client.get('/auth/me').then((r) => r.data);
}

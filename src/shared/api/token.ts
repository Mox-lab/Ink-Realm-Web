/**
 * tokenStore:双令牌(access 2h / refresh 7d)本地持久化与解析。
 *
 * @author Moma
 */

const ACCESS_KEY = 'ink.access_token';
const REFRESH_KEY = 'ink.refresh_token';

/** JWT 载荷(仅取用字段,其余透传) */
export interface TokenPayload {
  /** 用户 ID(签发时写入) */
  sub: string;
  /** 过期时间(秒级 Unix) */
  exp: number;
  /** 其余自定义声明 */
  [key: string]: unknown;
}

/**
 * 解析 JWT 载荷(仅解码,不验签——验签在后端)。
 *
 * @param token JWT 字符串
 * @returns 载荷对象;非法 token 返回 null
 */
export function parsePayload(token: string): TokenPayload | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    // base64url → JSON
    const json = decodeURIComponent(
      atob(part.replace(/-/g, '+').replace(/_/g, '/'))
        .split('')
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''),
    );
    return JSON.parse(json) as TokenPayload;
  } catch {
    return null;
  }
}

export const tokenStore = {
  /** 读取 access token */
  getAccess(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  },

  /** 读取 refresh token */
  getRefresh(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  },

  /**
   * 持久化双令牌(登录/刷新成功后调用)。
   *
   * @param access  access token
   * @param refresh refresh token
   */
  setTokens(access: string, refresh: string): void {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },

  /** 清空令牌(登出/刷新失败) */
  clear(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },

  /**
   * 判断 access token 是否已过期(提前 10s 判定,防边界竞态)。
   *
   * @param token JWT 字符串
   * @returns true 表示已过期或不可解析
   */
  isExpired(token: string): boolean {
    const payload = parsePayload(token);
    if (!payload) return true;
    return payload.exp * 1000 <= Date.now() + 10_000;
  },
};

import axios, { type AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import { tokenStore } from './token';
import { useNovelStore } from '@/shared/stores/novelStore';

/**
 * 统一 axios 实例(四件套之首,防上帝文件)。
 *
 * <p>职责:注入 Bearer 与 X-Novel-Id、解包 Result、401 刷新队列重放。
 * ⚠️ baseURL 已含 /api,业务路径不得再加 /api 前缀(规范 §8.2 红线)。</p>
 *
 * @author Moma
 */

/** 后端统一响应体结构(判定只认 'code' in body——Jackson non_null 时 data=null 字段不出现) */
interface ResultBody<T> {
  code: number;
  message?: string;
  data?: T;
}

/** 业务错误:code 为后端业务错误码,message 为中文描述 */
export class ApiError extends Error {
  constructor(
    public readonly code: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** 当前刷新中的 Promise(并发 401 只触发一次刷新) */
let refreshing: Promise<string | null> | null = null;

/** axios 实例 */
export const client = axios.create({
  baseURL: '/api',
  timeout: 30_000,
});

// ---- 请求拦截:Bearer + 作品隔离键 ----
client.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // 作品隔离键:G2 起由 novelStore 统一注入(规范前端 §9);store 为纯内存态,卸载/登出即清
  const novelId = useNovelStore.getState().currentNovelId;
  if (novelId) {
    config.headers['X-Novel-Id'] = String(novelId);
  }
  return config;
});

/**
 * 用 refresh token 换新令牌。
 *
 * @returns 新 access token;失败返回 null
 */
async function refreshAccessToken(): Promise<string | null> {
  const refresh = tokenStore.getRefresh();
  if (!refresh) return null;
  try {
    // 用裸 axios 避免走本实例拦截器造成递归
    const res = await axios.post<ResultBody<{ accessToken: string; refreshToken: string }>>(
      '/api/auth/refresh',
      { refreshToken: refresh },
    );
    const body = res.data;
    if (res.status === 200 && 'code' in body && body.code === 0 && body.data) {
      tokenStore.setTokens(body.data.accessToken, body.data.refreshToken);
      return body.data.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 判断是否刷新请求本身(刷新失败的 401 不再重试)。
 *
 * @param config 请求配置
 */
function isRefreshRequest(config: AxiosRequestConfig | undefined): boolean {
  return (config?.url ?? '').includes('/auth/refresh');
}

// ---- 响应拦截:解包 Result + 401 刷新队列 ----
client.interceptors.response.use(
  (res) => {
    const body = res.data as unknown;
    // 响应判定只认 'code' in body(规范红线,勿判 'data' in body)
    if (body && typeof body === 'object' && 'code' in body) {
      const result = body as ResultBody<unknown>;
      if (result.code !== 0) {
        return Promise.reject(new ApiError(result.code, result.message ?? '请求失败'));
      }
      // 解包:调用方直接拿 data
      res.data = result.data;
    }
    return res;
  },
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig | undefined;
    if (error.response?.status === 401 && config && !isRefreshRequest(config)) {
      // 并发 401 共享同一次刷新
      refreshing ??= refreshAccessToken().finally(() => {
        refreshing = null;
      });
      const newToken = await refreshing;
      if (newToken) {
        // 重放原请求
        config.headers.Authorization = `Bearer ${newToken}`;
        return client.request(config);
      }
      // 刷新失败:清令牌回登录页(G1 提供路由)
      tokenStore.clear();
      window.location.href = '/login';
      return Promise.reject(error);
    }
    // 非 401:HTTP 4xx/5xx 但 body 为 Result 结构的业务错误(参数校验 40000/资源不存在 40400 等)
    // 转 ApiError 保留后端中文 message,否则调用方只能拿到 AxiosError 的英文描述
    const body = error.response?.data as unknown;
    if (body && typeof body === 'object' && 'code' in body) {
      const result = body as ResultBody<unknown>;
      if (result.code !== 0) {
        return Promise.reject(new ApiError(result.code, result.message ?? '请求失败'));
      }
    }
    return Promise.reject(error);
  },
);

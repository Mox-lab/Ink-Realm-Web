import { create } from 'zustand';
import { tokenStore } from '@/shared/api/token';
import { useNovelStore } from './novelStore';

/**
 * 会话用户信息(与后端 UserVO 对齐)。
 */
export interface SessionUser {
  /** 用户 ID */
  id: number;
  /** 用户名 */
  username: string;
  /** 昵称(可空) */
  nickname: string | null;
  /** 角色:USER / ADMIN */
  role: string;
}

interface AuthState {
  /** 当前登录用户(null=未登录) */
  user: SessionUser | null;
  /** 写入用户(登录/注册/me 恢复会话后调用) */
  setUser: (user: SessionUser | null) => void;
  /** 登出:清令牌 + 清用户 */
  logout: () => void;
}

/**
 * 会话全局 store(规范 §6:auth 会话属全局高频态,一律 Zustand)。
 */
export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => {
    tokenStore.clear();
    // 同步清理作品隔离键,防残留 X-Novel-Id 影响下一会话请求
    useNovelStore.getState().clearNovel();
    set({ user: null });
  },
}));

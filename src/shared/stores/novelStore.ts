import { create } from 'zustand';

/**
 * 工作台作品上下文 store(规范前端 §9:进入作品后由 store 统一注入 X-Novel-Id,组件勿手动传)。
 *
 * <p>client.ts 拦截器经 getState() 读取本 store 注入请求头。</p>
 *
 * <p>⚠️ 刻意不做 localStorage 持久化(ACC-G2-20260915-01 问题 1):401 硬跳
 * (window.location.href)时组件卸载清理不执行,持久化值会跨会话残留——下一账号
 * 壳外页面请求误带旧 X-Novel-Id,被后端上下文一致性校验拒绝(40001)。
 * 工作台内刷新页面的恢复由 NovelLayout 挂载时从路径参数 setCurrentNovel 完成,
 * 内存态随页面卸载自然清空,无残留窗口。</p>
 *
 * @author Moma
 */
interface NovelState {
  /** 当前工作台作品 ID(null=不在工作台内) */
  currentNovelId: number | null;
  /** 进入工作台时调用:写入 store(NovelLayout 挂载/路径切换时) */
  setCurrentNovel: (id: number) => void;
  /** 离开工作台/登出时调用:清 store */
  clearNovel: () => void;
}

/**
 * 作品上下文全局 store(纯内存态,不持久化)。
 */
export const useNovelStore = create<NovelState>()((set) => ({
  currentNovelId: null,
  setCurrentNovel: (id) => set({ currentNovelId: id }),
  clearNovel: () => set({ currentNovelId: null }),
}));

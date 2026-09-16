import { afterEach, describe, expect, it, vi } from 'vitest';
import { useNovelStore } from './novelStore';

/**
 * novelStore 单测:作品隔离键状态流转与"不持久化"契约。
 *
 * <p>vitest 为 node 环境,模块单例直测。持久化契约(ACC-G2-20260915-01 问题 1):
 * store 刻意不做 localStorage 持久化——401 硬跳时卸载清理不执行,持久化值会跨会话
 * 残留并注入 X-Novel-Id 致壳外页面 40001;工作台刷新恢复由 NovelLayout 挂载承担。
 * 重载模块后必须仍为 null,防止未来误加持久化回归此坑。</p>
 *
 * @author Moma
 */
describe('novelStore 状态流转', () => {
  afterEach(() => {
    // 模块单例状态复位,防用例间污染
    useNovelStore.getState().clearNovel();
    vi.resetModules();
  });

  it('初始为 null(不在工作台内)', () => {
    expect(useNovelStore.getState().currentNovelId).toBeNull();
  });

  it('setCurrentNovel 写入状态', () => {
    useNovelStore.getState().setCurrentNovel(42);
    expect(useNovelStore.getState().currentNovelId).toBe(42);
  });

  it('clearNovel 清空状态', () => {
    useNovelStore.getState().setCurrentNovel(42);
    useNovelStore.getState().clearNovel();
    expect(useNovelStore.getState().currentNovelId).toBeNull();
  });

  it('重载模块后仍为 null(不持久化契约,防硬跳残留跨会话注入)', async () => {
    useNovelStore.getState().setCurrentNovel(42);
    // 模拟整页卸载后重新加载:重载模块,状态必须从零开始
    vi.resetModules();
    const { useNovelStore: reloaded } = await import('./novelStore');
    expect(reloaded.getState().currentNovelId).toBeNull();
  });
});

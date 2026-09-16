import { createContext, useContext, useSyncExternalStore } from 'react';
import { getLang, subscribeLang, type Lang } from './index';

/**
 * 语言上下文:i18n 核心为非响应式设计(模块级 current),
 * 本模块承载 Context 对象与订阅 hook;Provider 组件见 LangProvider.tsx
 * (react-refresh 纪律:组件与 hook 分文件导出)。
 */

export interface LangContextValue {
  /** 当前语言 */
  lang: Lang;
  /** 切换语言(持久化 + 触发重渲染) */
  setLang: (lang: Lang) => void;
}

export const LangContext = createContext<LangContextValue | null>(null);

/**
 * 获取语言上下文(组件内使用)。
 *
 * @returns 当前语言与切换函数
 * @throws 未包裹 LangProvider 时抛错
 */
export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) {
    throw new Error('useLang 必须在 LangProvider 内使用');
  }
  return ctx;
}

/**
 * 语言订阅 hook(非 Context 通道):任何使用 t() 的组件调用即可在
 * 语言切换时触发重渲染——t() 本身非响应式(读模块级 current),
 * 不订阅则切换语言后页面文本不更新。
 *
 * @returns 当前语言
 */
export function useLangSync(): Lang {
  return useSyncExternalStore(subscribeLang, getLang, () => 'zh');
}

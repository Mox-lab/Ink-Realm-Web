/**
 * 自研 i18n 核心:轻量 t() + 语言持久化。
 *
 * <p>字典按语言聚合于 zh/en 目录,G1 起按模块拆文件(规范 §7);
 * 用户可见字符串必须走 t(),禁硬编码中英文。</p>
 *
 * @author Moma
 */

import { dict as zh } from './zh';
import { dict as en } from './en';

/** 支持的语言 */
export type Lang = 'zh' | 'en';

const LANG_KEY = 'ink.lang';

/** 语言字典表 */
const DICTS: Record<Lang, Record<string, string>> = { zh, en };

/** 当前语言(启动时从 localStorage 恢复;node 测试环境无 localStorage 时回退中文) */
let current: Lang =
  (typeof localStorage !== 'undefined' && (localStorage.getItem(LANG_KEY) as Lang)) || 'zh';

/** 语言变更订阅者(供 useSyncExternalStore 派发重渲染) */
const listeners = new Set<() => void>();

/**
 * 切换语言并持久化,同时通知订阅组件。
 *
 * @param lang 目标语言
 */
export function setLang(lang: Lang): void {
  current = lang;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(LANG_KEY, lang);
  }
  // t() 非响应式(读模块级 current),订阅组件经此获得重渲染信号
  listeners.forEach((notify) => notify());
}

/**
 * 订阅语言变更(配合 LangContext 的 useLangSync 使用)。
 *
 * @param notify 变更回调
 * @returns 取消订阅函数
 */
export function subscribeLang(notify: () => void): () => void {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
}

/**
 * 获取当前语言。
 *
 * @returns 当前语言
 */
export function getLang(): Lang {
  return current;
}

/**
 * 翻译:当前语言缺失时回退中文,再缺失返回键名(便于发现死键)。
 *
 * @param key 键名,格式 `<模块>.<语义>` 点分层级
 * @returns 译文
 */
export function t(key: string): string {
  return DICTS[current][key] ?? DICTS.zh[key] ?? key;
}

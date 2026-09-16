import { useState, type ReactNode } from 'react';
import { getLang, setLang, type Lang } from './index';
import { LangContext } from './LangContext';

/**
 * 语言提供者:以 state 驱动重渲染,切换语言后 t() 立即生效。
 * Context 对象与订阅 hook 见 LangContext.ts(react-refresh 纪律:
 * 组件与 hook 分文件导出,保证 Fast Refresh 生效)。
 *
 * @param props.children 子元素
 * @returns Provider
 * @author Moba
 */
export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getLang());

  const switchLang = (next: Lang): void => {
    setLang(next);
    setLangState(next);
  };

  return (
    <LangContext.Provider value={{ lang, setLang: switchLang }}>
      {children}
    </LangContext.Provider>
  );
}

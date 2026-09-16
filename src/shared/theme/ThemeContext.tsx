import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/**
 * 主题上下文:三主题(light 纸墨/dark 石墨/color 晨彩)切换与持久化。
 *
 * <p>机制:将 data-theme 写入 html 根元素,CSS 变量级联生效(规范 §5.1);
 * 偏好持久化 localStorage。组件内禁止直接操作 document 主题属性,统一走本上下文。</p>
 *
 * @author Moma
 */

/** 主题键(联合类型替代 enum,规范 §1.1) */
export type Theme = 'light' | 'dark' | 'color';

const THEME_KEY = 'ink.theme';

/** 上下文载荷 */
interface ThemeContextValue {
  /** 当前主题 */
  theme: Theme;
  /** 切换主题 */
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * 读取 CSS 变量在当前主题下的计算值(SVG/Canvas 取色专用,禁写死色值)。
 *
 * @param name 变量名(如 --sf-accent)
 * @returns 计算后的颜色值
 */
function readToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * 主题提供者。
 *
 * @param props.children 子元素
 * @returns Provider
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(THEME_KEY) as Theme) || 'light',
  );

  // 主题写入根元素,CSS 变量级联生效
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => setThemeState(next), []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * 获取主题上下文(组件内使用)。
 *
 * @returns 主题与切换函数
 * @throws 未包裹 ThemeProvider 时抛错(开发期暴露问题)
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme 必须在 ThemeProvider 内使用');
  }
  return ctx;
}

/**
 * SVG/Canvas 取色:返回当前主题下常用令牌的计算值。
 * 重图形组件(关系图/地图)渲染前调用,主题切换时组件需响应重绘。
 *
 * @returns 关键令牌色值集合
 */
export function useThemeColors() {
  const { theme } = useTheme();
  return useMemo(
    () => ({
      bg: readToken('--sf-bg'),
      panel: readToken('--sf-panel'),
      text: readToken('--sf-text'),
      textDim: readToken('--sf-text-dim'),
      accent: readToken('--sf-accent'),
      accent2: readToken('--sf-accent-2'),
      border: readToken('--sf-border'),
      error: readToken('--sf-status-error'),
      success: readToken('--sf-status-success'),
      warning: readToken('--sf-status-warning'),
      info: readToken('--sf-status-info'),
    }),
    // 主题切换时重新读取计算值(theme 为故意的失效依赖:回调内未直接引用,仅作重算信号)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme],
  );
}

import { Moon, Palette, Sun, type LucideIcon } from 'lucide-react';
import { useTheme, type Theme } from '@/shared/theme/ThemeContext';
import { t } from '@/shared/i18n';

/** 三主题循环序(与 ThemeContext 联合类型同步):纸墨→晨彩→石墨→纸墨(亮→彩→暗,明度直觉) */
const NEXT: Record<Theme, Theme> = { light: 'color', color: 'dark', dark: 'light' };

/** 当前主题图标(lucide-react;currentColor 随 sf-icon-btn 变色) */
const THEME_ICONS: Record<Theme, LucideIcon> = {
  light: Sun,
  color: Palette,
  dark: Moon,
};

/**
 * 主题切换控件(单按钮循环,规范 §5.1;图标预示下一主题——点击即达,
 * aria-label/title 同步提示;落位 MainLayout 与登录页顶栏)。
 */
export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const next = NEXT[theme];
  const label = `${t('theme.switch')} · ${t(`theme.${next}`)}`;
  // 图标展示"下一个待切换主题"(点击后到达的状态),而非当前主题
  const Icon = THEME_ICONS[next];
  return (
    <button
      type="button"
      className="sf-icon-btn p-2"
      aria-label={label}
      title={label}
      onClick={() => setTheme(next)}
    >
      <Icon size={18} strokeWidth={2} aria-hidden />
    </button>
  );
}

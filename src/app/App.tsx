import { RouterProvider } from 'react-router';
import { ThemeProvider } from '@/shared/theme/ThemeContext';
import { LangProvider } from '@/shared/i18n/LangProvider';
import { router } from './router';

/**
 * 根组件:Provider 组装(主题/语言) + 路由入口。
 * 路由表集中在 app/router.tsx(规范 §2),路由级懒加载。
 *
 * @author Moma
 */
export default function App() {
  return (
    <ThemeProvider>
      <LangProvider>
        <RouterProvider router={router} />
      </LangProvider>
    </ThemeProvider>
  );
}

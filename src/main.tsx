import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import App from './app/App';
import '@/shared/styles/index.css';

/**
 * 应用入口:挂载根组件 + 全局 Toast 出口(sonner,规范 §8)。
 *
 * @author Moma
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    {/* 全局唯一错误出口的渲染位;sf-toast 系列类对齐 sf-panel 浮雕语言(语义色只上强调条与图标) */}
    <Toaster
      position="top-center"
      toastOptions={{
        classNames: {
          toast: 'sf-toast',
          error: 'sf-toast-error',
          success: 'sf-toast-success',
          warning: 'sf-toast-warning',
          info: 'sf-toast-info',
        },
      }}
    />
  </StrictMode>,
);

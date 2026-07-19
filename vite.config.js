import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 使用函数式配置,基于 command 区分开发/生产
// (对应《前端规范》五「环境变量-生产构建」:生产关闭 sourcemap 并移除 console/debugger)
export default defineConfig(({ command }) => {
  const isBuild = command === 'build';
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': '/src',
        '@bits': '/src/components/bits'
      }
    },
    build: {
      sourcemap: false
    },
    esbuild: {
      drop: isBuild ? ['console', 'debugger'] : []
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:9688',
          changeOrigin: true
        },
        '/actuator': {
          target: 'http://localhost:9689',
          changeOrigin: true
        },
        '/v3/api-docs': {
          target: 'http://localhost:9688',
          changeOrigin: true
        },
        '/swagger-ui': {
          target: 'http://localhost:9688',
          changeOrigin: true
        }
      }
    }
  };
});

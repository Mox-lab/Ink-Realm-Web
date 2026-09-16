import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

/**
 * Vite 7 工程配置。
 * 别名 @→src;dev 代理 /api→9688、/actuator→9689(后端双端口约定)。
 *
 * @author Moma
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // 业务 API 走后端主端口
      '/api': {
        target: 'http://localhost:9688',
        changeOrigin: true,
      },
      // actuator 监控走独立端口
      '/actuator': {
        target: 'http://localhost:9689',
        changeOrigin: true,
      },
    },
  },
  test: {
    // 纯函数单测,node 环境足够(前端规范 §10)
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

/**
 * Vite 7 工程配置(全项目唯一配置,已删除旧的 vite.config.js)。
 *
 * <p>⚠️ 两个必须注意的点:
 * 1. package.json 为 "type": "module",配置文件以 ESM 加载,**没有 __dirname**,
 *    必须用 import.meta.url 推导绝对路径(用 __dirname 会报 ReferenceError)。
 * 2. Vite 配置文件优先级 vite.config.js > vite.config.ts,旧 .js 残留会让本文件
 *    完全不生效(其 alias/test.include 均为旧代码口径),故必须只保留一份。</p>
 *
 * <p>别名 @→src 与 tsconfig.json 的 paths 保持一致;dev 代理 /api→9688、
 * /actuator→9689(后端双端口约定);生产构建关闭 sourcemap 并移除 console/debugger。</p>
 *
 * @author Moma
 */
// ESM 下推导 src 绝对路径(等价于 CJS 的 __dirname/src)
const srcPath = fileURLToPath(new URL('./src', import.meta.url));

export default defineConfig(({ command }) => {
  const isBuild = command === 'build';
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': srcPath,
      },
    },
    build: {
      sourcemap: false,
    },
    esbuild: {
      drop: isBuild ? ['console', 'debugger'] : [],
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
      // 纯函数单测,node 环境足够(前端规范 §10);include 必须覆盖 .ts,否则 vitest 匹配 0 用例
      environment: 'node',
      include: ['src/**/*.test.{ts,tsx}'],
    },
  };
});

import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

/**
 * ESLint flat config(前端规范 §10)。
 * TS 全量:recommended + 禁 any(error,规范 §1.1 红线)。
 *
 * @author Moma
 */
export default tseslint.config(
  { ignores: ['dist', 'src/types/api.d.ts'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Context 文件的 hook 导出豁免(Provider+useXxx 同文件是 React 官方模式,拆文件损害内聚)
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true, allowExportNames: ['useTheme', 'useThemeColors', 'useLang'] }],
      // 规范 §1.1 红线:禁 any,类型不确定用 unknown + 收窄
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // 类型导入强制 import type(规范 §1.1 第 4 条)
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    },
  },
);

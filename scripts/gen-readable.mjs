// 生成浅色主题(纸墨 light / 晨彩 color)下被稀释状态色工具类的可读覆盖规则。
// 背景:组件普遍使用 text-amber-*/X、border-rose-*/X 等状态色稀释类,在浅色底
// 对比度不足。此处集中(统一管理)将它们重映射为主题可读色。
// 注:text-white/X、cyan-*/X 已全量令牌化为 --sf-text/--sf-accent 任意值类(2026-09-11),
//     本身主题感知可读,不再需要补救,故从清单移除。
// 运行:node scripts/gen-readable.mjs  →  输出 src/styles/theme-readable.css
// @author Moma

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../src/styles/theme-readable.css');

// 从源码提取的去重清单(仅处理会产生颜色/边框的属性;text/border/divide/placeholder)
// 仅保留状态色稀释类(amber/emerald/rose/purple);white/cyan 已令牌化退出
const CLASSES = `
text-amber-200/60 text-amber-200/70 text-amber-200/80 text-amber-300/60 text-amber-300/80
text-emerald-300/60 text-emerald-300/70 text-rose-300/50 text-rose-300/60 text-rose-300/80
border-amber-300/30 border-amber-300/40 border-amber-400/15 border-amber-400/20
border-amber-400/30 border-amber-400/40 border-emerald-300/40
border-emerald-400/10 border-emerald-400/20 border-emerald-400/30 border-purple-300/40
border-rose-300/40 border-rose-400/30
`.trim().split(/\s+/).filter(Boolean);

// 颜色 → 语义状态变量(晨彩用鲜亮状态色;纸墨统一为浓墨,保持单色墨调)
function statusVar(color, theme) {
  if (theme === 'light') return 'var(--sf-text)';
  if (color.startsWith('amber')) return 'var(--sf-status-warning)';
  if (color.startsWith('rose') || color.startsWith('red')) return 'var(--sf-status-error)';
  if (color.startsWith('emerald') || color.startsWith('green')) return 'var(--sf-status-success)';
  if (color.startsWith('violet') || color.startsWith('purple')) return 'var(--sf-status-info)';
  return 'var(--sf-accent)';
}

// 转义为合法 CSS 类选择器(转义 / [ ] .)
function esc(cls) {
  return '.' + cls.replace(/([/[\].])/g, '\\$1');
}

function block(theme, decl) {
  const lines = CLASSES.map((cls) => {
    const segs = cls.split('-');
    const prop = segs[0];
    const realColor = segs.slice(1).join('-');
    let selector = esc(cls);
    let body;
    if (prop === 'text') {
      body = `color: ${decl.text(realColor)};`;
    } else if (prop === 'border') {
      body = `border-color: ${decl.border(realColor)};`;
    } else if (prop === 'placeholder') {
      selector = esc(cls) + '::placeholder';
      body = `color: ${decl.placeholder(realColor)};`;
    } else if (prop === 'divide') {
      selector = esc(cls) + ' > :not(:last-child)';
      body = `border-color: ${decl.border(realColor)};`;
    } else {
      return null;
    }
    return `  [data-theme="${theme}"] ${selector} {\n    ${body}\n  }`;
  }).filter(Boolean);
  return lines.join('\n');
}

// 纸墨:严格单色,所有稀释文本/边框统一加深为浓墨,保证宣纸底可读性
const lightText = () => `color-mix(in oklab, var(--sf-text) 84%, transparent)`;
const lightBorder = () => `var(--sf-border-strong)`;
const lightPlaceholder = () => `color-mix(in oklab, var(--sf-text) 68%, transparent)`;
const light = block('light', { text: lightText, border: lightBorder, placeholder: lightPlaceholder });

// 晨彩:边框加亮为明显柔紫;字体加深/加饱和,提升浅底对比度
const colorText = (c) => `color-mix(in oklab, ${statusVar(c, 'color')} 90%, transparent)`;
const colorBorder = () => `var(--sf-border-bright)`;
const colorPlaceholder = () => `color-mix(in oklab, var(--sf-text) 74%, transparent)`;
const color = block('color', { text: colorText, border: colorBorder, placeholder: colorPlaceholder });

const header = `/**
 * 浅色主题可读覆盖(统一管理)
 * 组件使用的状态色稀释工具类(text-amber-*/X、border-rose-*/X 等)在浅色底
 * 对比度不足,本文件集中将这些类重映射为各浅色主题下的可读色:
 *   - 纸墨(light):严格单色墨调,文本/边框统一加深为浓墨;
 *   - 晨彩(color):边框加亮为明显柔紫,字体加深/加饱和提升对比度。
 * 注:text-white/X、cyan-*/X 已令牌化为 --sf-* 任意值类,主题感知可读,无需补救。
 * 由 scripts/gen-readable.mjs 生成;如需调整映射改脚本后重新生成。
 *
 * @author Moma
 */

/* ================ 纸墨(light):稀释类统一加深 ================ */
${light}

/* ================ 晨彩(color):边框加亮 + 字体加深 ================ */
${color}
`;

writeFileSync(OUT, header, 'utf8');
console.log('written:', OUT, 'rules:', CLASSES.length * 2);

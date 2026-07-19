// 生成浅色主题(水墨 / 泡沫)下被稀释工具类的可读覆盖规则。
// 背景:组件普遍使用 text-white/X、border-cyan-*/X 等,在 @theme 映射下
// 于浅色底被稀释成近乎不可见。此处集中(统一管理)将它们重映射为主题可读色。
// 运行:node scripts/gen-readable.mjs  →  输出 src/styles/theme-readable.css
// @author songshan.li (ID: 17099618)

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../src/styles/theme-readable.css');

// 从源码提取的去重清单(仅处理会产生颜色/边框的属性;text/border/divide/placeholder)
const CLASSES = `
text-amber-200/60 text-amber-200/70 text-amber-200/80 text-amber-300/60 text-amber-300/80
text-cyan-300/0 text-cyan-300/20 text-cyan-300/25 text-cyan-300/40 text-cyan-300/50
text-cyan-300/60 text-cyan-300/70 text-cyan-300/80 text-cyan-300/90
text-emerald-300/60 text-emerald-300/70 text-rose-300/50 text-rose-300/60 text-rose-300/80
text-white/20 text-white/25 text-white/30 text-white/40 text-white/45 text-white/50
text-white/55 text-white/60 text-white/65 text-white/70 text-white/75 text-white/80
text-white/85 text-white/90
border-amber-300/30 border-amber-300/40 border-amber-400/15 border-amber-400/20
border-amber-400/30 border-amber-400/40 border-cyan-300/30 border-cyan-300/40
border-cyan-300/50 border-cyan-300/60 border-cyan-400/10 border-cyan-400/15
border-cyan-400/20 border-cyan-400/30 border-cyan-400/40 border-emerald-300/40
border-emerald-400/10 border-emerald-400/20 border-emerald-400/30 border-purple-300/40
border-rose-300/40 border-rose-400/30 border-white/10 border-white/15 border-white/20 border-white/5
divide-white/5
placeholder-white/30 placeholder-white/40 placeholder-white/50
`.trim().split(/\s+/).filter(Boolean);

// 颜色 → 语义状态变量(泡沫用鲜亮状态色;水墨统一为墨黑,保持单色墨调)
function statusVar(color, theme) {
  if (theme === 'ink') return 'var(--sf-text)';
  if (color.startsWith('cyan') || color.startsWith('blue')) return 'var(--sf-accent)';
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

// 水墨:严格单色,所有稀释文本/边框统一加深为墨黑,保证宣纸底可读性
const inkText = () => `color-mix(in oklab, var(--sf-text) 84%, transparent)`;
const inkBorder = () => `var(--sf-border-strong)`;
const inkPlaceholder = () => `color-mix(in oklab, var(--sf-text) 68%, transparent)`;
const ink = block('ink', { text: inkText, border: inkBorder, placeholder: inkPlaceholder });

// 泡沫:边框加亮为明显紫蓝;字体加深/加饱和,提升浅底对比度
const bubbleText = (c) =>
  c === 'white' ? `color-mix(in oklab, var(--sf-text) 90%, transparent)` : `color-mix(in oklab, ${statusVar(c, 'bubble')} 90%, transparent)`;
const bubbleBorder = () => `var(--sf-border-bright)`;
const bubblePlaceholder = () => `color-mix(in oklab, var(--sf-text) 74%, transparent)`;
const bubble = block('bubble', { text: bubbleText, border: bubbleBorder, placeholder: bubblePlaceholder });

const header = `/**
 * 浅色主题可读覆盖(统一管理)
 * 组件大量使用 text-white/X、border-cyan-*/X 等稀释工具类,在浅色底被稀释成
 * 近乎不可见。本文件集中将这些类重映射为各浅色主题下的可读色:
 *   - 水墨(ink):严格单色墨调,文本/边框统一加深为墨黑;
 *   - 泡沫(bubble):边框加亮为明显紫蓝,字体加深/加饱和提升对比度。
 * 由 scripts/gen-readable.mjs 生成;如需调整映射改脚本后重新生成。
 *
 * @author songshan.li (ID: 17099618)
 */

/* ================ 水墨(ink):稀释类统一加黑 ================ */
${ink}

/* ================ 泡沫(bubble):边框加亮 + 字体加深 ================ */
${bubble}
`;

writeFileSync(OUT, header, 'utf8');
console.log('written:', OUT, 'rules:', CLASSES.length * 2);

import { useEffect, useState } from 'react';

/**
 * 主题设计令牌读取工具。
 * <p>SVG / Canvas / ECharts 等无法直接使用 CSS 变量(token)的场景,
 * 通过本工具读取当前主题下的 --sf-* 令牌值,随主题切换自动更新,
 * 使这些可视化组件的配色也受令牌管控(浅色主题下不再写死科幻青色)。</p>
 *
 * @author songshan.li (ID: 17099618)
 */

function readColors() {
  const cs = getComputedStyle(document.documentElement);
  const r = cs.getPropertyValue('--sf-accent-r').trim() || '56';
  const g = cs.getPropertyValue('--sf-accent-g').trim() || '230';
  const b = cs.getPropertyValue('--sf-accent-b').trim() || '255';
  return {
    r,
    g,
    b,
    /** 强调色 RGB 通道串,用于拼接到 rgba(...) 中 */
    accentRgb: `${r},${g},${b}`,
    /** 生成带透明度的强调色 rgba 字符串 */
    glow: (alpha) => `rgba(${r},${g},${b},${alpha})`,
    /** 主题主文字色(Canvas/SVG 文本应跟随) */
    text: cs.getPropertyValue('--sf-text').trim() || '#fff',
    /** 主题次级文字色(弱化标注) */
    textDim: cs.getPropertyValue('--sf-text-dim').trim() || 'rgba(255,255,255,0.5)',
    /** 主题实底面板色(节点填充等) */
    panelSolid: cs.getPropertyValue('--sf-panel-solid').trim() || '#0a0f1a',
  };
}

/**
 * 订阅主题令牌。主题切换(data-theme 变化)时重新读取,触发组件重渲染。
 * @returns {{r:string,g:string,b:string,accentRgb:string,glow:(a:number)=>string,text:string}}
 */
export function useThemeColors() {
  const [colors, setColors] = useState(readColors);

  useEffect(() => {
    const update = () => setColors(readColors());
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);

  return colors;
}

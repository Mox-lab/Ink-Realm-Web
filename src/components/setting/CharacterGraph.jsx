import { useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useI18n } from '../../context/I18nContext.jsx';
import { buildGraphData } from './struct.js';
import { useThemeColors } from '../../utils/themeColors.js';

const COLOR = {
  character: 'rgba(56,230,255,0.95)',
  faction: 'rgba(245,200,110,0.95)',
};

/**
 * 人物/势力关系力导向图(react-force-graph-2d)。
 * <p>人物与势力为节点,关系(relations)/成员(members)为边;点击节点回调 onSelect。</p>
 *
 * @param {object} props
 * @param {Array} props.list 设定集全量列表
 * @param {(node:object)=>void} props.onSelect 节点点击回调
 * @author songshan.li (ID: 17099618)
 */
export default function CharacterGraph({ list, onSelect }) {
  const { t } = useI18n();
  const { glow, text, accentRgb } = useThemeColors();
  const wrapRef = useRef(null);
  const fgRef = useRef(null);
  const [size, setSize] = useState({ w: 600, h: 420 });
  const [hover, setHover] = useState(null);
  const [selected, setSelected] = useState(null);

  // 节点坐标固化:拖动后的落点 / 引擎停止后的稳定布局都写入此表,
  // 避免 list 重算(保存刷新)或重渲染导致布局"复位"甚至节点丢失。
  const posRef = useRef(new Map());

  const graphData = useMemo(() => {
    const g = buildGraphData(list);
    // 复用上一次记录的有限坐标与固定点(防止 NaN/非有限值污染布局)
    for (const n of g.nodes) {
      const prev = posRef.current.get(n.id);
      if (prev) {
        if (Number.isFinite(prev.x)) n.x = prev.x;
        if (Number.isFinite(prev.y)) n.y = prev.y;
        if (Number.isFinite(prev.fx)) n.fx = prev.fx;
        if (Number.isFinite(prev.fy)) n.fy = prev.fy;
      }
    }
    return g;
  }, [list]);

  // 仅测量真实尺寸并去抖,避免反复 setSize 触发 force-graph 平移视图
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const measure = () => {
      const w = el.clientWidth || 600;
      const h = el.clientHeight || 420;
      setSize((s) => (s.w === w && s.h === h ? s : { w, h }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 固化当前所有节点坐标
  const persistPositions = () => {
    for (const n of graphData.nodes) {
      posRef.current.set(n.id, { x: n.x, y: n.y, fx: n.fx, fy: n.fy });
    }
  };

  const handleClick = (node) => {
    setSelected(node.id);
    onSelect && onSelect(node);
  };

  // 拖动中持续高亮当前节点
  const handleDrag = (node) => {
    setSelected(node.id);
  };

  // 松开后固定落点,避免节点受力飞出视野而"消失"
  const handleDragEnd = (node) => {
    node.fx = node.x;
    node.fy = node.y;
    posRef.current.set(node.id, { x: node.x, y: node.y, fx: node.x, fy: node.y });
  };

  if (graphData.nodes.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded border border-dashed border-cyan-400/10 text-xs text-white/30">
        {t('setting.noGraphData')}
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="h-[60vh] min-h-[360px] w-full overflow-hidden rounded border border-cyan-400/10 bg-black/30">
      <ForceGraph2D
        ref={fgRef}
        width={size.w}
        height={size.h}
        graphData={graphData}
        backgroundColor="rgba(0,0,0,0)"
        nodeRelSize={6}
        nodeLabel={(n) => `${n.label} · ${n.type === 'faction' ? t('setting.faction') : t('setting.catCharacter')}`}
        nodeColor={(n) => (n.id === selected ? text : COLOR[n.type] || `rgb(${accentRgb})`)}
        linkColor={() => glow(0.25)}
        linkWidth={(l) => (l.source?.id === selected || l.target?.id === selected ? 2 : 1)}
        linkLabel={(l) => l.kind || ''}
        onNodeClick={handleClick}
        onNodeHover={setHover}
        onNodeDrag={handleDrag}
        onNodeDragEnd={handleDragEnd}
        onEngineStop={persistPositions}
        // 命中区域与实际绘制的圆形对齐且略放大,保证拖动/点击精准命中,
        // 不会把"拖动节点"误判成"平移画布"导致节点滑出视野
        nodePointerAreaPaint={(node, color, ctx) => {
          const r = node.id === selected ? 9 : 8;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
          ctx.fill();
        }}
        cooldownTicks={120}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const r = node.id === selected ? 7 : 5;
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
          ctx.fillStyle = node.id === selected ? text : COLOR[node.type] || `rgb(${accentRgb})`;
          ctx.fill();
          const label = node.label;
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillStyle = text;
          ctx.fillText(label, node.x, node.y + r + 1);
        }}
      />
    </div>
  );
}

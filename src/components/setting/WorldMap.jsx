import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useI18n } from '../../context/I18nContext.jsx';
import { parseStruct } from './struct.js';
import { useThemeColors } from '../../utils/themeColors.js';

/** 由关键词生成确定性种子,用于手绘 blob 形态稳定。 */
function seededRandom(seed) {
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) % 233280;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/** 生成手绘风不规则多边形路径。 */
function blobPath(cx, cy, r, seed, points = 10) {
  const rand = seededRandom(seed);
  const pts = [];
  for (let i = 0; i < points; i++) {
    const ang = (i / points) * Math.PI * 2;
    const rr = r * (0.72 + rand() * 0.4);
    pts.push([cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr]);
  }
  const line = d3.line().curve(d3.curveCatmullRomClosed.alpha(0.6));
  return line(pts);
}

// 画布尺寸与内边距(归一坐标 0..1 映射到该区域)
const W = 900;
const H = 560;
const PAD = 60;
// 归一坐标允许超出 [0,1],使缩放/平移能在大得多的"世界"中排布区域,
// 而非被钳制在一小块正方形内(缩放很小后只能原地挪动)。
const NORM_MIN = -1;
const NORM_MAX = 3;

/** 归一坐标(x,y)→ 像素坐标。 */
const toPx = (x, y) => ({ x: PAD + x * (W - 2 * PAD), y: PAD + y * (H - 2 * PAD) });
/** 像素坐标 → 归一坐标(宽松钳制,避免极端值跑飞)。 */
const toNorm = (px, py) => ({
  x: Math.min(NORM_MAX, Math.max(NORM_MIN, (px - PAD) / (W - 2 * PAD))),
  y: Math.min(NORM_MAX, Math.max(NORM_MIN, (py - PAD) / (H - 2 * PAD))),
});

/**
 * 虚构世界地图(D3 自绘)。
 * <p>区域来自「地图」分类(归一坐标 x,y),连通用 links;支持缩放/平移,
 * 并可直接用鼠标拖动区域来调整其坐标(拖动结束自动落库)。点击区域仍触发 onSelect。</p>
 *
 * @param {object} props
 * @param {Array} props.list 设定集全量列表
 * @param {(item:object)=>void} [props.onSelect] 区域点击回调
 * @param {(item:object,x:number,y:number)=>void} [props.onMove] 区域拖动结束回调(归一坐标)
 * @author songshan.li (ID: 17099618)
 */
export default function WorldMap({ list, onSelect, onMove }) {
  const { t } = useI18n();
  const svgRef = useRef(null);
  const gRef = useRef(null);
  const [selected, setSelected] = useState(null);
  // 拖动过程中的本地坐标覆盖(id → {x,y}),落库后随 list 变化清空
  const [pos, setPos] = useState({});
  const { glow, text, textDim } = useThemeColors();

  const regions = useMemo(() => {
    return (list || [])
      .filter((i) => parseStruct(i.description).struct === 'map')
      .map((i) => {
        const parsed = parseStruct(i.description);
        return {
          id: i.keyword,
          name: i.keyword,
          x: Number(parsed.data.x ?? 0.5),
          y: Number(parsed.data.y ?? 0.5),
          links: parsed.data.links || [],
          tags: parsed.data.tags || [],
          text: parsed.text,
          raw: i,
        };
      });
  }, [list]);

  // list 变化时清空拖动覆盖,使坐标回退到权威数据
  useEffect(() => {
    setPos({});
  }, [list]);

  // 以 ref 持有最新 onMove,避免拖动绑定 effect 频繁重跑
  const onMoveRef = useRef(onMove);
  useEffect(() => {
    onMoveRef.current = onMove;
  }, [onMove]);

  // 缩放/平移 + 区域拖动
  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;
    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);
    const svgNode = svgRef.current;

    const zoom = d3
      .zoom()
      .scaleExtent([0.4, 4])
      .on('zoom', (e) => g.attr('transform', e.transform));
    svg.call(zoom);

    // 抓取偏移:拖动时区域中心跟随光标,而非瞬移到光标(避免"跳变")
    let grab = { x: 0, y: 0 };
    let moved = false;
    const pointerToNorm = (event, d) => {
      const inv = d3.zoomTransform(svgNode).invert([event.x, event.y]);
      const cx = inv[0] - grab.x;
      const cy = inv[1] - grab.y;
      return toNorm(cx, cy);
    };
    const drag = d3
      .drag()
      .container(svgNode)
      .clickDistance(4)
      .on('start', (event, d) => {
        const inv = d3.zoomTransform(svgNode).invert([event.x, event.y]);
        const cur = toPx(d.x, d.y);
        grab = { x: inv[0] - cur.x, y: inv[1] - cur.y };
        moved = false;
      })
      .on('drag', (event, d) => {
        moved = true;
        const n = pointerToNorm(event, d);
        setPos((p) => ({ ...p, [d.id]: n }));
      })
      .on('end', (event, d) => {
        const n = pointerToNorm(event, d);
        setPos((p) => ({ ...p, [d.id]: n }));
        // 仅在实际拖动后才落库(纯点击只触发 onSelect 选中)
        if (moved) onMoveRef.current && onMoveRef.current(d.raw, n.x, n.y);
      });
    g.selectAll('g.region')
      .data(regions)
      .call(drag);

    return () => {
      svg.on('.zoom', null);
      g.on('.drag', null);
    };
  }, [regions]);

  if (regions.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded border border-dashed border-cyan-400/10 text-xs text-white/30">
        {t('setting.noMapData')}
      </div>
    );
  }

  const byId = Object.fromEntries(regions.map((r) => [r.id, r]));
  const show = (r) => pos[r.id] || { x: r.x, y: r.y };

  return (
    <div className="rounded border border-cyan-400/10 bg-[radial-gradient(circle_at_30%_20%,rgba(var(--sf-accent-r),var(--sf-accent-g),var(--sf-accent-b),0.06),transparent_60%)] bg-black/30 p-2">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="h-[60vh] min-h-[360px] w-full">
        <g ref={gRef}>
          {/* 连线 */}
          {regions.map((r) =>
            (r.links || [])
              .filter((lid) => byId[lid])
              .map((lid) => {
                const a = toPx(show(r).x, show(r).y);
                const b = toPx(show(byId[lid]).x, show(byId[lid]).y);
                const mx = (a.x + b.x) / 2;
                const my = (a.y + b.y) / 2 - 30;
                return (
                  <path
                    key={r.id + '->' + lid}
                    d={`M${a.x},${a.y} Q${mx},${my} ${b.x},${b.y}`}
                    fill="none"
                    stroke={glow(0.3)}
                    strokeDasharray="5 5"
                  />
                );
              })
          )}
          {/* 区域 blob(可拖动) */}
          {regions.map((r) => {
            const p = toPx(show(r).x, show(r).y);
            const isSel = selected === r.id;
            return (
              <g
                key={r.id}
                className="region cursor-grab active:cursor-grabbing"
                transform={`translate(${p.x},${p.y})`}
                onClick={() => {
                  setSelected(r.id);
                  onSelect && onSelect(r);
                }}
              >
                <path
                  d={blobPath(0, 0, 34, r.id)}
                  fill={isSel ? glow(0.28) : glow(0.12)}
                  stroke={isSel ? text : glow(0.6)}
                  strokeWidth={isSel ? 2 : 1.2}
                />
                <text textAnchor="middle" y={4} fontSize="12" fill={text}>
                  {r.name}
                </text>
                {(r.tags || []).slice(0, 1).map((tg, i) => (
                  <text key={i} textAnchor="middle" y={20} fontSize="9" fill={textDim}>
                    {tg}
                  </text>
                ))}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

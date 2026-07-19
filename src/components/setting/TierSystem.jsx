import { useMemo } from 'react';
import { useI18n } from '../../context/I18nContext.jsx';
import { sortedTiers } from './struct.js';

/**
 * 等级 / 境界体系视图(自定义 UI)。
 * <p>按 order 升序渲染阶梯式卡片,含阶位、进度条与描述;不依赖图表库。</p>
 *
 * @param {object} props
 * @param {Array} props.list 设定集全量列表
 * @author songshan.li (ID: 17099618)
 */
export default function TierSystem({ list }) {
  const { t } = useI18n();
  const tiers = useMemo(() => sortedTiers(list), [list]);

  if (tiers.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded border border-dashed border-cyan-400/10 text-xs text-white/30">
        {t('setting.empty')}
      </div>
    );
  }

  return (
    <div className="relative space-y-4 pl-6">
      {/* 中轴线 */}
      <div className="absolute bottom-2 left-[10px] top-2 w-px bg-gradient-to-b from-cyan-300/50 to-transparent" />
      {tiers.map((ti) => {
        const d = ti.data;
        const pct = Math.max(0, Math.min(100, Math.round((Number(d.progress) || 0) * 100)));
        return (
          <div key={ti.raw.id} className="relative">
            <span className="absolute -left-[18px] top-3 h-3 w-3 rounded-full border border-cyan-300/60 bg-cyan-300/30 shadow-[0_0_10px_rgba(var(--sf-accent-r),var(--sf-accent-g),var(--sf-accent-b),0.5)]" />
            <div className="sf-scan rounded border border-cyan-400/15 bg-black/40 p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="font-mono text-2xs tracking-widest text-cyan-300/70">
                  #{String(d.order ?? '?').padStart(2, '0')}
                </span>
                <span className="text-base font-bold text-white">{ti.raw.keyword}</span>
                {d.level != null && (
                  <span className="rounded border border-amber-300/30 bg-amber-300/10 px-1.5 py-0.5 text-2xs text-amber-200/80">
                    {t('setting.level')} {d.level}
                  </span>
                )}
                {(d.tags || []).map((tg) => (
                  <span key={tg} className="rounded bg-white/5 px-1.5 py-0.5 text-2xs text-white/50">
                    {tg}
                  </span>
                ))}
              </div>
              {ti.text && <p className="mb-3 whitespace-pre-wrap text-xs text-white/65">{ti.text}</p>}
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400/70 to-cyan-300 transition-all"
                    style={{ width: pct + '%' }}
                  />
                </div>
                <span className="font-mono text-2xs tracking-widest text-cyan-300/70">{pct}%</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

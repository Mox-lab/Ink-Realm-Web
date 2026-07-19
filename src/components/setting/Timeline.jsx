import { useMemo } from 'react';
import { useI18n } from '../../context/I18nContext.jsx';
import { buildTimeline } from './struct.js';

/**
 * 时间线视图(自定义 UI)。
 * <p>聚合全量设定中的「等级序列」与任意条目携带的 events 数组,按 order/date 排序展示。</p>
 *
 * @param {object} props
 * @param {Array} props.list 设定集全量列表
 * @author songshan.li (ID: 17099618)
 */
export default function Timeline({ list }) {
  const { t } = useI18n();
  const events = useMemo(() => {
    const all = buildTimeline(list);
    return all.sort((a, b) => String(a.era).localeCompare(String(b.era), 'zh'));
  }, [list]);

  if (events.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded border border-dashed border-cyan-400/10 text-xs text-white/30">
        {t('setting.timelineEmpty')}
      </div>
    );
  }

  return (
    <div className="relative space-y-4 pl-6">
      <div className="absolute bottom-2 left-[10px] top-2 w-px bg-gradient-to-b from-cyan-300/50 to-transparent" />
      {events.map((ev, i) => (
        <div key={i} className="relative">
          <span className="absolute -left-[18px] top-3 h-3 w-3 rounded-full border border-cyan-300/60 bg-cyan-300/30" />
          <div className="sf-scan rounded border border-cyan-400/15 bg-black/40 p-3">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              {ev.era && (
                <span className="font-mono text-2xs tracking-widest text-amber-200/80">{ev.era}</span>
              )}
              <span className="text-sm font-bold text-white">{ev.title}</span>
              {ev.cat && (
                <span className="rounded bg-white/5 px-1.5 py-0.5 text-2xs text-white/50">{ev.cat}</span>
              )}
            </div>
            {ev.desc && <p className="whitespace-pre-wrap text-xs text-white/60">{ev.desc}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

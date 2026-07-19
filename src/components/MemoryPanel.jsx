import { useEffect, useState } from 'react';
import { Brain, Users, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { notifyError } from '../api/client.js';
import { listSettingCharacters } from '../api/index.js';
import { parseStruct } from './setting/struct.js';
import { useI18n } from '../context/I18nContext.jsx';

/**
 * 记忆可视化面板(P2 前端面板补齐)。
 * <p>展示设定集「人物」分类中的人物档案,
 * 让作者直观看到"AI 自动从章节中识别并入库了哪些人物"(数据由 LongTermMemoryExtractor 写入)。</p>
 *
 * 数据来源:/api/data/setting/search?category=人物
 */
export default function MemoryPanel() {
  const { t } = useI18n();
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await listSettingCharacters();
      setCharacters(list || []);
    } catch (err) {
      notifyError(t('memory.loadFailed') + ':' + (err.response?.data?.message || err.message), err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="sf-panel-hud p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-3.5 w-3.5 text-cyan-300" />
          <span className="sf-heading text-xs">{t('memory.title')}</span>
        </div>
        <button onClick={load} className="sf-btn-ghost !p-1.5" title={t('common.refresh')}>
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="mb-2 text-xs tracking-wide text-white/40">
        {t('memory.hint').replace('{n}', characters.length)}
      </div>

      {characters.length === 0 ? (
        <div className="py-8 text-center text-white/30">
          <Users className="mx-auto mb-2 h-8 w-8 opacity-40" />
          <div className="text-xs tracking-wide text-white/40">{t('common.empty')}</div>
          <div className="mt-1 text-xs">{t('memory.empty')}</div>
        </div>
      ) : (
        <div className="max-h-80 overflow-y-auto pr-1">
          {characters.map((c) => {
            const parsed = parseStruct(c.description);
            const d = parsed.data || {};
            return (
              <div
                key={c.id}
                className="mb-2 rounded border border-cyan-400/15 bg-black/40 px-3 py-2"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-bold text-cyan-300">{c.keyword}</span>
                  {d.gender ? (
                    <span className="rounded bg-cyan-400/10 px-1.5 py-0.5 text-2xs text-cyan-300/70">
                      {d.gender}
                    </span>
                  ) : null}
                  {d.age ? (
                    <span className="rounded bg-cyan-400/10 px-1.5 py-0.5 text-2xs text-cyan-300/70">
                      {d.age}
                    </span>
                  ) : null}
                  {d.identity ? (
                    <span className="rounded bg-amber-400/10 px-1.5 py-0.5 text-2xs text-amber-300/70">
                      {d.identity}
                    </span>
                  ) : null}
                </div>
                {d.personality ? (
                  <div className="mb-0.5 text-xs text-white/70">
                    <span className="text-white/40">{t('memory.personality')}:</span>
                    {d.personality}
                  </div>
                ) : null}
                {d.weapon ? (
                  <div className="mb-0.5 text-xs text-white/70">
                    <span className="text-white/40">{t('memory.weapon')}:</span>
                    {d.weapon}
                  </div>
                ) : null}
                {d.background ? (
                  <div className="text-xs text-white/60">
                    <span className="text-white/40">{t('memory.background')}:</span>
                    {d.background}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

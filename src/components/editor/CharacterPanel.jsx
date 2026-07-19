import { useEffect, useMemo, useState } from 'react';
import { Loader2, Search, Users } from 'lucide-react';
import { toast } from 'sonner';
import { searchSettingCharacters } from '../../api/data.js';
import { parseStruct } from '../setting/struct.js';
import { useI18n } from '../../context/I18nContext.jsx';

/**
 * 写作侧边栏 - 人物面板(UX-06)。
 * <p>人物数据统一来源于设定集「人物」分类:支持按名搜索,点击插入到正文(@人物)。</p>
 *
 * @param {Object} props
 * @param {(text: string) => void} props.onInsert  插入人物名到正文的回调
 */
export default function CharacterPanel({ onInsert }) {
  const { t } = useI18n();
  const [keyword, setKeyword] = useState('');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  // 防抖搜索设定集「人物」分类
  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await searchSettingCharacters(keyword.trim() || undefined);
        setList(r || []);
      } catch {
        setList([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [keyword]);

  const handleInsert = (name) => {
    if (!name || !onInsert) return;
    onInsert(name);
    toast.success(t('chapter.sidePane.character.inserted'));
  };

  const isEmpty = useMemo(() => !loading && list.length === 0, [loading, list.length]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-cyan-400/10 px-3 py-2">
        <div className="mb-1.5 flex items-center gap-1.5 text-xs tracking-widest text-cyan-300/60">
          <Users className="h-3.5 w-3.5" />
          {t('chapter.sidePane.tab.character')}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-white/30" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={t('chapter.sidePane.character.searchPlaceholder')}
            className="w-full rounded border border-cyan-400/15 bg-black/40 py-1.5 pl-7 pr-2 text-xs text-white/85 placeholder:text-white/30 focus:border-cyan-300/50 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-cyan-300/60">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('common.loading')}
          </div>
        ) : isEmpty ? (
          <div className="py-8 text-center text-xs tracking-wide text-white/30">
            {t('chapter.sidePane.character.empty')}
          </div>
        ) : (
          <ul className="space-y-1.5">
            {list.map((c) => {
              const parsed = parseStruct(c.description);
              const identity = parsed.data?.faction || parsed.data?.identity || '';
              return (
                <li
                  key={c.id}
                  className="rounded border border-cyan-400/10 bg-black/30 transition hover:border-cyan-300/40"
                >
                  <div className="flex items-center gap-2 px-2 py-1.5">
                    <button
                      onClick={() => handleInsert(c.keyword)}
                      className="flex-1 truncate text-left text-xs font-medium text-cyan-200 hover:text-cyan-100 hover:underline"
                      title={c.keyword}
                    >
                      {c.keyword}
                    </button>
                  </div>
                  {identity && (
                    <div className="px-2 pb-1 text-2xs leading-relaxed text-white/40">{identity}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { useI18n } from '../../context/I18nContext.jsx';
import { parseStruct, serializeStruct, defaultStruct, CATEGORY_STRUCT } from './struct.js';

/**
 * 标签编辑器:以 chip 形式管理标签,支持含逗号(逗号不再是分隔符),回车(非输入法组合态)或失焦添加。
 */
function TagInput({ tags, onChange, placeholder }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = draft.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setDraft('');
  };
  return (
    <div>
      {tags.length > 0 && (
        <div className="mb-1 flex flex-wrap gap-1">
          {tags.map((tg) => (
            <span
              key={tg}
              className="flex items-center gap-1 rounded bg-cyan-300/10 px-1.5 py-0.5 text-2xs text-cyan-300"
            >
              {tg}
              <button
                type="button"
                onClick={() => onChange(tags.filter((x) => x !== tg))}
                className="text-cyan-300/60 hover:text-cyan-300"
                aria-label="remove"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          // 输入法组合态下回车用于选词,不可触发添加
          if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
            e.preventDefault();
            add();
          } else if (e.key === 'Backspace' && !draft && tags.length) {
            onChange(tags.slice(0, -1));
          }
        }}
        onBlur={add}
        placeholder={placeholder}
        className="sf-input !py-1 !text-xs"
      />
    </div>
  );
}

/** 属性(key/value)行编辑器。 */
function AttrRows({ attrs, onChange }) {
  const { t } = useI18n();
  const entries = Object.entries(attrs || {});
  const update = (next) => onChange(next);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-2xs tracking-widest text-cyan-300/60">{t('setting.attributes')}</span>
        <button
          type="button"
          onClick={() => update({ ...(attrs || {}), ['属性' + (entries.length + 1)]: 50 })}
          className="font-mono text-2xs text-cyan-300/60 hover:text-cyan-300"
        >
          <Plus className="inline h-3 w-3" /> {t('setting.addAttr')}
        </button>
      </div>
      {entries.map(([k, v]) => (
        <div key={k} className="flex items-center gap-2">
          <input
            value={k}
            onChange={(e) => {
              const next = {};
              for (const [kk, vv] of Object.entries(attrs)) if (kk !== k) next[kk] = vv;
              next[e.target.value] = v;
              update(next);
            }}
            className="sf-input !w-28 !py-1 !text-xs"
            placeholder={t('setting.attrName')}
          />
          <input
            type="range"
            min="0"
            max="100"
            value={Number(v) || 0}
            onChange={(e) => update({ ...(attrs || {}), [k]: Number(e.target.value) })}
            className="flex-1 accent-cyan-400"
          />
          <span className="w-8 text-right font-mono text-2xs text-cyan-300/70">{v}</span>
          <button
            type="button"
            onClick={() => {
              const next = { ...attrs };
              delete next[k];
              update(next);
            }}
            className="text-rose-300/50 hover:text-rose-300"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

/**
 * 关系行编辑器。
 * <p>selfKeyword 用于在下拉候选中排除当前条目自身,避免「自己关联自己」。</p>
 */
function RelationRows({ rows, keywords, selfKeyword, onChange }) {
  const { t } = useI18n();
  const update = (next) => onChange(next);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-2xs tracking-widest text-cyan-300/60">{t('setting.relations')}</span>
        <button
          type="button"
          onClick={() => update([...(rows || []), { target: '', type: '', desc: '' }])}
          className="font-mono text-2xs text-cyan-300/60 hover:text-cyan-300"
        >
          <Plus className="inline h-3 w-3" /> {t('setting.addRelation')}
        </button>
      </div>
      {(rows || []).map((r, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2">
          <select
            value={r.target}
            onChange={(e) => update(rows.map((x, j) => (j === i ? { ...x, target: e.target.value } : x)))}
            className="sf-input !w-28 !py-1 !text-xs"
          >
            <option value="">{t('setting.relTarget')}</option>
            {keywords
              .filter((kw) => kw !== selfKeyword)
              // 已选为其它关系目标的条目不可再次选取:同一对(自身, 目标)仅允许一条关系
              .filter((kw) => !(rows || []).some((x, j) => j !== i && x.target === kw))
              .map((kw) => (
                <option key={kw} value={kw}>
                  {kw}
                </option>
              ))}
          </select>
          <input
            value={r.type}
            onChange={(e) => update(rows.map((x, j) => (j === i ? { ...x, type: e.target.value } : x)))}
            className="sf-input !w-20 !py-1 !text-xs"
            placeholder={t('setting.relType')}
          />
          <input
            value={r.desc}
            onChange={(e) => update(rows.map((x, j) => (j === i ? { ...x, desc: e.target.value } : x)))}
            className="sf-input flex-1 !py-1 !text-xs"
            placeholder={t('setting.relDesc')}
          />
          <button
            type="button"
            onClick={() => update(rows.filter((_, j) => j !== i))}
            className="text-rose-300/50 hover:text-rose-300"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

/**
 * 结构化编辑器。
 * <p>依据分类渲染专属字段(属性/关系/地图坐标/等级进度等),实时序列化回 description 字符串。</p>
 *
 * @param {object} props
 * @param {string} props.category 分类 key
 * @param {string} props.value 当前 description 字符串
 * @param {Array} props.allList 全量设定(用于关系目标/成员/连通下拉)
 * @param {(desc:string)=>void} props.onChange 序列化后的 description 回调
 * @param {string} [props.keyword] 当前条目名称(用于关系下拉排除自身)
 * @author songshan.li (ID: 17099618)
 */
export default function StructEditor({ category, value, allList, onChange, keyword }) {
  const { t } = useI18n();
  const type = CATEGORY_STRUCT[category] || 'other';

  const initial = useMemo(() => {
    const parsed = parseStruct(value);
    if (parsed.struct === type) {
      return { struct: type, text: parsed.text, data: parsed.data };
    }
    const def = defaultStruct(category);
    def.text = parsed.text; // 保留原有纯文本
    return def;
  }, [value, category, type]);

  const [state, setState] = useState(initial);
  const lastEmitted = useRef(null);

  // 仅在「外部」改变 value 时(切换条目)才重置内部状态;自身 commit 引起的 value 回写
  // 不再重置,以避免输入法(IME)组合过程中被强制覆盖、导致中文无法输入。
  useEffect(() => {
    if (value !== lastEmitted.current) setState(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial, value]);

  const commit = (patch) => {
    const next = { ...state, ...patch };
    setState(next);
    const serialized = serializeStruct(next.struct, next.data, next.text);
    lastEmitted.current = serialized;
    onChange(serialized);
  };

  const keywords = useMemo(() => (allList || []).map((i) => i.keyword), [allList]);
  const factionKeywords = useMemo(
    () => (allList || []).filter((i) => i.category === '势力').map((i) => i.keyword),
    [allList]
  );
  const mapKeywords = useMemo(
    () => (allList || []).filter((i) => parseStruct(i.description).struct === 'map').map((i) => i.keyword),
    [allList]
  );
  const { data, text } = state;

  // 势力成员:选中 chip + 未选中的「人物」候选 + 自由输入
  const [memberDraft, setMemberDraft] = useState('');
  const members = data.members || [];
  const addMember = () => {
    const v = memberDraft.trim();
    if (v && !members.includes(v)) commit({ data: { ...data, members: [...members, v] } });
    setMemberDraft('');
  };

  return (
    <div className="space-y-3">
      {/* 标签(允许逗号,以 chip 形式管理) */}
      <div>
        <label className="mb-1 block text-2xs tracking-widest text-cyan-300/60">{t('setting.tags')}</label>
        <TagInput
          tags={data.tags || []}
          onChange={(tags) => commit({ data: { ...data, tags } })}
          placeholder={t('setting.tagPlaceholder')}
        />
      </div>
      <div>
        <label className="mb-1 block text-2xs tracking-widest text-cyan-300/60">{t('setting.descPlaceholder')}</label>
        <textarea
          value={text}
          onChange={(e) => commit({ text: e.target.value })}
          rows={3}
          className="sf-input w-full resize-y !text-xs"
        />
      </div>

      {/* 分类专属字段 */}
      {type === 'character' && (
        <>
          <div>
            <label className="mb-1 block text-2xs tracking-widest text-cyan-300/60">{t('setting.faction')}</label>
            <select
              value={data.faction || ''}
              onChange={(e) => commit({ data: { ...data, faction: e.target.value } })}
              className="sf-input !py-1 !text-xs"
            >
              <option value="">—</option>
              {factionKeywords.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          <RelationRows
            rows={data.relations}
            keywords={keywords}
            selfKeyword={keyword}
            onChange={(relations) => commit({ data: { ...data, relations } })}
          />
        </>
      )}

      {type === 'faction' && (
        <>
          <div>
            <label className="mb-1 block text-2xs tracking-widest text-cyan-300/60">{t('setting.leader')}</label>
            <input
              value={data.leader || ''}
              onChange={(e) => commit({ data: { ...data, leader: e.target.value } })}
              className="sf-input !py-1 !text-xs"
            />
          </div>
          <div>
            <label className="mb-1 block text-2xs tracking-widest text-cyan-300/60">{t('setting.members')}</label>
            {members.length > 0 && (
              <div className="mb-1 flex flex-wrap gap-1">
                {members.map((m) => (
                  <span
                    key={m}
                    className="flex items-center gap-1 rounded border border-cyan-300/40 bg-cyan-300/10 px-2 py-0.5 text-2xs text-cyan-300"
                  >
                    {m}
                    <button
                      type="button"
                      onClick={() => commit({ data: { ...data, members: members.filter((x) => x !== m) } })}
                      className="text-cyan-300/60 hover:text-cyan-300"
                      aria-label="remove"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <input
              value={memberDraft}
              onChange={(e) => setMemberDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  addMember();
                }
              }}
              onBlur={addMember}
              placeholder={t('setting.addMember')}
              className="sf-input mt-1 !py-1 !text-xs"
            />
          </div>
          <RelationRows
            rows={data.relations}
            keywords={keywords}
            selfKeyword={keyword}
            onChange={(relations) => commit({ data: { ...data, relations } })}
          />
        </>
      )}

      {type === 'map' && (
        <>
          <p className="text-2xs text-white/40">{t('setting.mapDragHint')}</p>
          <div>
            <label className="mb-1 block text-2xs tracking-widest text-cyan-300/60">{t('setting.links')}</label>
            <div className="flex flex-wrap gap-1">
              {mapKeywords
                .filter((k) => k !== keyword)
                .map((kw) => {
                  const on = (data.links || []).includes(kw);
                  return (
                    <button
                      key={kw}
                      type="button"
                      onClick={() =>
                        commit({
                          data: {
                            ...data,
                            links: on ? data.links.filter((l) => l !== kw) : [...(data.links || []), kw],
                          },
                        })
                      }
                      className={`rounded border px-2 py-0.5 text-2xs ${
                        on ? 'border-cyan-300/40 bg-cyan-300/10 text-cyan-300' : 'border-cyan-400/15 text-white/50'
                      }`}
                    >
                      {kw}
                    </button>
                  );
                })}
            </div>
          </div>
        </>
      )}

      {type === 'tier' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-2xs tracking-widest text-cyan-300/60">{t('setting.order')}</label>
            <input
              type="number"
              value={Number(data.order ?? 1)}
              onChange={(e) => commit({ data: { ...data, order: Number(e.target.value) || 1 } })}
              className="sf-input !py-1 !text-xs"
            />
          </div>
          <div>
            <label className="mb-1 block text-2xs tracking-widest text-cyan-300/60">{t('setting.level')}</label>
            <input
              type="number"
              value={Number(data.level ?? 1)}
              onChange={(e) => commit({ data: { ...data, level: Number(e.target.value) || 1 } })}
              className="sf-input !py-1 !text-xs"
            />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-2xs tracking-widest text-cyan-300/60">{t('setting.progress')}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={Number(data.progress ?? 0)}
              onChange={(e) => commit({ data: { ...data, progress: Number(e.target.value) } })}
              className="w-full accent-cyan-400"
            />
          </div>
        </div>
      )}

      {(type === 'ability' || type === 'weapon') && (
        <>
          <div>
            <label className="mb-1 block text-2xs tracking-widest text-cyan-300/60">Rank</label>
            <input
              value={data.rank || ''}
              onChange={(e) => commit({ data: { ...data, rank: e.target.value } })}
              className="sf-input !py-1 !text-xs"
              placeholder="S / 神品 / ..."
            />
          </div>
          <AttrRows attrs={data.attrs} onChange={(attrs) => commit({ data: { ...data, attrs } })} />
        </>
      )}
    </div>
  );
}

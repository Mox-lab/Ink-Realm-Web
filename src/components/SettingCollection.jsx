import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Compass, Loader2, Pencil, X, BookMarked, Clock, Network, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { notifyError } from '../api/client.js';
import {
  listSettings,
  saveSetting,
  deleteSetting,
  batchSaveSettings
} from '../api/data.js';
import { generateSetting } from '../api/index.js';
import { useI18n } from '../context/I18nContext.jsx';
import { useNovelId } from '../hooks/useNovelId.js';
import { STORAGE_KEYS } from '../constants/storage.js';
import { parseStruct, serializeStruct, CATEGORY_STRUCT, CATEGORY_POOL, PINNED_CATS, getColumns } from './setting/struct.js';
import StructEditor from './setting/StructEditor.jsx';
import TierSystem from './setting/TierSystem.jsx';
import Timeline from './setting/Timeline.jsx';
import CategoryTable from './setting/CategoryTable.jsx';

// 重图形库(echarts/d3/force-graph)按需懒加载,缩小主包体积
const CharacterGraph = lazy(() => import('./setting/CharacterGraph.jsx'));
const WorldMap = lazy(() => import('./setting/WorldMap.jsx'));

// 分类 key → i18n key 查询表
const LABEL_OF = Object.fromEntries(CATEGORY_POOL.map((c) => [c.key, c.label]));
const labelOf = (key) => LABEL_OF[key] || 'setting.catOther';

// 启用分类的存储 key(按小说隔离)
const catsKey = (novelId) => `${STORAGE_KEYS.SETTING_CATS}__${novelId}`;

/**
 * 依据 AI 设定 markdown 的一级/二级标题推断所属分类。
 * <p>支持全部可选分类,使 AI 导入能精确归类(如「等级/境界」不再误入「能力」)。</p>
 */
function mapCategory(title) {
  if (/人物|角色|主角|配角|男主|女主/.test(title)) return '人物';
  if (/势力|阵营|门派|宗门|家族|王朝|帝国/.test(title)) return '势力';
  if (/地理|地图|时空|世界|背景|疆域|地域|大陆/.test(title)) return '地图';
  if (/种族|血脉|异族|妖族/.test(title)) return '种族';
  if (/职业|身份|职位|工种/.test(title)) return '职业';
  if (/物品|宝物|道具|神兵|法器|灵材/.test(title)) return '物品';
  if (/功法|秘籍|武学|术法|技能|法则/.test(title)) return '功法';
  if (/丹药|灵药|药剂|药方/.test(title)) return '丹药';
  if (/灵兽|妖兽|魔宠|坐骑|异兽/.test(title)) return '灵兽';
  if (/事件|战役|剧情|纪元|年表/.test(title)) return '事件';
  if (/组织|公会|联盟|集团|公司|机构/.test(title)) return '组织';
  if (/货币|经济|财富|交易/.test(title)) return '货币';
  if (/文化|风俗|宗教|语言|礼教/.test(title)) return '文化';
  if (/等级|境界|修为|阶位|品阶/.test(title)) return '等级';
  if (/力量|能力|体系|科技|魔法|元素|能量/.test(title)) return '能力';
  if (/武器|兵刃|枪械/.test(title)) return '武器';
  return '其他';
}

/**
 * 把 AI 设定 markdown 解析为结构化条目 [{category, keyword, description}]。
 */
function parseSettingMarkdown(md) {
  const lines = (md || '').split(/\r?\n/);
  const blocks = [];
  let curH2 = '';
  let curH3 = '';
  let buf = [];
  const flush = () => {
    const text = buf.join('\n').trim();
    if (text) blocks.push({ h2: curH2, h3: curH3, text });
    buf = [];
  };
  for (const line of lines) {
    if (/^##\s+/.test(line)) {
      flush();
      curH2 = line.replace(/^#+\s*/, '').trim();
      curH3 = '';
    } else if (/^###\s+/.test(line)) {
      flush();
      curH3 = line.replace(/^#+\s*/, '').trim();
    } else {
      buf.push(line);
    }
  }
  flush();

  const bulletRe = /^\s*[-*]\s*(.+?)\s*[—–-]\s*(.+)$/;
  const entries = [];
  for (const b of blocks) {
    const cat = mapCategory(b.h2 || b.h3 || '');
    const inner = b.text.split(/\r?\n/);
    const bullets = inner.filter((l) => bulletRe.test(l));
    if (bullets.length >= 2) {
      for (const bl of bullets) {
        const m = bl.match(bulletRe);
        entries.push({ category: cat, keyword: m[1].trim(), description: m[2].trim() });
      }
    } else {
      const kw = (b.h3 || b.h2 || '未命名').replace(/^#+\s*/, '').trim();
      entries.push({ category: cat, keyword: kw, description: b.text });
    }
  }
  return entries;
}

/**
 * 设定集组件。
 * <p>作为「设定」页核心区:分类标签由用户按当前小说勾选启用(管理标签),
 * 未启用的概念(如都市言情的「等级」)不展示;并为人物(关系图+雷达)、
 * 地图(D3)、等级(境界体系)、其余分类(百科卡片)提供专属可视化;另含全局「时间线」。</p>
 *
 * @author songshan.li (ID: 17099618)
 */
export default function SettingCollection() {
  const { t } = useI18n();
  const novelId = useNovelId();
  const storageKey = catsKey(novelId);

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [activeCat, setActiveCat] = useState('人物');
  const [timelineMode, setTimelineMode] = useState(false);
  const [draft, setDraft] = useState({ keyword: '', category: '人物', description: '' });
  const [editingId, setEditingId] = useState(null);

  // AI 生成相关态
  const [aiBlueprint, setAiBlueprint] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewBusy, setPreviewBusy] = useState(false);

  // 关系图选中节点
  const [selectedNode, setSelectedNode] = useState(null);

  // 标签管理
  const [manageOpen, setManageOpen] = useState(false);
  const [enabledCats, setEnabledCats] = useState([...PINNED_CATS]);
  const [catsReady, setCatsReady] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await listSettings();
      const arr = Array.isArray(data) ? data : [];
      setList(arr);
      return arr;
    } catch (err) {
      notifyError(t('setting.loadFailed') + ':' + (err.response?.data?.message || err.message), err);
      return [];
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  };

  /**
   * 保存 / 导入后,依据最新列表刷新上方关系图选中节点的展示数据。
   * <p>人物 / 势力分类会在右侧面板展示选中节点的势力 / 关系等信息,
   * 旧的自动选中逻辑仅在分类类型变化时才重选,导致编辑保存后展示与库内数据不一致。</p>
   */
  const syncSelectedFromList = (arr) => {
    if (activeCat !== '人物' && activeCat !== '势力') return;
    const targetType = activeCat === '人物' ? 'character' : 'faction';
    const savedKw = (draft.keyword || '').trim();
    let item = (arr || []).find(
      (i) => i.keyword === savedKw && parseStruct(i.description).struct === targetType
    );
    if (!item) item = (arr || []).find((i) => parseStruct(i.description).struct === targetType);
    if (item) {
      setSelectedNode({
        id: 'n_' + item.keyword,
        label: item.keyword,
        type: targetType,
        raw: item,
        data: parseStruct(item.description).data
      });
    } else {
      setSelectedNode(null);
    }
  };

  // 切换小说时重置并重新加载
  useEffect(() => {
    setLoaded(false);
    setCatsReady(false);
    setEnabledCats([...PINNED_CATS]);
    setActiveCat('人物');
    setTimelineMode(false);
    setSelectedNode(null);
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [novelId]);

  // 初始化启用的分类:优先取本地存储;首次进入则按「固定分类 ∪ 已有数据的分类」推断
  useEffect(() => {
    if (!loaded || catsReady) return;
    let stored = null;
    try {
      stored = localStorage.getItem(storageKey);
    } catch {
      /* 忽略存储异常 */
    }
    if (stored !== null) {
      try {
        const arr = JSON.parse(stored);
        if (Array.isArray(arr) && arr.length) {
          setEnabledCats(arr);
          setCatsReady(true);
          return;
        }
      } catch {
        /* 落败则走默认推断 */
      }
    }
    const present = new Set(
      (list || []).filter((i) => CATEGORY_STRUCT[i.category]).map((i) => i.category)
    );
    const def = CATEGORY_POOL.filter((c) => PINNED_CATS.includes(c.key) || present.has(c.key)).map(
      (c) => c.key
    );
    try {
      localStorage.setItem(storageKey, JSON.stringify(def));
    } catch {
      /* 忽略存储异常 */
    }
    setEnabledCats(def);
    setCatsReady(true);
  }, [loaded, catsReady, storageKey, list]);

  // 持久化启用的分类
  const persistEnabled = (next) => {
    setEnabledCats(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* 忽略存储异常 */
    }
  };

  const enabledKeys = useMemo(() => new Set(enabledCats), [enabledCats]);
  const enabledList = useMemo(
    () => CATEGORY_POOL.filter((c) => enabledKeys.has(c.key)),
    [enabledKeys]
  );

  // 按分类分组展示
  const grouped = useMemo(() => {
    const m = {};
    for (const c of CATEGORY_POOL) m[c.key] = [];
    for (const it of list) {
      const cat = it.category && m[it.category] ? it.category : '其他';
      m[cat].push(it);
    }
    return m;
  }, [list]);

  // 标签栏展示所有「已启用」分类:固定分类(pinned) + 有数据自动启用 + 用户在「管理标签」中显式启用的空分类。
  // 不再以「是否有数据」二次过滤,使「管理标签」中对空分类的启用能立即在标签栏生效(否则勾选后标签仍不出现)。
  const visibleCats = enabledList;

  // 当前激活分类若被关闭,回退到固定分类
  useEffect(() => {
    if (enabledKeys.size && !enabledKeys.has(activeCat)) {
      setActiveCat(PINNED_CATS[0] || '人物');
      setSelectedNode(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabledKeys, activeCat]);

  // 当前激活分类若无数据且非固定(已被隐藏),回退到首个可见分类
  useEffect(() => {
    if (visibleCats.length && !visibleCats.some((c) => c.key === activeCat)) {
      setActiveCat(visibleCats[0].key);
      setSelectedNode(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleCats, activeCat]);

  const currentList = grouped[activeCat] || [];

  // 切到「人物」/「势力」时默认选中该分类首个节点,使关系图侧栏有内容
  useEffect(() => {
    if (activeCat !== '人物' && activeCat !== '势力') return;
    const targetType = activeCat === '人物' ? 'character' : 'faction';
    // 已选中同类型节点则保持;切换分类时重选为对应类型
    if (selectedNode && selectedNode.type === targetType) return;
    const first = (grouped[activeCat] || []).find(
      (i) => parseStruct(i.description).struct === targetType
    );
    if (first) {
      setSelectedNode({
        id: 'n_' + first.keyword,
        label: first.keyword,
        type: targetType,
        raw: first,
        data: parseStruct(first.description).data
      });
    } else if (selectedNode) {
      setSelectedNode(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCat, list]);

  const startEdit = (item) => {
    setEditingId(item.id ?? null);
    setDraft({
      keyword: item.keyword || '',
      category: item.category || activeCat,
      description: item.description || ''
    });
  };
  const resetDraft = () => {
    setEditingId(null);
    setDraft({ keyword: '', category: activeCat, description: '' });
  };

  const saveDraft = async () => {
    if (!draft.keyword.trim()) {
      toast.error(t('setting.keywordRequired'));
      return;
    }
    try {
      await saveSetting({
        id: editingId ?? undefined,
        keyword: draft.keyword.trim(),
        category: draft.category,
        description: draft.description.trim()
      });
      toast.success(t('common.save') + ' ✓');
      const fresh = await refresh();
      // 保存后自动刷新上方展示数据(关系图选中节点信息)
      syncSelectedFromList(fresh);
      resetDraft();
    } catch (err) {
      notifyError(t('setting.saveFailed') + ':' + (err.response?.data?.message || err.message), err);
    }
  };

  const removeItem = async (id) => {
    try {
      await deleteSetting(id);
      setList((prev) => prev.filter((x) => x.id !== id));
      toast.success(t('common.delete') + ' ✓');
    } catch (err) {
      notifyError(t('common.deleteFailed') + ':' + (err.response?.data?.message || err.message), err);
    }
  };

  /**
   * 地图区域拖动结束回调:把归一化坐标(x,y∈[0,1])写回该地图条目并落库。
   * @param {object} item 被拖动的地图设定条目(raw)
   * @param {number} x 归一化横坐标
   * @param {number} y 归一化纵坐标
   */
  const handleMapMove = async (item, x, y) => {
    if (!item) return;
    const parsed = parseStruct(item.description);
    const data = { ...parsed.data, x: Number(x), y: Number(y) };
    const description = serializeStruct(parsed.struct || 'map', data, parsed.text);
    // 乐观更新本地列表,使地图即时反映新位置
    setList((prev) => prev.map((it) => (it.id === item.id ? { ...it, description } : it)));
    try {
      await saveSetting({ id: item.id, keyword: item.keyword, category: item.category, description });
    } catch (err) {
      notifyError(t('setting.saveFailed') + ':' + (err.response?.data?.message || err.message), err);
    }
  };

  // AI 生成 → 解析 markdown → 预览(供用户确认后入库)
  const genAndPreview = async () => {
    if (!aiBlueprint.trim()) {
      toast.error(t('setting.blueprintRequired'));
      return;
    }
    setAiLoading(true);
    setPreviewBusy(true);
    try {
      const md = await generateSetting(aiBlueprint.trim());
      setPreview(parseSettingMarkdown(md || ''));
    } catch (err) {
      notifyError(t('setting.genFailed') + ':' + (err.response?.data?.message || err.message), err);
    } finally {
      setAiLoading(false);
      setPreviewBusy(false);
    }
  };

  // 预览确认 → 批量入库
  const savePreview = async () => {
    if (!preview || preview.length === 0) return;
    setPreviewBusy(true);
    try {
      await batchSaveSettings(
        preview.map((e) => ({
          keyword: e.keyword,
          category: e.category,
          description: e.description
        }))
      );
      toast.success(t('setting.imported'));
      setPreview(null);
      setAiBlueprint('');
      const fresh = await refresh();
      // 导入后同样同步上方展示
      syncSelectedFromList(fresh);
    } catch (err) {
      notifyError(t('setting.saveFailed') + ':' + (err.response?.data?.message || err.message), err);
    } finally {
      setPreviewBusy(false);
    }
  };

  const updatePreviewItem = (idx, patch) => {
    setPreview((prev) => prev.map((e, i) => (i === idx ? { ...e, ...patch } : e)));
  };
  const removePreviewItem = (idx) => {
    setPreview((prev) => prev.filter((_, i) => i !== idx));
  };

  // 切换某分类启用状态(固定分类不可关闭)
  const toggleCat = (key) => {
    if (PINNED_CATS.includes(key)) return;
    const next = enabledKeys.has(key)
      ? enabledCats.filter((k) => k !== key)
      : [...enabledCats, key];
    persistEnabled(next);
  };

  // ====== 分类专属视图 ======
  const renderBody = () => {
    if (timelineMode) return <Timeline list={list} />;

    if (activeCat === '人物' || activeCat === '势力') {
      const sel = selectedNode?.type === 'character' ? selectedNode : null;
      const selFaction = selectedNode?.type === 'faction' ? selectedNode : null;
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
            <CharacterGraph list={list} onSelect={setSelectedNode} />
            <div className="sf-panel-hud space-y-3 p-4">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-cyan-300" />
                <span className="text-sm font-bold text-white">
                  {sel ? sel.label : selFaction ? selFaction.label : t('setting.pickNode')}
                </span>
                {selectedNode && (
                  <button onClick={() => startEdit(selectedNode.raw)} className="sf-btn-ghost ml-auto" title={t('common.edit')}>
                    <Pencil className="h-3 w-3" />
                  </button>
                )}
              </div>
              {sel && (
                <>
                  {sel.data.faction && (
                    <div className="text-xs text-white/60">
                      <span className="text-cyan-300/60">{t('setting.faction')}:</span> {sel.data.faction}
                    </div>
                  )}
                  {(sel.data.relations || []).length > 0 && (
                    <div>
                      <div className="mb-1 text-2xs tracking-widest text-cyan-300/60">{t('setting.relations')}</div>
                      <ul className="space-y-1">
                        {(sel.data.relations || []).map((r, i) => (
                          <li key={i} className="rounded border border-cyan-400/15 bg-black/40 px-2 py-1 text-2xs text-white/60">
                            <span className="text-cyan-300/80">{r.type}</span> → {r.target}
                            {r.desc ? <span className="text-white/40"> · {r.desc}</span> : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
              {selFaction && (
                <>
                  {selFaction.data.leader && (
                    <div className="text-xs text-white/60">
                      <span className="text-cyan-300/60">{t('setting.leader')}:</span> {selFaction.data.leader}
                    </div>
                  )}
                  {(selFaction.data.members || []).length > 0 && (
                    <div className="text-xs text-white/60">
                      <span className="text-cyan-300/60">{t('setting.members')}:</span> {(selFaction.data.members || []).join('、')}
                    </div>
                  )}
                  {(selFaction.data.relations || []).length > 0 && (
                    <ul className="space-y-1">
                      {(selFaction.data.relations || []).map((r, i) => (
                        <li key={i} className="rounded border border-cyan-400/15 bg-black/40 px-2 py-1 text-2xs text-white/60">
                          <span className="text-cyan-300/80">{r.type}</span> → {r.target}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
              {!selectedNode && (
                <div className="text-xs text-white/30">{t('setting.graphHint')}</div>
              )}
            </div>
          </div>
          <CategoryTable items={currentList} columns={getColumns(activeCat)} onEdit={startEdit} onDelete={removeItem} />
        </div>
      );
    }

    if (activeCat === '地图') {
      return (
        <div className="space-y-4">
          <WorldMap list={list} onSelect={(r) => startEdit(r.raw)} onMove={handleMapMove} />
          <CategoryTable items={currentList} columns={getColumns('地图')} onEdit={startEdit} onDelete={removeItem} />
        </div>
      );
    }

    if (activeCat === '等级') {
      return (
        <div className="space-y-4">
          <TierSystem list={list} />
          <CategoryTable items={currentList} columns={getColumns('等级')} onEdit={startEdit} onDelete={removeItem} />
        </div>
      );
    }

    // 其余分类 → 配置驱动分化表格(各分类按列配置呈现专属字段)
    return (
      <CategoryTable
        items={currentList}
        columns={getColumns(activeCat)}
        onEdit={startEdit}
        onDelete={removeItem}
      />
    );
  };

  return (
    <div className="space-y-4">
      {/* 分类切换 + 标签管理 + 时间线入口 */}
      <div className="sf-scroll-x flex items-center gap-2 overflow-x-auto pb-1">
        {visibleCats.map((c) => {
          const active = activeCat === c.key && !timelineMode;
          const count = (grouped[c.key] || []).length;
          return (
            <button
              key={c.key}
              onClick={() => {
                setTimelineMode(false);
                setActiveCat(c.key);
              }}
              className={`flex shrink-0 items-center gap-1.5 rounded border px-3 py-1.5 text-xs tracking-wider transition ${
                active
                  ? 'border-cyan-300/40 bg-cyan-300/10 text-cyan-300'
                  : 'border-cyan-400/15 bg-transparent text-white/50 hover:border-cyan-300/40 hover:text-cyan-300'
              }`}
            >
              <span>{t(c.label)}</span>
              {count > 0 && (
                <span className="rounded bg-cyan-300/15 px-1 font-mono text-2xs text-cyan-300/80">{count}</span>
              )}
            </button>
          );
        })}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            onClick={() => setManageOpen((v) => !v)}
            className={`flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs tracking-wider transition ${
              manageOpen
                ? 'border-cyan-300/40 bg-cyan-300/10 text-cyan-300'
                : 'border-cyan-400/15 bg-transparent text-white/50 hover:border-cyan-300/40 hover:text-cyan-300'
            }`}
            title={t('setting.manageTags')}
          >
            <Settings className="h-3.5 w-3.5" />
            {t('setting.manageTags')}
          </button>
          <button
            onClick={() => setTimelineMode((v) => !v)}
            className={`flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs tracking-wider transition ${
              timelineMode
                ? 'border-cyan-300/40 bg-cyan-300/10 text-cyan-300'
                : 'border-cyan-400/15 bg-transparent text-white/50 hover:border-cyan-300/40 hover:text-cyan-300'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            {t('setting.viewTimeline')}
          </button>
        </div>
      </div>

      {/* 标签管理面板 */}
      {manageOpen && (
        <div className="sf-panel-hud p-4">
          <div className="mb-3 text-2xs tracking-widest text-white/40">{t('setting.manageTagsHint')}</div>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_POOL.map((c) => {
              const on = enabledKeys.has(c.key);
              const pinned = PINNED_CATS.includes(c.key);
              return (
                <button
                  key={c.key}
                  type="button"
                  disabled={pinned}
                  onClick={() => toggleCat(c.key)}
                  className={`flex items-center gap-1 rounded border px-2.5 py-1 text-xs transition ${
                    on
                      ? 'border-cyan-300/40 bg-cyan-300/10 text-cyan-300'
                      : 'border-cyan-400/15 text-white/40 hover:border-cyan-300/40 hover:text-cyan-300'
                  } ${pinned ? 'cursor-not-allowed opacity-70' : ''}`}
                  title={pinned ? t('setting.tagPinned') : t(labelOf(c.key))}
                >
                  <span>{t(c.label)}</span>
                  {pinned && <span className="text-2xs text-cyan-300/50">·{t('setting.tagPinned')}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 专属可视化视图 */}
      <div className="sf-panel-hud p-4">
        <Suspense
          fallback={
            <div className="flex h-40 items-center justify-center text-white/30">
              <Loader2 className="h-5 w-5 animate-spin text-cyan-300/60" />
            </div>
          }
        >
          {renderBody()}
        </Suspense>
      </div>

      {/* 手动新增 / 编辑草稿(结构化编辑器) */}
      <div className="sf-panel-hud p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="sf-chip">{editingId ? 'EDIT' : 'NEW'}</span>
          <span className="text-2xs tracking-widest text-white/30">{t('setting.draftHint')}</span>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_140px_auto] sm:gap-2">
          <input
            value={draft.keyword}
            onChange={(e) => setDraft((s) => ({ ...s, keyword: e.target.value }))}
            placeholder={t('setting.keywordPlaceholder')}
            className="sf-input"
          />
          <select
            value={draft.category}
            onChange={(e) => setDraft((s) => ({ ...s, category: e.target.value }))}
            className="sf-input"
          >
            {enabledList.map((c) => (
              <option key={c.key} value={c.key}>
                {t(c.label)}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <button onClick={saveDraft} className="sf-btn-ghost" disabled={loading}>
              <BookMarked className="h-3 w-3" />
              {t('common.save')}
            </button>
            {editingId && (
              <button onClick={resetDraft} className="sf-btn-ghost" title={t('common.cancel')}>
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
        <div className="mt-3 border-t border-cyan-400/10 pt-3">
          <StructEditor
            category={draft.category}
            value={draft.description}
            allList={list}
            keyword={draft.keyword}
            onChange={(desc) => setDraft((s) => ({ ...s, description: desc }))}
          />
        </div>
      </div>

      {/* AI 生成设定集 → 预览 → 入库 */}
      <div className="sf-panel-hud p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="sf-chip">AI</span>
          <span className="text-2xs tracking-widest text-white/30">{t('setting.aiHint')}</span>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <textarea
            value={aiBlueprint}
            onChange={(e) => setAiBlueprint(e.target.value)}
            rows={2}
            placeholder={t('setting.blueprintPlaceholder')}
            className="sf-input w-full resize-none"
          />
          <button
            onClick={genAndPreview}
            disabled={aiLoading || !aiBlueprint.trim()}
            className="sf-btn h-[42px] shrink-0 sm:w-auto"
          >
            {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Compass className="h-4 w-4" />}
            {aiLoading ? t('setting.genRunning') : t('setting.gen')}
          </button>
        </div>

        {previewBusy && !preview && <div className="sf-loader-bar mt-3" />}

        {preview && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs tracking-wider text-cyan-300/70">
                {t('setting.previewTitle').replace('{n}', String(preview.length))}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPreview(null)} className="sf-btn-ghost" disabled={previewBusy}>
                  <X className="h-3 w-3" />
                  {t('common.cancel')}
                </button>
                <button onClick={savePreview} className="sf-btn" disabled={previewBusy || preview.length === 0}>
                  {previewBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                  {t('setting.saveToDb')}
                </button>
              </div>
            </div>
            {preview.length === 0 ? (
              <div className="rounded border border-dashed border-cyan-400/10 py-6 text-center text-xs text-white/30">
                {t('setting.previewEmpty')}
              </div>
            ) : (
              <ul className="space-y-2">
                {preview.map((e, i) => (
                  <li key={i} className="sf-scan rounded border border-cyan-400/15 bg-black/40 p-3">
                    <div className="mb-2 flex items-start gap-2">
                      <input
                        value={e.keyword}
                        onChange={(ev) => updatePreviewItem(i, { keyword: ev.target.value })}
                        className="sf-input flex-1 !py-1 !text-xs"
                        placeholder={t('setting.keywordPlaceholder')}
                      />
                      <select
                        value={e.category}
                        onChange={(ev) => updatePreviewItem(i, { category: ev.target.value })}
                        className="sf-input !w-[110px] !py-1 !text-xs"
                      >
                        {enabledList.map((c) => (
                          <option key={c.key} value={c.key}>
                            {t(c.label)}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => removePreviewItem(i)}
                        className="font-mono text-2xs tracking-widest text-rose-300/50 hover:text-rose-300"
                        title={t('common.delete')}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <textarea
                      value={e.description}
                      onChange={(ev) => updatePreviewItem(i, { description: ev.target.value })}
                      rows={3}
                      className="sf-input w-full resize-y !text-xs"
                      placeholder={t('setting.descPlaceholder')}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

    </div>
  );
}

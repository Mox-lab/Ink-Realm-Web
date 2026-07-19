/**
 * 设定集结构化数据层。
 * <p>约定:`NovelWorldSetting.description` 既兼容旧版纯文本,也支持结构化 JSON:
 * <pre>{ "_struct": "character", "text": "人类可读描述", ...分类专属字段 }</pre>
 * 解析失败时整体视为纯文本(text),保证旧数据可读、可视化组件有兜底。</p>
 *
 * @author songshan.li (ID: 17099618)
 */

/**
 * 全部可选分类(标签)池。
 * <p>用户按当前小说勾选需要展示的分类;固定分类(pinned)始终展示、不可关闭。
 * 新增小说若不需要「等级 / 地图」等概念,直接在「管理标签」中关闭即可。</p>
 */
export const CATEGORY_POOL = [
  { key: '人物', label: 'setting.catCharacter', struct: 'character', pinned: true },
  { key: '势力', label: 'setting.catFaction', struct: 'faction' },
  { key: '地图', label: 'setting.catMap', struct: 'map' },
  { key: '能力', label: 'setting.catAbility', struct: 'ability' },
  { key: '武器', label: 'setting.catWeapon', struct: 'weapon' },
  { key: '等级', label: 'setting.catTier', struct: 'tier' },
  { key: '种族', label: 'setting.catRace', struct: 'race' },
  { key: '职业', label: 'setting.catProfession', struct: 'profession' },
  { key: '物品', label: 'setting.catItem', struct: 'item' },
  { key: '功法', label: 'setting.catTechnique', struct: 'technique' },
  { key: '丹药', label: 'setting.catPill', struct: 'pill' },
  { key: '灵兽', label: 'setting.catBeast', struct: 'beast' },
  { key: '事件', label: 'setting.catEvent', struct: 'event' },
  { key: '组织', label: 'setting.catOrg', struct: 'organization' },
  { key: '货币', label: 'setting.catCurrency', struct: 'currency' },
  { key: '历史', label: 'setting.catHistory', struct: 'history' },
  { key: '文化', label: 'setting.catCulture', struct: 'culture' },
  { key: '其他', label: 'setting.catOther', struct: 'other', pinned: true },
];

/** 各分类对应的结构化类型(分类 key → struct type),由 POOL 派生。 */
export const CATEGORY_STRUCT = Object.fromEntries(CATEGORY_POOL.map((c) => [c.key, c.struct]));

/** 反向:struct type → 分类 key。 */
export const STRUCT_CATEGORY = Object.fromEntries(CATEGORY_POOL.map((c) => [c.struct, c.key]));

/** 固定分类(始终展示、不可关闭):人物与其他。 */
export const PINNED_CATS = CATEGORY_POOL.filter((c) => c.pinned).map((c) => c.key);

/**
 * 通用(简单)分类列:名称 + 标签 + 描述。多数分类复用此配置,仅定制字段较多的分类单独覆盖。
 */
const SIMPLE_COLS = [
  { key: 'keyword', label: 'setting.colName', type: 'name' },
  { key: 'tags', label: 'setting.tags', type: 'tags' },
  { key: 'text', label: 'setting.colDesc', type: 'text' },
];

/**
 * 各分类的表格列配置(配置驱动分化表格)。
 * <p>label 为 i18n key;type 决定单元格渲染:
 * name(名称) / text(文本) / tags(标签) / attrs(属性条) / count(数组计数) /
 * rank(品阶徽章) / number(数值) / progress(进度条)。</p>
 */
export const CAT_COLUMNS = {
  人物: [
    { key: 'keyword', label: 'setting.colName', type: 'name' },
    { key: 'faction', label: 'setting.faction', type: 'text' },
    { key: 'relations', label: 'setting.relations', type: 'count' },
    { key: 'tags', label: 'setting.tags', type: 'tags' },
  ],
  势力: [
    { key: 'keyword', label: 'setting.colName', type: 'name' },
    { key: 'leader', label: 'setting.leader', type: 'text' },
    { key: 'members', label: 'setting.members', type: 'count' },
    { key: 'tags', label: 'setting.tags', type: 'tags' },
  ],
  地图: [
    { key: 'keyword', label: 'setting.colName', type: 'name' },
    { key: 'links', label: 'setting.links', type: 'count' },
    { key: 'tags', label: 'setting.tags', type: 'tags' },
    { key: 'text', label: 'setting.colDesc', type: 'text' },
  ],
  能力: [
    { key: 'keyword', label: 'setting.colName', type: 'name' },
    { key: 'rank', label: 'setting.colRank', type: 'rank' },
    { key: 'attrs', label: 'setting.attributes', type: 'attrs' },
    { key: 'tags', label: 'setting.tags', type: 'tags' },
  ],
  武器: [
    { key: 'keyword', label: 'setting.colName', type: 'name' },
    { key: 'rank', label: 'setting.colRank', type: 'rank' },
    { key: 'attrs', label: 'setting.attributes', type: 'attrs' },
    { key: 'tags', label: 'setting.tags', type: 'tags' },
  ],
  等级: [
    { key: 'keyword', label: 'setting.colName', type: 'name' },
    { key: 'order', label: 'setting.order', type: 'number' },
    { key: 'level', label: 'setting.level', type: 'number' },
    { key: 'progress', label: 'setting.progress', type: 'progress' },
    { key: 'text', label: 'setting.colDesc', type: 'text' },
  ],
  种族: SIMPLE_COLS,
  职业: SIMPLE_COLS,
  物品: SIMPLE_COLS,
  功法: SIMPLE_COLS,
  丹药: SIMPLE_COLS,
  灵兽: SIMPLE_COLS,
  事件: SIMPLE_COLS,
  组织: SIMPLE_COLS,
  货币: SIMPLE_COLS,
  历史: SIMPLE_COLS,
  文化: SIMPLE_COLS,
  其他: SIMPLE_COLS,
};

/** 取得某分类的表格列配置(缺省回退到通用列)。 */
export function getColumns(category) {
  return CAT_COLUMNS[category] || SIMPLE_COLS;
}

/** 角色默认雷达维度(用户可自由增删)。 */
export const DEFAULT_ATTRS = ['力量', '敏捷', '智力', '体质', '魅力', '精神'];

/**
 * 解析 description。
 * @returns {{ struct: string|null, text: string, data: object }}
 */
export function parseStruct(desc) {
  if (!desc) return { struct: null, text: '', data: {} };
  const s = String(desc).trim();
  if (!s.startsWith('{')) return { struct: null, text: s, data: {} };
  try {
    const obj = JSON.parse(s);
    if (obj && typeof obj === 'object' && obj._struct) {
      const { _struct, text, ...data } = obj;
      return { struct: _struct, text: typeof text === 'string' ? text : '', data };
    }
    return { struct: null, text: s, data: {} };
  } catch {
    return { struct: null, text: s, data: {} };
  }
}

/**
 * 序列化结构化对象为 description 字符串。
 * @param {string} struct 类型
 * @param {object} data 分类字段(不含 _struct/text)
 * @param {string} text 人类可读描述
 */
export function serializeStruct(struct, data, text) {
  const obj = { _struct: struct, text: text || '', ...(data || {}) };
  return JSON.stringify(obj);
}

/** 取得某分类的结构化默认骨架。 */
export function defaultStruct(category) {
  const type = CATEGORY_STRUCT[category] || 'other';
  switch (type) {
    case 'character':
      return {
        struct: 'character',
        text: '',
        data: { tags: [], faction: '', relations: [] },
      };
    case 'faction':
      return {
        struct: 'faction',
        text: '',
        data: { tags: [], leader: '', members: [], relations: [] },
      };
    case 'map':
      return {
        struct: 'map',
        text: '',
        data: { tags: [], x: 0.5, y: 0.5, links: [] },
      };
    case 'tier':
      return {
        struct: 'tier',
        text: '',
        data: { order: 1, level: 1, progress: 0, tags: [] },
      };
    case 'ability':
    case 'weapon':
      return {
        struct: type,
        text: '',
        data: { tags: [], rank: '', attrs: {} },
      };
    default:
      // 种族/职业/物品/功法/丹药/灵兽/事件/组织/货币/历史/文化/其他 等通用分类
      return { struct: type, text: '', data: { tags: [] } };
  }
}

/** 实体数组 → 按分类分组的 map。 */
export function groupByCategory(list) {
  const m = {};
  for (const it of list || []) {
    const cat = it.category || '其他';
    (m[cat] ||= []).push(it);
  }
  return m;
}

/**
 * 由设定集列表构建关系图数据(人物 + 势力节点,关系/成员为边)。
 * @returns {{ nodes: Array, links: Array }}
 */
export function buildGraphData(list) {
  const chars = (list || []).filter((i) => parseStruct(i.description).struct === 'character');
  const factions = (list || []).filter((i) => parseStruct(i.description).struct === 'faction');
  const idOf = (kw) => 'n_' + kw;

  const nodes = [];
  const links = [];
  // 仅收录「人物 / 势力」节点的 id,作建边时的存在性校验集合。
  // 注意:不能用全部关键词集合(会混入地图/能力/物品等非图节点),
  // 否则会生成指向不存在节点的边,d3-force 解析时抛 "node not found" 并使整图崩溃、节点"消失"。
  const nodeIdSet = new Set();

  // 第一遍:先构建全部节点
  for (const f of factions) {
    nodes.push({ id: idOf(f.keyword), label: f.keyword, type: 'faction', raw: f, data: parseStruct(f.description).data });
    nodeIdSet.add(idOf(f.keyword));
  }
  for (const c of chars) {
    nodes.push({ id: idOf(c.keyword), label: c.keyword, type: 'character', raw: c, data: parseStruct(c.description).data });
    nodeIdSet.add(idOf(c.keyword));
  }

  // 第二遍:仅当连线两端均存在真实节点时才建边,避免悬空边导致 simulation 崩溃
  const addLink = (sourceId, targetKw, extra) => {
    if (!targetKw) return;
    const targetId = idOf(targetKw);
    if (nodeIdSet.has(sourceId) && nodeIdSet.has(targetId)) {
      links.push({ source: sourceId, target: targetId, ...extra });
    }
  };

  for (const f of factions) {
    const { data } = parseStruct(f.description);
    const src = idOf(f.keyword);
    for (const mem of data.members || []) addLink(src, mem, { kind: '成员' });
    for (const r of data.relations || []) addLink(src, r.target, { kind: r.type || '关系', desc: r.desc });
  }
  for (const c of chars) {
    const { data } = parseStruct(c.description);
    const src = idOf(c.keyword);
    for (const r of data.relations || []) addLink(src, r.target, { kind: r.type || '关系', desc: r.desc });
  }

  return { nodes, links };
}

/** 收集所有设定条目的标签(用于百科筛选)。 */
export function collectTags(list) {
  const set = new Set();
  for (const it of list || []) {
    const { data } = parseStruct(it.description);
    for (const tg of data.tags || []) set.add(tg);
  }
  return [...set];
}

/** 等级条目按 order 排序。 */
export function sortedTiers(list) {
  return (list || [])
    .filter((i) => parseStruct(i.description).struct === 'tier')
    .map((i) => ({ raw: i, data: parseStruct(i.description).data, text: parseStruct(i.description).text }))
    .sort((a, b) => (a.data.order || 0) - (b.data.order || 0));
}

/**
 * 由全量设定聚合时间线事件。
 * 来源:① 等级条目(order/title/描述) ② 任何条目的 events 数组。
 * @returns {Array<{era:string,title:string,desc:string,cat:string}>}
 */
export function buildTimeline(list) {
  const out = [];
  for (const it of list || []) {
    const { struct, text, data } = parseStruct(it.description);
    if (struct === 'tier') {
      out.push({
        era: '境界·' + (data.order ?? ''),
        title: it.keyword,
        desc: text,
        cat: it.category || '其他',
      });
    }
    for (const ev of data.events || []) {
      out.push({
        era: ev.date || ev.era || '',
        title: ev.title || it.keyword,
        desc: ev.desc || '',
        cat: it.category || '其他',
      });
    }
  }
  return out;
}

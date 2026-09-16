import { client } from '@/shared/api/client';

/**
 * lore 模块 API:设定词条/字典/关系/候选四组接口。
 * client 拦截器已解包 Result 并注入 X-Novel-Id,直接返回业务载荷。
 *
 * <p>与后端 LoreSettingController/LoreDictController/LoreRelationController/
 * LoreCandidateController 对齐(接口契约见各 VO/DTO 的 @Schema 描述)。</p>
 *
 * @author Moba
 */

/** 内容分类(10 类封闭枚举,与后端 LoreCategory.ALL 严格一致) */
export const LORE_CATEGORIES = [
  'worldview',
  'character',
  'faction',
  'item',
  'geography',
  'ability',
  'profession',
  'technique',
  'beast',
  'event',
] as const;

/** 内容分类类型 */
export type LoreCategory = (typeof LORE_CATEGORIES)[number];

/** 字典段(7 段封闭枚举,与后端 LoreDictType.ALL 严格一致) */
export const LORE_DICT_TYPES = [
  'realm',
  'item_tier',
  'item_quality',
  'race',
  'currency',
  'technique_rank',
  'ability_rank',
] as const;

/** 字典段类型 */
export type LoreDictType = (typeof LORE_DICT_TYPES)[number];

/** 候选状态机(单向:PENDING → APPLIED / REJECTED) */
export const CANDIDATE_STATUSES = ['PENDING', 'APPLIED', 'REJECTED'] as const;

/** 候选状态类型 */
export type CandidateStatus = (typeof CANDIDATE_STATUSES)[number];

/** 设定词条(与后端 SettingVO 对齐) */
export interface SettingItem {
  /** 词条 ID */
  id: number;
  /** 归属作品 ID */
  novelId: number;
  /** 内容分类(10 类枚举) */
  category: LoreCategory;
  /** 条目名 */
  name: string;
  /** 富字段 JSON 字符串(按 _struct 判别渲染) */
  content: string;
  /** 结构判别派生列(只读) */
  structType: string | null;
  /** 同分类内排序号 */
  sortOrder: number;
  /** 创建时间(ISO 8601) */
  createdAt: string;
  /** 更新时间(ISO 8601) */
  updatedAt: string;
}

/** 设定词条保存请求(与后端 SettingSaveReq 对齐) */
export interface SettingSaveReq {
  /** 内容分类(10 类枚举) */
  category: LoreCategory;
  /** 条目名(≤128 字,同分类内唯一) */
  name: string;
  /** 富字段 JSON 字符串(可空,默认 {}) */
  content?: string | null;
  /** 同分类内排序号(可空,默认 0) */
  sortOrder?: number | null;
}

/** 字典词条状态(active 启用/disabled 停用,与后端 DB CHECK 封闭二值一致) */
export type DictStatus = 'active' | 'disabled';

/** 字典词条(与后端 DictVO 对齐) */
export interface DictItem {
  /** 词条 ID */
  id: number;
  /** 归属作品 ID */
  novelId: number;
  /** 字典段(7 类枚举) */
  dictType: LoreDictType;
  /** 词条名 */
  term: string;
  /** 词条释义(可空) */
  definition: string | null;
  /** 段内层级序 */
  tierNo: number;
  /** 状态:active/disabled(禁用后 G4 AI 注入跳过) */
  status: DictStatus;
  /** 创建时间(ISO 8601) */
  createdAt: string;
  /** 更新时间(ISO 8601) */
  updatedAt: string;
}

/** 字典词条保存请求(与后端 DictSaveReq 对齐) */
export interface DictSaveReq {
  /** 字典段(7 类枚举) */
  dictType: LoreDictType;
  /** 词条名(≤128 字,段内唯一) */
  term: string;
  /** 词条释义(可空) */
  definition?: string | null;
  /** 段内层级序(可空,默认追加段尾) */
  tierNo?: number | null;
}

/** 设定关系(与后端 RelationVO 对齐) */
export interface RelationItem {
  /** 关系 ID */
  id: number;
  /** 归属作品 ID */
  novelId: number;
  /** 起点词条 ID */
  fromSettingId: number;
  /** 终点词条 ID */
  toSettingId: number;
  /** 起点名快照(展示用) */
  fromNameSnapshot: string;
  /** 终点名快照(展示用) */
  toNameSnapshot: string;
  /** 关系类型(开放枚举) */
  relationType: string;
  /** 种子锁定(true 时 AI 只读) */
  seed: boolean;
  /** 创建时间(ISO 8601) */
  createdAt: string;
  /** 更新时间(ISO 8601) */
  updatedAt: string;
}

/** 设定关系保存请求(与后端 RelationSaveReq 对齐) */
export interface RelationSaveReq {
  /** 起点词条 ID(须为本作品词条) */
  fromSettingId: number;
  /** 终点词条 ID(不得与起点相同) */
  toSettingId: number;
  /** 关系类型(开放枚举:师徒/敌对/亲属等) */
  relationType: string;
  /** 种子锁定(可空,默认 false) */
  seed?: boolean | null;
}

/** 候选队列条目(与后端 CandidateVO 对齐) */
export interface CandidateItem {
  /** 候选 ID */
  id: number;
  /** 归属作品 ID */
  novelId: number;
  /** 候选类型(G3 仅 DICT_TERM) */
  candidateType: string;
  /** 候选载荷 JSON 字符串(DICT_TERM 含 dictType/term/definition/tierNo 预填) */
  payload: string;
  /** 状态机:PENDING/APPLIED/REJECTED */
  status: CandidateStatus;
  /** 来源章节 ID(G5 回写写入,G3 为空) */
  sourceChapterId: number | null;
  /** AI 提取依据(可空) */
  reason: string | null;
  /** 创建时间(ISO 8601) */
  createdAt: string;
  /** 更新时间(ISO 8601) */
  updatedAt: string;
}

/** DICT_TERM 候选载荷结构(采纳弹窗预填数据源) */
export interface DictTermPayload {
  /** 预判字典段 */
  dictType?: LoreDictType;
  /** 预判词条名 */
  term?: string;
  /** 预判释义 */
  definition?: string;
  /** 预判层级序 */
  tierNo?: number;
}

/** 候选采纳请求(与后端 CandidateAdoptReq 对齐,以请求体为准) */
export interface CandidateAdoptReq {
  /** 目标字典段(可改) */
  dictType: LoreDictType;
  /** 词条名(预填可改) */
  term: string;
  /** 词条释义(预填可改) */
  definition?: string | null;
  /** 段内层级序(可空,默认追加段尾) */
  tierNo?: number | null;
}

/**
 * 设定词条列表(按分类过滤,可选关键词)。
 *
 * @param category 内容分类(空=全部)
 * @param keyword  名称关键词(空=不过滤)
 * @returns 词条列表
 */
export function listSettings(category?: LoreCategory, keyword?: string): Promise<SettingItem[]> {
  return client
    .get('/lore/settings', { params: { category: category || undefined, keyword: keyword || undefined } })
    .then((r) => r.data);
}

/**
 * 创建设定词条(同分类重名拦截)。
 *
 * @param req 保存请求
 * @returns 创建后的词条
 */
export function createSetting(req: SettingSaveReq): Promise<SettingItem> {
  return client.post('/lore/settings', req).then((r) => r.data);
}

/**
 * 更新设定词条(改名级联刷新关系快照)。
 *
 * @param id  词条 ID
 * @param req 保存请求
 * @returns 更新后的词条
 */
export function updateSetting(id: number, req: SettingSaveReq): Promise<SettingItem> {
  return client.put(`/lore/settings/${id}`, req).then((r) => r.data);
}

/**
 * 删除设定词条(逻辑删除,级联删除关联关系)。
 *
 * @param id 词条 ID
 */
export function deleteSetting(id: number): Promise<void> {
  return client.delete(`/lore/settings/${id}`).then(() => undefined);
}

/**
 * 段内字典词条列表(按 tier_no 升序)。
 *
 * @param dictType 字典段(7 类枚举)
 * @returns 有序词条列表
 */
export function listDicts(dictType: LoreDictType): Promise<DictItem[]> {
  return client.get('/lore/dicts', { params: { dictType } }).then((r) => r.data);
}

/**
 * 创建字典词条(段内重名拦截,tier_no 空时追加段尾)。
 *
 * @param req 保存请求
 * @returns 创建后的词条
 */
export function createDict(req: DictSaveReq): Promise<DictItem> {
  return client.post('/lore/dicts', req).then((r) => r.data);
}

/**
 * 更新字典词条(段内重名拦截,排除自身)。
 *
 * @param id  词条 ID
 * @param req 保存请求
 * @returns 更新后的词条
 */
export function updateDict(id: number, req: DictSaveReq): Promise<DictItem> {
  return client.put(`/lore/dicts/${id}`, req).then((r) => r.data);
}

/**
 * 删除字典词条(逻辑删除)。
 *
 * @param id 词条 ID
 */
export function deleteDict(id: number): Promise<void> {
  return client.delete(`/lore/dicts/${id}`).then(() => undefined);
}

/**
 * 启用/禁用字典词条(禁用后 G4 AI 注入跳过,段内列表仍展示)。
 *
 * @param id     词条 ID
 * @param status 目标状态:active/disabled
 * @returns 更新后的词条
 */
export function updateDictStatus(id: number, status: DictStatus): Promise<DictItem> {
  return client.put(`/lore/dicts/${id}/status`, null, { params: { status } }).then((r) => r.data);
}

/**
 * 段内拖拽排序(按提交的有序 ID 列表重写 tier_no,即时保存)。
 *
 * @param dictType   字典段
 * @param orderedIds 拖拽后的最终顺序
 */
export function reorderDicts(dictType: LoreDictType, orderedIds: number[]): Promise<void> {
  return client.put('/lore/dicts/reorder', { dictType, orderedIds }).then(() => undefined);
}

/**
 * 采纳候选入段(候选状态机 PENDING→APPLIED,同事务)。
 *
 * @param candidateId 候选 ID
 * @param req         采纳请求(确认弹窗内可改段与层级序)
 * @returns 采纳后的字典词条
 */
export function adoptCandidate(candidateId: number, req: CandidateAdoptReq): Promise<DictItem> {
  return client.post(`/lore/dicts/candidates/${candidateId}/adopt`, req).then((r) => r.data);
}

/**
 * 作品全部关系(关系图数据源)。
 *
 * @returns 关系列表
 */
export function listRelations(): Promise<RelationItem[]> {
  return client.get('/lore/relations').then((r) => r.data);
}

/**
 * 创建关系(两端词条须为本作品词条且不得相同)。
 *
 * @param req 保存请求
 * @returns 创建后的关系
 */
export function createRelation(req: RelationSaveReq): Promise<RelationItem> {
  return client.post('/lore/relations', req).then((r) => r.data);
}

/**
 * 更新关系(类型/两端/种子标记,两端变更时快照同步刷新)。
 *
 * @param id  关系 ID
 * @param req 保存请求
 * @returns 更新后的关系
 */
export function updateRelation(id: number, req: RelationSaveReq): Promise<RelationItem> {
  return client.put(`/lore/relations/${id}`, req).then((r) => r.data);
}

/**
 * 删除关系(逻辑删除)。
 *
 * @param id 关系 ID
 */
export function deleteRelation(id: number): Promise<void> {
  return client.delete(`/lore/relations/${id}`).then(() => undefined);
}

/**
 * 种子锁定/解锁(锁定后 AI 只读,可解锁交还 AI)。
 *
 * @param id   关系 ID
 * @param seed true 锁定 / false 解锁
 * @returns 更新后的关系
 */
export function lockRelationSeed(id: number, seed: boolean): Promise<RelationItem> {
  return client.put(`/lore/relations/${id}/seed`, null, { params: { seed } }).then((r) => r.data);
}

/**
 * 候选列表(按状态过滤,默认全部)。
 *
 * @param status 状态(空=全部)
 * @returns 候选列表(创建时间倒序)
 */
export function listCandidates(status?: CandidateStatus): Promise<CandidateItem[]> {
  return client.get('/lore/candidates', { params: { status: status || undefined } }).then((r) => r.data);
}

/**
 * 忽略候选(PENDING→REJECTED,单向不可回退)。
 *
 * @param id 候选 ID
 */
export function rejectCandidate(id: number): Promise<void> {
  return client.post(`/lore/candidates/${id}/reject`).then(() => undefined);
}

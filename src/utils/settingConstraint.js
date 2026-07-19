/**
 * 由设定集库列表构建大纲约束文本(markdown)。
 * <p>用于 Outline 页「设定」框:把已建设的设定词条按分类汇总,
 * 作为大纲 AI 的世界观/人物自洽约束,避免凭空新增设定。</p>
 *
 * @author songshan.li (ID: 17099618)
 */
import { parseStruct } from '../components/setting/struct.js';

/** 单条摘要最大长度,防止约束文本过长挤占大纲生成 token。 */
const MAX_LEN = 120;

/** 文本裁剪:折叠空白并限长。 */
function clip(s) {
  if (!s) return '';
  const t = String(s).replace(/\s+/g, ' ').trim();
  return t.length > MAX_LEN ? t.slice(0, MAX_LEN) + '…' : t;
}

/**
 * 单条设定的摘要:优先结构化 text,其次 data 关键字段,最后整体 description。
 * @param {object} item NovelWorldSetting
 */
function summarize(item) {
  const { struct, text, data } = parseStruct(item.description);
  // 结构化且带人类可读描述,直接采用
  if (text && text.trim()) return clip(text.trim());

  const parts = [];
  if (data.faction) parts.push('所属·' + data.faction);
  if (data.leader) parts.push('首领·' + data.leader);
  if (Array.isArray(data.members) && data.members.length) parts.push('成员·' + data.members.join('、'));
  if (Array.isArray(data.tags) && data.tags.length) parts.push('标签·' + data.tags.join('、'));
  if (data.order != null) parts.push('排序·' + data.order);
  if (data.level != null) parts.push('层级·' + data.level);
  if (Array.isArray(data.relations) && data.relations.length) {
    parts.push('关系·' + data.relations.map((r) => `${r.type || ''}→${r.target}`).join('、'));
  }
  if (parts.length) return clip(parts.join('；'));

  // 结构化但无 text 也无关键字段,或纯文本(非 JSON 时 struct 为 null)
  if (!struct && item.description) return clip(item.description.trim());
  return '（无描述）';
}

/**
 * 把设定集库全部条目聚合成约束 markdown。
 * @param {Array} list NovelWorldSetting 列表
 * @returns {string} 约束文本(空库返回 '')
 */
export function buildSettingConstraint(list) {
  if (!Array.isArray(list) || list.length === 0) return '';
  const groups = {};
  for (const it of list) {
    const cat = it.category || '其他';
    (groups[cat] ||= []).push(it);
  }
  const lines = ['# 设定约束（自动汇总自设定集库，作为大纲世界观与人物自洽的权威依据）'];
  for (const [cat, items] of Object.entries(groups)) {
    if (!items.length) continue;
    lines.push('', `## ${cat}`);
    for (const it of items) {
      const kw = it.keyword || '未命名';
      lines.push(`- ${kw}：${summarize(it)}`);
    }
  }
  return lines.join('\n').trim();
}

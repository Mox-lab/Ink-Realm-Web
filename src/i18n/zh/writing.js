/**
 * 写作页词条 —— 中文
 *
 * 按菜单项聚合:本文件承载「写作」菜单页全部文案,包含内嵌面板:
 *   - writing.*   写作主区(会话/技能/输入框)
 *   - draft.*     草稿自动保存与恢复
 *   - memory.*    长期记忆面板(人物档案)
 *   - usage.*     Token 消耗面板
 *   - review.*    审查侧栏(已整合,原 review.js)
 *
 * 命名空间保留原 key 前缀,仅做文件级归位,组件 t() 调用无需改动。
 *
 * @author songshan.li (ID: 17099618)
 */
export const writing = {
  // —— 写作主区 ——
  'writing.subheading': '多轮记忆 · 自动调用工具查人物/设定/扩写场景 · P1 Skill 自适应',
  'writing.session': '会话',
  'writing.skill': '技能',
  'writing.skillAuto': '自动匹配',
  'writing.sessionHint': '同 ID 共享 20 条记忆窗口',
  'writing.placeholder': '作者消息,Enter 发送',
  'writing.author': '作者',
  'writing.awaiting': '等待输入',
  'writing.awaitingHint': '试试:"我正在写一本东方玄幻小说,主角叫林晚"',
  'writing.callFailed': '调用失败',

  // —— 草稿自动保存 / 恢复 ——
  'draft.restoreTitle': '检测到未保存的草稿',
  'draft.restore': '恢复草稿',
  'draft.discard': '丢弃',
  'draft.hintMinutes': '草稿保存于 {n} 分钟前',
  'draft.autoSaved': '已自动保存',
  'draft.autoSaving': '自动保存中...',

  // —— 长期记忆面板(人物档案) ——
  'memory.title': '长期记忆 · 人物档案',
  'memory.hint': '由 LongTermMemoryExtractor 在章节保存后自动抽取入库 · 共 {n} 条',
  'memory.empty': '保存章节后将自动抽取人物',
  'memory.loadFailed': '加载人物档案失败',
  'memory.personality': '性格',
  'memory.weapon': '武器',
  'memory.background': '背景',

  // —— Token 消耗面板 ——
  'usage.title': 'Token 消耗',
  'usage.budget': '预算 {used}/{total}',
  'usage.calls': 'CALLS',
  'usage.chars': 'CHARS',
  'usage.tokens': '≈TOKENS',
  'usage.monthLabel': '本月',
  'usage.expand': '展开',
  'usage.collapse': '收起',
  'usage.lastAt': '最近调用',

  // —— 审查侧栏 ——
  'review.heading': '审查问题',
  'review.chapterLabel': '第 {n} 章',
  'review.filterAll': '全部',
  'review.filterOpen': '待处理',
  'review.filterResolved': '已解决',
  'review.filterIgnored': '已忽略',
  'review.loadFailed': '加载审查问题失败',
  'review.statusUpdated': '已更新状态',
  'review.updateFailed': '更新失败',
  'review.noIssues': '暂无问题',
  'review.suggestion': '建议',
  'review.resolved': '已解决',
  'review.ignored': '忽略',
};

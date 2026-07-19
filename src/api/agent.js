import api from './client.js';

/**
 * 对话 (/api/chat)
 */
export async function chat(message) {
  const { data } = await api.post('/chat', { message });
  return data.reply;
}

/**
 * 多轮写作 (/api/writing)
 */
export async function writing(userId, message) {
  const { data } = await api.post('/writing', { userId, message });
  return data;
}

/**
 * 大纲卷规划 (/api/outline/plan)
 * <p>不再传入目标章节数,各卷章数由模型依据该卷剧情体量自行决定(每卷建议 100-300 章量级,可浮动;全书总量为各卷之和)。</p>
 * @param theme        主题
 * @param setting      设定集(可选,来自阶段2 设定;作为约束随请求带入,保证世界/人物一致)
 * @returns 卷规划文本(可被编辑后回传 outline() 的 volumePlan)
 */
export async function planOutline(theme, setting) {
  const payload = { theme };
  if (setting) payload.setting = setting;
  const { data } = await api.post('/outline/plan', payload);
  return data;
}

/**
 * 展开单卷细纲 (/api/outline/volume)
 * @param theme        主题
 * @param opts.volumePlan   卷规划文本(必须)
 * @param opts.volumeIndex  要展开的卷号
 * @param opts.setting      设定集(可选,与规划时一致,约束本卷内容)
 * @returns 该卷逐章细纲 markdown(位于 data.outline)
 */
export async function expandOutlineVolume(theme, opts = {}) {
  const payload = { theme };
  if (opts.volumePlan) payload.volumePlan = opts.volumePlan;
  payload.volumeIndex = opts.volumeIndex ?? 1;
  if (opts.setting) payload.setting = opts.setting;
  const { data } = await api.post('/outline/volume', payload);
  return data;
}

/**
 * 大纲生成 (/api/outline)
 * @param theme        主题
 * @param chapters     章节数
 * @param opts.lastOutline   续生模式:上一版大纲尾部文本
 * @param opts.startChapter  续生模式:起始章节号(默认 chapters+1)
 * @param opts.volumePlan    自定义卷规划(可编辑后的规划文本)
 * @param opts.setting       设定集(可选,约束世界/人物一致)
 */
export async function outline(theme, chapters = 20, opts = {}) {
  const payload = { theme, chapters };
  if (opts.lastOutline) {
    payload.lastOutline = opts.lastOutline;
    payload.startChapter = opts.startChapter ?? (chapters + 1);
  }
  if (opts.volumePlan) {
    payload.volumePlan = opts.volumePlan;
  }
  if (opts.setting) {
    payload.setting = opts.setting;
  }
  const { data } = await api.post('/outline', payload);
  return data;
}

/**
 * 阶段1 构思 (/api/concept)
 * <p>从一句话灵感扩展为题材蓝图(简介/冲突/卖点/读者/基调/篇幅)。</p>
 * @param inspiration 一句话灵感
 * @param genre       类型(可选:玄幻/都市/科幻/历史/言情…)
 * @returns 题材蓝图 markdown(data.blueprint)
 */
export async function generateConcept(inspiration, genre = '') {
  const { data } = await api.post('/concept', { inspiration, genre });
  return data.blueprint;
}

/**
 * 阶段2 设定 (/api/setting)
 * <p>基于题材蓝图生成世界观 + 主要人物档案(设定集)。</p>
 * @param blueprint 题材蓝图(来自阶段1 的 blueprint)
 * @param tone      基调关键词(可选,约束氛围)
 * @returns 设定集 markdown(data.setting)
 */
export async function generateSetting(blueprint, tone = '') {
  const { data } = await api.post('/setting', { blueprint, tone });
  return data.setting;
}

/**
 * 章节生成 (/api/chapter)
 */
export async function chapter(sessionId, outlineText, wordCount = 2000) {
  const { data } = await api.post('/chapter', { sessionId, outline: outlineText, wordCount });
  return data;
}

/**
 * 设定问答 RAG (/api/lore)
 */
export async function loreAsk(question, sessionId = 'lore-001') {
  const { data } = await api.post('/lore', { sessionId, question });
  return data.answer;
}

/**
 * 导入设定库 (/api/lore/import)
 */
export async function importLore(payload) {
  const { data } = await api.post('/lore/import', payload);
  return data;
}

/**
 * 检索调试 (/api/lore/search)
 */
export async function loreSearch(query) {
  const { data } = await api.post('/lore/search', { query });
  return data;
}

/**
 * 多轮记忆测试 (/api/memory)
 */
export async function memoryTest() {
  const { data } = await api.get('/memory');
  return data;
}

/**
 * 章节生成(P1 增强:可传 skillId 强制指定 Skill)。
 */
export async function chapterWithSkill(sessionId, outlineText, skillId, wordCount) {
  const payload = { sessionId, outline: outlineText, wordCount: wordCount ?? 2000 };
  if (skillId) payload.skillId = skillId;
  const { data } = await api.post('/chapter', payload);
  return data;
}

/**
 * 写作助手(P1 增强:可传 skillId)。
 */
export async function writingWithSkill(userId, message, skillId) {
  const payload = { userId, message };
  if (skillId) payload.skillId = skillId;
  const { data } = await api.post('/writing', payload);
  return data;
}

/**
 * P1 — 列出所有可用 Skill。
 */
export async function listSkills() {
  const { data } = await api.get('/skills');
  return data;
}

/**
 * P1 — 预览某段文本会命中哪个 Skill。
 */
export async function previewSkill(text, skillId) {
  const { data } = await api.post('/skills/preview', { text, skillId });
  return data;
}

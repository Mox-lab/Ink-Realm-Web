/**
 * 章节标题正则(供 parseOutline / parseOutlineVolumes 共用)。
 * 匹配:「第 N 章」/ Markdown 标题 + 章号 / 「Chapter N」/「N. 标题」。
 */
export const CHAPTER_HEADING_RE = /^(?:\s*)(?:第\s*([零一二三四五六七八九十百千\d]+)\s*章|(?:#{1,4})\s*(\d+|第[零一二三四五六七八九十百千\d]+章?)\b|(?:Chapter|CH)\s*[:：]?\s*(\d+)|(\d+)\s*[.、:：])\s*(.*)$/i;

/**
 * 卷标题正则:匹配「## 第 X 卷 · 卷名」(后端 outline 输出格式)。
 */
const VOLUME_HEADING_RE = /^\s*##\s*第\s*([零一二三四五六七八九十百千\d]+)\s*卷\s*[·:：]?\s*(.*)$/;

/**
 * 卷主线正则:匹配紧随卷标题后的「卷主线:...」。
 */
const VOLUME_ARC_RE = /^\s*卷主线[:：]\s*(.*)$/;

/**
 * 大纲文本解析为节点数组(扁平,忽略卷标记)。
 * @param {string} text
 * @returns {Array<{index,no,title,summary}>}
 */
export function parseOutline(text) {
  if (!text) return [];
  const lines = text.split(/\r?\n/);
  const nodes = [];
  let current = null;
  let hasChapterSeen = false;
  const headingRe = CHAPTER_HEADING_RE;

  const flush = () => {
    if (current) {
      current.summary = current.summary.trim();
      if (current.summary || current.title) nodes.push(current);
    }
  };

  // 卷标题行(如 "## 第 1 卷 · 卷名"):作为章节之间的分隔,跳过且不污染章节点
  const volumeRe = /^\s*第\s*[零一二三四五六七八九十百千\d]+\s*卷\b/;

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (volumeRe.test(line)) {
      // 遇到卷标题先收尾上一章,使紧随的"卷主线:"等说明行被忽略而非并入上一章
      flush();
      continue;
    }
    const m = line.match(headingRe);
    if (m) {
      flush();
      hasChapterSeen = true;
      const title = (m[5] || '').trim() || `第 ${nodes.length + 1} 节点`;
      current = {
        index: nodes.length,
        no: m[1] || m[2] || m[3] || m[4] || (nodes.length + 1),
        title,
        summary: ''
      };
    } else if (current) {
      if (line) {
        current.summary += (current.summary ? '\n' : '') + line;
      }
    } else if (line.trim() && hasChapterSeen) {
      // 章节之间的分隔/说明行(卷主线等),忽略
      continue;
    } else if (line.trim()) {
      // 首个章节之前的前导文本,忽略
      continue;
    }
  }
  flush();

  if (nodes.length === 0 && text.trim()) {
    return text
      .split(/\n\s*\n/)
      .map((blk, i) => ({
        index: i,
        no: i + 1,
        title: `节段 ${i + 1}`,
        summary: blk.trim()
      }))
      .filter((n) => n.summary);
  }

  return nodes;
}

/**
 * 把大纲解析为「卷 → 章」两级结构,供逐卷折叠预览。
 * <p>卷由「## 第 X 卷 · 卷名」标记,卷主线由紧随的「卷主线:...」标记;
 * 章节点解析规则与 {@link parseOutline} 一致。未出现卷标记时降级为单卷(卷名为空)。</p>
 *
 * @param {string} text
 * @returns {Array<{volume:{index:number,name:string,arc:string}, chapters:Array<{index,no,title,summary}>}>}
 */
export function parseOutlineVolumes(text) {
  if (!text) return [];
  const lines = text.split(/\r?\n/);
  const volumes = [];
  let curVol = null;
  let curChapter = null;
  let chapterGlobalIndex = 0;

  const flushChapter = () => {
    if (curChapter) {
      curChapter.summary = curChapter.summary.trim();
      if (curChapter.summary || curChapter.title) {
        curVol.chapters.push(curChapter);
      }
    }
    curChapter = null;
  };

  const ensureVolume = () => {
    if (!curVol) {
      curVol = { volume: { index: 1, name: '', arc: '' }, chapters: [] };
      volumes.push(curVol);
    }
    return curVol;
  };

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');

    const vm = line.match(VOLUME_HEADING_RE);
    if (vm) {
      flushChapter();
      const idx = parseInt(vm[1], 10);
      curVol = {
        volume: { index: Number.isFinite(idx) ? idx : volumes.length + 1, name: (vm[2] || '').trim(), arc: '' },
        chapters: []
      };
      volumes.push(curVol);
      continue;
    }

    const am = line.match(VOLUME_ARC_RE);
    if (am && curVol) {
      curVol.volume.arc = am[1].trim();
      continue;
    }

    const m = line.match(CHAPTER_HEADING_RE);
    if (m) {
      flushChapter();
      const vol = ensureVolume();
      const title = (m[5] || '').trim() || `第 ${vol.chapters.length + 1} 节点`;
      curChapter = {
        index: chapterGlobalIndex++,
        no: m[1] || m[2] || m[3] || m[4] || vol.chapters.length + 1,
        title,
        summary: ''
      };
    } else if (curChapter) {
      if (line) {
        curChapter.summary += (curChapter.summary ? '\n' : '') + line;
      }
    }
    // 卷/章之前的前导文本:忽略
  }
  flushChapter();

  return volumes;
}

/**
 * 把某一卷的逐章细纲 markdown 插入到大纲文本中该卷标题之后、下一卷标题之前。
 * <p>用于逐卷展开:后端 {@code /api/outline/volume} 返回单卷章节 markdown,前端就地回写,
 * 使 {@link parseOutlineVolumes} 重新解析后该卷即可显示章节。卷标题支持「· / : / ：」分隔。</p>
 *
 * @param {string} text            原大纲文本
 * @param {number} volumeIndex     目标卷号
 * @param {string} chaptersMarkdown 该卷逐章细纲 markdown(### 第 N 章 ...)
 * @returns {string}
 */
export function insertVolumeChapters(text, volumeIndex, chaptersMarkdown) {
  if (!text) return (chaptersMarkdown || '').trim();
  const lines = text.split('\n');
  const volHeaderRe = /^\s*##\s*第\s*(\d+)\s*卷\s*[·:：]?/;
  let headerLine = -1;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(volHeaderRe);
    if (m && Number(m[1]) === Number(volumeIndex)) {
      headerLine = i;
      break;
    }
  }
  if (headerLine === -1) {
    return (text + '\n\n' + (chaptersMarkdown || '')).trim();
  }
  let insertAt = lines.length;
  for (let i = headerLine + 1; i < lines.length; i++) {
    if (volHeaderRe.test(lines[i])) {
      insertAt = i;
      break;
    }
  }
  const block = (chaptersMarkdown || '')
    .split('\n')
    .map((l) => l.trimEnd())
    .filter((l) => l.trim().length > 0);
  lines.splice(insertAt, 0, ...block);
  return lines.join('\n');
}

/**
 * 将「卷 → 章」结构序列化为大纲文本,供逐卷内联编辑后回写。
 * <p>与 {@link parseOutlineVolumes} / {@link parseOutline} 解析格式互逆:
 * 卷名非空时输出「## 第 X 卷 · 卷名」+「卷主线:」;每章输出「第 N 章 标题」+ 细纲。
 * 单卷且无卷名时退化为纯章节列表(不写卷标题)。</p>
 *
 * @param {Array<{volume:{index:number,name:string,arc:string}, chapters:Array<{no,title,summary}>}>} volumes
 * @returns {string}
 */
export function serializeVolumes(volumes) {
  if (!volumes || !volumes.length) return '';
  return volumes
    .map((vol) => {
      const lines = [];
      if (vol.volume && vol.volume.name) {
        lines.push(`## 第 ${vol.volume.index} 卷 · ${vol.volume.name}`);
        if (vol.volume.arc) lines.push(`卷主线: ${vol.volume.arc}`);
      }
      (vol.chapters || []).forEach((c) => {
        lines.push(`第 ${c.no} 章 ${c.title || ''}`.trim());
        if (c.summary && c.summary.trim()) lines.push(c.summary.trim());
      });
      return lines.join('\n');
    })
    .join('\n\n');
}

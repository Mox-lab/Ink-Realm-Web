/**
 * 中文词条聚合 —— 合并所有模块的中文翻译。
 *
 * 模块按菜单项聚合:每个菜单页对应一个文件(writing 内含 memory/review/draft)。
 * 新增模块时:在 zh/ 下新建 <module>.js 并在此处 import 展开。
 *
 * @author songshan.li (ID: 17099618)
 */
import { common } from './common.js';
import { login } from './login.js';
import { nav } from './nav.js';
import { chat } from './chat.js';
import { writing } from './writing.js';
import { outline } from './outline.js';
import { chapter } from './chapter.js';
import { character } from './character.js';
import { lore } from './lore.js';
import { theme } from './theme.js';
import { novel } from './novel.js';
import { admin } from './admin.js';

/** 中文完整词典 */
export const zh = {
  ...common,
  ...login,
  ...nav,
  ...chat,
  ...writing,
  ...outline,
  ...chapter,
  ...character,
  ...lore,
  ...theme,
  ...novel,
  ...admin,
};

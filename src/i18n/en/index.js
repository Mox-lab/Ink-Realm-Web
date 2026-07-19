/**
 * English translations aggregator — merges all module translations.
 *
 * Modules are aggregated by menu item: each menu page maps to one file
 * (writing embeds memory/review/draft). To add a module: create <module>.js
 * under en/ and import & spread it here.
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

/** Complete English dictionary */
export const en = {
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

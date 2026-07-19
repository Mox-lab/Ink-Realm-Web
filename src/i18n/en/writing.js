/**
 * Writing page strings — English
 *
 * Menu-item aggregation: this file holds all copy for the "Writing" menu page,
 * including embedded panels:
 *   - writing.*   main writing area (session / skill / input box)
 *   - draft.*     auto-save & draft restore
 *   - memory.*    long-term memory panel (character profiles)
 *   - usage.*     token usage panel
 *   - review.*    review sidebar (merged from review.js)
 *
 * Original key prefixes are preserved; only file-level relocation, so component
 * t() calls need no changes.
 *
 * @author songshan.li (ID: 17099618)
 */
export const writing = {
  // —— main writing area ——
  'writing.subheading': 'Multi-turn memory · auto tools for characters/settings/scenes · P1 Skill adaptive',
  'writing.session': 'Session',
  'writing.skill': 'Skill',
  'writing.skillAuto': 'Auto match',
  'writing.sessionHint': 'Same ID shares 20-message memory window',
  'writing.placeholder': 'Author message, Enter to send',
  'writing.author': 'AUTHOR',
  'writing.awaiting': 'AWAITING INPUT',
  'writing.awaitingHint': 'Try: "I am writing an eastern fantasy novel, the protagonist is Lin Wan"',
  'writing.callFailed': 'Call failed',

  // —— draft auto-save / restore ——
  'draft.restoreTitle': 'Unsaved draft detected',
  'draft.restore': 'Restore draft',
  'draft.discard': 'Discard',
  'draft.hintMinutes': 'Draft saved {n} min ago',
  'draft.autoSaved': 'Auto-saved',
  'draft.autoSaving': 'Auto-saving...',

  // —— long-term memory panel (character profiles) ——
  'memory.title': 'Long-term memory · Characters',
  'memory.hint': 'Auto-extracted by LongTermMemoryExtractor after chapter save · {n} entries',
  'memory.empty': 'Characters will be auto-extracted after you save a chapter',
  'memory.loadFailed': 'Failed to load character profiles',
  'memory.personality': 'Personality',
  'memory.weapon': 'Weapon',
  'memory.background': 'Background',

  // —— token usage panel ——
  'usage.title': 'Token Consumption',
  'usage.budget': 'Budget {used}/{total}',
  'usage.calls': 'CALLS',
  'usage.chars': 'CHARS',
  'usage.tokens': '≈Tokens',
  'usage.monthLabel': 'This month',
  'usage.expand': 'Expand',
  'usage.collapse': 'Collapse',
  'usage.lastAt': 'Last call',

  // —— review sidebar ——
  'review.heading': 'Review issues',
  'review.chapterLabel': 'Ch. {n}',
  'review.filterAll': 'All',
  'review.filterOpen': 'Open',
  'review.filterResolved': 'Resolved',
  'review.filterIgnored': 'Ignored',
  'review.loadFailed': 'Failed to load review issues',
  'review.statusUpdated': 'Status updated',
  'review.updateFailed': 'Update failed',
  'review.noIssues': 'No issues',
  'review.suggestion': 'Suggestion',
  'review.resolved': 'Resolved',
  'review.ignored': 'Ignore',
};

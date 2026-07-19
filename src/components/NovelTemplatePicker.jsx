import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Eye, Sparkles, X } from 'lucide-react';
import { useI18n } from '../context/I18nContext.jsx';
import { NOVEL_TEMPLATES, TEMPLATE_GENRES } from '../constants/novelTemplates.js';

/**
 * 小说模板选择器(冷启动引导用)。
 *
 * <p>第 6 阶段 UX-01:在 NovelList 空状态下展开模板库,选定后调用
 * onPick(template),由父组件把 prefilled 字段透传到 NovelEditor。</p>
 *
 * @param {{ onPick: (template) => void }} props
 */
export default function NovelTemplatePicker({ onPick }) {
  const { t } = useI18n();
  const [genre, setGenre] = useState('all');
  const [previewing, setPreviewing] = useState(null);

  const list = useMemo(() => {
    if (genre === 'all') return NOVEL_TEMPLATES;
    return NOVEL_TEMPLATES.filter((tpl) => tpl.genre === genre);
  }, [genre]);

  // 弹窗打开时监听 ESC 关闭
  useEffect(() => {
    if (!previewing) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setPreviewing(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [previewing]);

  return (
    <div className="w-full">
      {/* 分类筛选 */}
      <div className="sf-scroll-x mb-4 flex items-center gap-1.5 overflow-x-auto pb-1">
        {TEMPLATE_GENRES.map((g) => {
          const active = genre === g.key;
          return (
            <button
              key={g.key}
              onClick={() => setGenre(g.key)}
              className={`shrink-0 rounded border px-3 py-1.5 text-xs tracking-wider transition ${
                active
                  ? 'border-cyan-300/50 bg-cyan-300/10 text-cyan-300'
                  : 'border-white/10 text-white/40 hover:text-white/70'
              }`}
            >
              {t(g.labelKey)}
            </button>
          );
        })}
      </div>

      {/* 模板网格 */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((tpl) => {
          const isPreviewing = previewing?.id === tpl.id;
          return (
            <div
              key={tpl.id}
              className="sf-scan group relative flex flex-col rounded border border-cyan-400/15 bg-black/40 p-4 transition hover:border-cyan-300/50"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="rounded border border-cyan-300/30 bg-cyan-300/10 px-1.5 py-0.5 font-mono text-2xs tracking-widest text-cyan-300">
                  {t(`novel.template.genre.${tpl.genre}`)}
                </span>
                <button
                  onClick={() => setPreviewing(isPreviewing ? null : tpl)}
                  className="rounded p-1 text-white/30 transition hover:bg-cyan-400/10 hover:text-cyan-300"
                  title={t('novel.template.preview')}
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
              </div>

              <div
                className="mb-2 text-base font-bold leading-tight text-white"
                style={{
                  fontFamily:
                    'var(--sf-font-display)'
                }}
              >
                {t(`novel.template.${tpl.id}.title`)}
              </div>

              <div className="mb-3 line-clamp-3 flex-1 text-xs leading-relaxed text-white/60">
                {tpl.prefilled.description}
              </div>

              <div className="mb-3 flex flex-wrap gap-1">
                {tpl.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-white/5 px-1.5 py-0.5 text-2xs tracking-wider text-white/40"
                  >
                    {t(`novel.template.tag.${tag}`)}
                  </span>
                ))}
              </div>

              <button
                onClick={() => onPick(tpl)}
                className="flex items-center justify-center gap-1.5 rounded border border-cyan-400/40 bg-cyan-400/10 px-3 py-1.5 text-xs tracking-wider text-cyan-300 transition hover:bg-cyan-400/20"
              >
                <Sparkles className="h-3 w-3" />
                {t('novel.template.use')}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-end gap-1 text-2xs tracking-widest text-cyan-300/40">
        <Check className="h-3 w-3" />
        {NOVEL_TEMPLATES.length} templates
      </div>

      {/* 模板预览弹窗:覆盖全屏,点击遮罩 / 关闭按钮 / ESC 均可关闭 */}
      {previewing &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={() => setPreviewing(null)}
          >
            <div
              className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-cyan-400/30 bg-[var(--sf-panel-solid)] p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewing(null)}
                className="absolute right-3 top-3 rounded p-1 text-white/40 transition hover:bg-white/10 hover:text-white"
                title={t('novel.template.preview')}
                aria-label={t('novel.template.preview')}
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mb-3 flex items-center gap-2">
                <Eye className="h-4 w-4 text-cyan-300" />
                <span className="text-sm font-semibold text-cyan-200">
                  {t('novel.template.preview')}
                </span>
                <span className="rounded border border-cyan-300/30 bg-cyan-300/10 px-1.5 py-0.5 font-mono text-2xs tracking-widest text-cyan-300">
                  {t(`novel.template.genre.${previewing.genre}`)}
                </span>
              </div>

              <div
                className="mb-4 text-lg font-bold text-white"
                style={{
                  fontFamily:
                    'var(--sf-font-display)'
                }}
              >
                {t(`novel.template.${previewing.id}.title`)}
              </div>

              <div className="space-y-4 text-xs leading-relaxed">
                {/* 简介 */}
                <div>
                  <div className="mb-1 text-2xs tracking-widest text-cyan-300/60">
                    {t('novel.template.preview.section.description')}
                  </div>
                  <div className="text-white/70">
                    {previewing.prefilled.description || '—'}
                  </div>
                </div>

                {/* 人物 */}
                {previewing.prefilled.characters?.length > 0 && (
                  <div>
                    <div className="mb-1 text-2xs tracking-widest text-cyan-300/60">
                      {t('novel.template.preview.section.characters')}
                      （{previewing.prefilled.characters.length}）
                    </div>
                    <ul className="space-y-1">
                      {previewing.prefilled.characters.map((c, i) => (
                        <li key={i} className="text-white/70">
                          <span className="text-cyan-200">{c.name}</span>
                          <span className="text-white/40"> · {c.gender} · {c.identity}</span>
                          <span className="text-white/50"> — {c.personality}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 世界观设定 */}
                {previewing.prefilled.worldSettings?.length > 0 && (
                  <div>
                    <div className="mb-1 text-2xs tracking-widest text-cyan-300/60">
                      {t('novel.template.preview.section.worldSettings')}
                      （{previewing.prefilled.worldSettings.length}）
                    </div>
                    <ul className="space-y-1.5">
                      {previewing.prefilled.worldSettings.map((w, i) => (
                        <li key={i} className="text-white/70">
                          <div>
                            <span className="text-cyan-200">{w.keyword}</span>
                            <span className="text-white/40"> · {w.category}</span>
                          </div>
                          <div className="text-white/50">{w.description}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 大纲 */}
                {previewing.prefilled.outline && (
                  <div>
                    <div className="mb-1 text-2xs tracking-widest text-cyan-300/60">
                      {t('novel.template.preview.section.outline')}
                    </div>
                    <div className="text-cyan-200">{previewing.prefilled.outline.title}</div>
                    <div className="text-white/50">
                      {t('novel.template.preview.theme')}：{previewing.prefilled.outline.theme}
                      {' · '}
                      {previewing.prefilled.outline.chapters}
                      {t('novel.template.preview.chapters')}
                    </div>
                    <div className="mt-1 whitespace-pre-wrap text-white/60">
                      {previewing.prefilled.outline.content}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

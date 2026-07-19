import { useEffect, useRef, useState } from 'react';
import { Loader2, Compass, Upload, Search, BookMarked, Terminal, Database } from 'lucide-react';
import { toast } from 'sonner';
import { notifyError } from '../api/client.js';
import {
  loreAsk,
  importLore,
  loreSearch
} from '../api/index.js';
import SettingCollection from '../components/SettingCollection.jsx';
import MemoryPanel from '../components/MemoryPanel.jsx';
import UsagePanel from '../components/UsagePanel.jsx';
import MessageComposer from '../components/MessageComposer.jsx';
import { useI18n } from '../context/I18nContext.jsx';

/**
 * 设定中心页面。
 * <p>顶层分三区:
 *  - 设定集(结构化分类词条库:人物/势力/地图/能力/武器/等级),由 SettingCollection 承载;
 *  - 知识库(RAG 向量库:问答/导入/检索);
 *  - 记忆(对话记忆与用量)。
 * 设定集与知识库在此清晰区分:前者是小说设定的权威来源,后者是检索增强的知识问答。</p>
 *
 * @author songshan.li (ID: 17099618)
 */
export default function Lore() {
  const { t } = useI18n();

  // 顶层三区:设定集 / 知识库 / 记忆
  const [tab, setTab] = useState('setting');
  // 知识库子 tab:问答 / 导入 / 检索
  const [kbTab, setKbTab] = useState('ask');

  const [sessionId, setSessionId] = useState('lore-001');
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const [loreTitle, setLoreTitle] = useState('');
  const [loreContent, setLoreContent] = useState('');
  const [importResult, setImportResult] = useState(null);

  const [query, setQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [history, loading]);

  const TOP_TABS = [
    { key: 'setting', label: t('lore.tabSetting'), icon: BookMarked },
    { key: 'knowledge', label: t('lore.tabKnowledge'), icon: Compass },
    { key: 'memory', label: t('lore.tabMemory'), icon: Database }
  ];
  const KB_TABS = [
    { key: 'ask', label: t('lore.tabAsk') },
    { key: 'import', label: t('lore.tabImport') },
    { key: 'search', label: t('lore.tabSearch') }
  ];

  const ask = async () => {
    if (!question.trim() || loading) return;
    const q = question.trim();
    setHistory((h) => [...h, { role: 'user', text: q }]);
    setQuestion('');
    setLoading(true);
    try {
      const a = await loreAsk(q, sessionId.trim() || 'lore-001');
      setHistory((h) => [...h, { role: 'assistant', text: a }]);
    } catch (err) {
      notifyError(t('lore.askFailed') + ':' + (err.response?.data?.message || err.message), err);
    } finally {
      setLoading(false);
    }
  };

  const doImport = async () => {
    if (!loreTitle.trim() || !loreContent.trim()) {
      toast.error(t('lore.titleRequired'));
      return;
    }
    setLoading(true);
    try {
      // 后端 LoreImportRequest 仅接收 {text, dir};title 仅作前端展示,不传后端
      const data = await importLore({ text: loreContent.trim() });
      setImportResult(data);
      toast.success(t('lore.imported'));
      setLoreTitle('');
      setLoreContent('');
    } catch (err) {
      notifyError(t('lore.importFailed') + ':' + (err.response?.data?.message || err.message), err);
    } finally {
      setLoading(false);
    }
  };

  const doSearch = async () => {
    if (!query.trim()) {
      toast.error(t('lore.queryRequired'));
      return;
    }
    setLoading(true);
    try {
      const data = await loreSearch(query.trim());
      setSearchResult(data);
    } catch (err) {
      notifyError(t('lore.searchFailed') + ':' + (err.response?.data?.message || err.message), err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <header className="border-b border-cyan-400/10 px-4 py-6 sm:px-8 sm:py-8">
        <div className="sf-heading">{t('nav.lore')}</div>
        <p className="mt-2 pl-4 text-xs tracking-wide text-cyan-300/50">
          {t('lore.subheading')}
        </p>
      </header>

      {/* 顶层三区切换 */}
      <div className="border-b border-cyan-400/10 px-4 py-3 sm:px-8">
        <div className="sf-scroll-x mx-auto flex items-center gap-2 overflow-x-auto pb-1">
          {TOP_TABS.map((tb) => {
            const Icon = tb.icon;
            const active = tab === tb.key;
            return (
              <button
                key={tb.key}
                onClick={() => setTab(tb.key)}
                className={`flex shrink-0 items-center gap-2 rounded border px-3 py-2 text-xs tracking-wider transition sm:px-4 ${
                  active
                    ? 'border-cyan-300/40 bg-cyan-300/10 text-cyan-300 shadow-[0_0_16px_rgba(var(--sf-accent-r),var(--sf-accent-g),var(--sf-accent-b),0.15)]'
                    : 'border-cyan-400/15 bg-transparent text-white/50 hover:border-cyan-300/40 hover:text-cyan-300'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tb.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-auto px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto h-full">
          {/* ====== 设定集 ====== */}
          {tab === 'setting' && <SettingCollection />}

          {/* ====== 知识库(RAG) ====== */}
          {tab === 'knowledge' && (
            <div className="flex h-full min-h-0 flex-col">
              <div className="sf-scroll-x mb-4 flex items-center gap-2 overflow-x-auto pb-1">
                {KB_TABS.map((kb) => {
                  const active = kbTab === kb.key;
                  return (
                    <button
                      key={kb.key}
                      onClick={() => setKbTab(kb.key)}
                      className={`shrink-0 rounded border px-3 py-1.5 text-xs tracking-wider transition ${
                        active
                          ? 'border-cyan-300/40 bg-cyan-300/10 text-cyan-300'
                          : 'border-cyan-400/15 bg-transparent text-white/50 hover:border-cyan-300/40 hover:text-cyan-300'
                      }`}
                    >
                      {kb.label}
                    </button>
                  );
                })}
              </div>

              {kbTab === 'ask' && (
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="mb-3 flex flex-wrap items-center gap-2 sm:gap-3">
                    <label className="text-xs tracking-wide text-cyan-300/60">{t('lore.session')}</label>
                    <input
                      value={sessionId}
                      onChange={(e) => setSessionId(e.target.value)}
                      className="sf-input min-w-0 flex-1 sm:max-w-[200px]"
                    />
                    <span className="hidden text-2xs tracking-wider text-white/30 sm:inline">{t('lore.sessionHint')}</span>
                  </div>

                  <div ref={scrollRef} className="flex-1 min-h-0 space-y-4 overflow-auto pb-4">
                    {history.length === 0 && !loading && (
                      <div className="flex h-full items-center justify-center text-white/20">
                        <div className="text-center">
                          <Compass className="mx-auto mb-3 h-12 w-12 opacity-40" />
                          <div className="text-sm tracking-wide text-white/40">{t('lore.awaiting')}</div>
                          <div className="mt-1 text-2xs text-white/30">{t('lore.awaitingHint')}</div>
                        </div>
                      </div>
                    )}
                    {history.map((m, i) => (
                      <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[85%] sm:max-w-[80%] rounded border px-3 py-2 sm:px-4 sm:py-3 ${
                            m.role === 'user'
                              ? 'border-cyan-300/40 bg-cyan-300/[0.08] text-white shadow-[0_0_16px_rgba(var(--sf-accent-r),var(--sf-accent-g),var(--sf-accent-b),0.15)]'
                              : 'border-cyan-400/15 bg-black/40 text-white/90'
                          }`}
                        >
                          <div className="mb-1 flex items-center gap-2 font-mono text-2xs tracking-widest text-cyan-300/50">
                            {m.role === 'user' ? (
                              <>
                                <Terminal className="h-2.5 w-2.5" /> {t('lore.user')}
                              </>
                            ) : (
                              <>
                                <span className="sf-dot" /> {t('lore.bot')}
                              </>
                            )}
                          </div>
                          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{m.text}</pre>
                        </div>
                      </div>
                    ))}
                    {loading && kbTab === 'ask' && (
                      <div className="flex justify-start">
                        <div className="rounded border border-cyan-400/15 bg-black/40 px-4 py-3">
                          <Loader2 className="h-4 w-4 animate-spin text-cyan-300/60" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 知识库问答输入框:置于消息区底部,随 flex 贴底 */}
                  <div className="shrink-0 border-t border-cyan-400/10 px-4 py-3 sm:px-8 sm:py-4">
                    <MessageComposer
                      value={question}
                      onChange={setQuestion}
                      onSend={ask}
                      loading={loading}
                      placeholder={t('lore.questionPlaceholder')}
                    />
                    {loading && <div className="sf-loader-bar mx-auto mt-3 max-w-4xl" />}
                  </div>
                </div>
              )}

              {kbTab === 'import' && (
                <div className="space-y-4">
                  <div className="sf-panel-hud p-4">
                    <label className="mb-2 block text-2xs tracking-widest text-cyan-300/60">{t('lore.title')}</label>
                    <input
                      value={loreTitle}
                      onChange={(e) => setLoreTitle(e.target.value)}
                      placeholder={t('lore.titlePlaceholder')}
                      className="sf-input w-full"
                    />
                  </div>
                  <div className="sf-panel-hud p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-2xs tracking-widest text-cyan-300/60">{t('lore.content')}</label>
                      <span className="text-2xs tracking-widest text-white/30">
                        {t('lore.charCount').replace('{n}', String(loreContent.length))}
                      </span>
                    </div>
                    <textarea
                      value={loreContent}
                      onChange={(e) => setLoreContent(e.target.value)}
                      rows={10}
                      placeholder={t('lore.contentPlaceholder')}
                      className="sf-input w-full resize-none"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs tracking-wide text-cyan-300/60">
                      <span className="sf-dot" />
                      {t('lore.ready')}
                    </div>
                    <button onClick={doImport} disabled={loading} className="sf-btn">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {loading ? t('lore.importing') : t('lore.import')}
                    </button>
                  </div>
                  {loading && <div className="sf-loader-bar" />}
                  {importResult && (
                    <div className="sf-panel-hud p-5">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="sf-chip">RESULT</span>
                        <span className="text-sm font-bold text-white">
                          <BookMarked className="mr-1 inline h-3.5 w-3.5 text-cyan-300" />
                          {t('lore.importResult')}
                        </span>
                      </div>
                      <pre className="max-h-[40vh] overflow-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-white/70">
                        {JSON.stringify(importResult, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {kbTab === 'search' && (
                <div className="space-y-4">
                  <div className="sf-panel-hud p-4">
                    <label className="mb-2 block text-2xs tracking-widest text-cyan-300/60">{t('lore.query')}</label>
                    <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && doSearch()}
                        placeholder={t('lore.queryPlaceholder')}
                        className="sf-input min-w-0 flex-1"
                      />
                      <button onClick={doSearch} disabled={loading} className="sf-btn">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        {t('lore.search')}
                      </button>
                    </div>
                  </div>
                  {searchResult && (
                    <div className="sf-panel-hud p-5">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="sf-chip">HITS</span>
                        <span className="text-sm font-bold text-white">{t('lore.hits')}</span>
                      </div>
                      {Array.isArray(searchResult) ? (
                        <div className="space-y-3">
                          {searchResult.map((r, i) => (
                            <div
                              key={i}
                              className="sf-scan rounded border border-cyan-400/15 bg-black/40 p-3"
                            >
                              <div className="mb-1 flex items-center justify-between text-xs">
                                <span className="font-mono text-cyan-300">
                                  #{String(i + 1).padStart(3, '0')} · {r.title || r.id || 'UNTITLED'}
                                </span>
                                {r.score && (
                                  <span className="font-mono text-2xs tracking-widest text-white/40">
                                    SCORE: {Number(r.score).toFixed(4)}
                                  </span>
                                )}
                              </div>
                              <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-white/70">
                                {r.content || r.text || JSON.stringify(r)}
                              </pre>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-white/70">
                          {JSON.stringify(searchResult, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                  {!searchResult && !loading && (
                    <div className="sf-panel rounded border border-dashed border-cyan-400/10 py-20 text-center text-white/30">
                      <Search className="mx-auto mb-3 h-12 w-12 opacity-40" />
                      <div className="text-sm tracking-wide text-white/40">{t('lore.hitsAwaiting')}</div>
                      <div className="mt-1 text-2xs text-white/30">{t('lore.hitsAwaitingHint')}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ====== 记忆 ====== */}
          {tab === 'memory' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <MemoryPanel />
                <UsagePanel variant="inline" />
              </div>
              <div className="sf-panel-hud p-4">
                <label className="mb-2 block text-2xs tracking-widest text-cyan-300/60">{t('lore.architectureTitle')}</label>
                <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-white/60">
{t('lore.architecture')}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

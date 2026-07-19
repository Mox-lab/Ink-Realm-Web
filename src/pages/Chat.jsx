import { useEffect, useRef, useState } from 'react';
import { Loader2, MessageSquare } from 'lucide-react';
import { chat, notifyError } from '../api/index.js';
import { useI18n } from '../context/I18nContext.jsx';
import MessageComposer from '../components/MessageComposer.jsx';

export default function Chat() {
  const { t } = useI18n();
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [history, loading]);

  const send = async () => {
    if (!message.trim() || loading) return;
    const userMsg = message.trim();
    setHistory((h) => [...h, { role: 'user', text: userMsg }]);
    setMessage('');
    setLoading(true);
    try {
      const reply = await chat(userMsg);
      setHistory((h) => [...h, { role: 'assistant', text: reply }]);
    } catch (err) {
      notifyError(t('chat.callFailed') + ':' + (err.response?.data?.message || err.message), err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sf-page flex h-full min-h-0 flex-1 flex-col">
      <header className="border-b border-cyan-400/10 px-4 py-6 sm:px-8 sm:py-8">
        <div className="sf-heading">{t('nav.chat')}</div>
        <p className="mt-2 pl-4 text-xs tracking-wide text-cyan-300/50">
          {t('chat.subheading')}
        </p>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-auto px-4 py-4 sm:px-8 sm:py-6">
        {history.length === 0 && (
          <div className="flex h-full items-center justify-center text-white/20">
            <div className="text-center">
              <MessageSquare className="mx-auto mb-3 h-12 w-12 opacity-40" />
              <div className="text-sm tracking-wide text-white/40">{t('chat.awaiting')}</div>
              <div className="mt-1 text-2xs text-white/30">{t('chat.awaitingHint')}</div>
            </div>
          </div>
        )}
        <div className="mx-auto max-w-3xl space-y-4 px-0 sm:px-2">
          {history.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded border px-3 py-2 sm:px-4 sm:py-3 ${
                  m.role === 'user'
                    ? 'border-cyan-300/40 bg-cyan-300/[0.08] text-white shadow-[0_0_16px_rgba(var(--sf-accent-r),var(--sf-accent-g),var(--sf-accent-b),0.15)]'
                    : 'border-cyan-400/15 bg-black/40 text-white/90'
                }`}
              >
                <div className="mb-1 flex items-center gap-2 font-mono text-2xs tracking-widest text-cyan-300/50">
                  <span className="sf-dot" />
                  {m.role === 'user' ? t('chat.user') : t('chat.assistant')}
                </div>
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{m.text}</pre>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded border border-cyan-400/15 bg-black/40 px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-cyan-300/60" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-cyan-400/10 px-4 py-3 sm:px-8 sm:py-4">
        <MessageComposer
          value={message}
          onChange={setMessage}
          onSend={send}
          loading={loading}
          placeholder={t('chat.placeholder')}
        />
        {loading && <div className="sf-loader-bar mx-auto mt-3 max-w-3xl" />}
      </div>
    </div>
  );
}

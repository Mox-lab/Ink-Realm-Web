import { Loader2, ArrowUp } from 'lucide-react';

/**
 * 合并输入框(DeepSeek 风格)。
 * <p>文本域与发送按钮同处一个圆角容器,发送按钮内嵌于右下角;
 * Enter 发送、Shift+Enter 换行。发送按钮本身无边框、无实心圆底色,
 * 仅以箭头高亮表达状态:可发送时箭头取主题强调色并带辉光,禁用时置灰。</p>
 *
 * @param {object} props
 * @param {string} props.value 当前输入
 * @param {(v:string)=>void} props.onChange 输入变更
 * @param {()=>void} props.onSend 发送回调
 * @param {boolean} [props.loading] 发送中
 * @param {boolean} [props.disabled] 禁用
 * @param {string} [props.placeholder] 占位文案
 * @author songshan.li (ID: 17099618)
 */
export default function MessageComposer({ value, onChange, onSend, loading, disabled, placeholder }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend()) onSend();
    }
  };

  const canSend = () => !loading && !disabled && value.trim().length > 0;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="relative sf-input !p-0 transition focus-within:border-[color:var(--sf-accent)]">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          placeholder={placeholder}
          className="block max-h-40 w-full resize-none bg-transparent px-4 pb-12 pt-3 text-sm leading-relaxed text-[var(--sf-text)] outline-none placeholder:text-[color:var(--sf-text-dim)]"
        />
        {/* 右下角:箭头高亮发送按钮(无边框/无实心圆底色);可发送时箭头取强调色并带辉光 */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-end px-3 py-2.5">
          <button
            type="button"
            onClick={() => canSend() && onSend()}
            disabled={!canSend()}
            title="发送"
            className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-[var(--sf-accent)]/10 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-[var(--sf-accent)]" />
            ) : (
              <ArrowUp
                className={`h-4 w-4 transition ${
                  canSend()
                    ? 'text-[var(--sf-accent)] drop-shadow-[0_0_6px_rgba(var(--sf-accent-r),var(--sf-accent-g),var(--sf-accent-b),0.6)]'
                    : 'text-[var(--sf-text-dim)]'
                }`}
              />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

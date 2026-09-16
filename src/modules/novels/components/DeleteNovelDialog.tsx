import { AlertTriangle } from 'lucide-react';
import { t } from '@/shared/i18n';

/**
 * 删除作品确认弹窗(功能文档 §6.3:提示含 N 章 N 设定,不可撤销)。
 *
 * <p>自建轻量 modal(项目尚无 Dialog 基类):遮罩点击不关闭——
 * 不可逆操作须显式选择,防误触;Esc 关闭等同取消。</p>
 *
 * @author Moma
 */

interface Props {
  /** 作品名(文案内插) */
  title: string;
  /** 章节数 */
  chapterCount: number;
  /** 设定条目数 */
  loreCount: number;
  /** 删除中(禁用按钮) */
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteNovelDialog({ title, chapterCount, loreCount, deleting, onConfirm, onCancel }: Props) {
  const text = t('novels.delete.text')
    .replace('{title}', title)
    .replace('{chapters}', String(chapterCount))
    .replace('{lores}', String(loreCount));

  return (
    // 固定层:portal 不必要(壳层无 backdrop-filter 祖先劫持场景——登录页外均为普通文档流)
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" aria-hidden />
      <div
        className="sf-panel relative z-10 w-full max-w-sm p-5"
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancel();
        }}
      >
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle size={18} className="text-[var(--sf-error)]" aria-hidden />
          <h2 className="sf-heading text-base font-semibold">{t('novels.delete.title')}</h2>
        </div>
        <p className="mb-5 text-sm leading-relaxed text-[var(--sf-text-dim)]">{text}</p>
        <div className="flex items-center justify-end gap-2">
          <button type="button" className="sf-btn min-h-10 px-4" disabled={deleting} onClick={onCancel}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="sf-btn min-h-10 px-4 text-white disabled:opacity-50"
            style={{ background: 'var(--sf-error)' }}
            disabled={deleting}
            onClick={onConfirm}
          >
            {t('novels.delete.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}

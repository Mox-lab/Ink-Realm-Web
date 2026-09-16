import { AlertTriangle } from 'lucide-react';
import { t } from '@/shared/i18n';

/**
 * lore 通用删除确认弹窗(词条/字典/关系共用)。
 *
 * <p>自建轻量 modal(与 novels 域 DeleteNovelDialog 同款交互):
 * 遮罩点击不关闭——不可逆操作须显式选择;Esc 关闭等同取消。</p>
 *
 * @author Moba
 */

interface Props {
  /** 确认文案(已内插名称) */
  text: string;
  /** 删除中(禁用按钮) */
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmDialog({ text, deleting, onConfirm, onCancel }: Props) {
  return (
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
          <h2 className="sf-heading text-base font-semibold">{t('lore.delete.title')}</h2>
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
            {t('lore.delete.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}

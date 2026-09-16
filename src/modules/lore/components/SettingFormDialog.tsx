import { useState } from 'react';
import { t } from '@/shared/i18n';
import { LORE_CATEGORIES, type LoreCategory, type SettingItem, type SettingSaveReq } from '../api';

/**
 * 设定词条新建/编辑弹窗(功能文档 §6.5)。
 *
 * <p>G3 编辑器形态:content 为 JSON 文本域(契约含 _struct 判别字段),
 * 结构化表单编辑器随后续批次按分类分化;提交前做 JSON 合法性前置校验,
 * 后端 40009 重名错误经 errorToast 提示。</p>
 *
 * @author Moba
 */

interface Props {
  /** 编辑时的初始词条(新建时省略) */
  initial?: SettingItem;
  /** 默认归类(从分类页签新建时预选) */
  defaultCategory?: LoreCategory;
  /** 提交中(禁用按钮) */
  saving: boolean;
  onSubmit: (req: SettingSaveReq) => void;
  onCancel: () => void;
}

export default function SettingFormDialog({ initial, defaultCategory, saving, onSubmit, onCancel }: Props) {
  const [category, setCategory] = useState<LoreCategory>(initial?.category ?? defaultCategory ?? 'worldview');
  const [name, setName] = useState(initial?.name ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));
  /** 字段级校验错误:挂在对应输入框下方并标红(不再统一堆弹窗底部) */
  const [error, setError] = useState<{ field: 'name' | 'content'; msg: string } | null>(null);

  const submit = (): void => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError({ field: 'name', msg: t('lore.setting.nameRequired') });
      return;
    }
    if (trimmedName.length > 128) {
      setError({ field: 'name', msg: t('lore.setting.nameMax') });
      return;
    }
    // content 前置校验:非空必须是合法 JSON(后端 JSONB 列会拒绝非法值)
    const trimmedContent = content.trim();
    if (trimmedContent) {
      try {
        JSON.parse(trimmedContent);
      } catch {
        setError({ field: 'content', msg: t('lore.setting.contentInvalidJson') });
        return;
      }
    }
    const parsedSort = Number.parseInt(sortOrder, 10);
    setError(null);
    onSubmit({
      category,
      name: trimmedName,
      content: trimmedContent || null,
      sortOrder: Number.isInteger(parsedSort) ? parsedSort : 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" aria-hidden />
      <div
        className="sf-panel relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto p-5"
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancel();
        }}
      >
        <h2 className="sf-heading mb-4 text-base font-semibold">
          {initial ? t('lore.setting.editTitle') : t('lore.setting.createTitle')}
        </h2>

        <div className="flex flex-col gap-4">
          {/* 分类:10 类封闭枚举 */}
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-[var(--sf-text-dim)]">{t('lore.setting.category')} *</span>
            <span className="sf-select-group">
              <select
                className="sf-input sf-select min-h-10"
                value={category}
                onChange={(e) => setCategory(e.target.value as LoreCategory)}
              >
                {LORE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {t(`lore.category.${c}`)}
                  </option>
                ))}
              </select>
            </span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-[var(--sf-text-dim)]">{t('lore.setting.name')} *</span>
            <input
              className={`sf-input ${error?.field === 'name' ? 'sf-input-invalid' : ''}`}
              value={name}
              maxLength={128}
              autoFocus
              onChange={(e) => setName(e.target.value)}
            />
            {error?.field === 'name' && (
              <p className="text-xs text-[var(--sf-error)]">{error.msg}</p>
            )}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-[var(--sf-text-dim)]">{t('lore.setting.content')}</span>
            <textarea
              className={`sf-input min-h-40 resize-y font-mono text-xs ${
                error?.field === 'content' ? 'sf-input-invalid' : ''
              }`}
              value={content}
              placeholder={t('lore.setting.contentPlaceholder')}
              onChange={(e) => setContent(e.target.value)}
            />
            {error?.field === 'content' && (
              <p className="text-xs text-[var(--sf-error)]">{error.msg}</p>
            )}
            <span className="text-xs text-[var(--sf-text-dim)]">{t('lore.setting.contentHint')}</span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-[var(--sf-text-dim)]">{t('lore.setting.sortOrder')}</span>
            <input
              className="sf-input"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </label>

          <div className="flex items-center justify-end gap-2">
            <button type="button" className="sf-btn min-h-10 px-4" disabled={saving} onClick={onCancel}>
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className="sf-btn sf-btn-primary min-h-10 px-5"
              disabled={saving}
              onClick={submit}
            >
              {t('common.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

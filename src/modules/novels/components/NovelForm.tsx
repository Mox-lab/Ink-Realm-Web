import { useEffect, useState } from 'react';
import { t } from '@/shared/i18n';
import type { NovelSaveReq } from '../api';
import { templateValues } from '../templates';
import NovelTemplatePicker from './NovelTemplatePicker';

/**
 * 作品创建/编辑共用表单(功能文档 §5.4:标题/题材/简介/题材模板 + 保存/取消)。
 *
 * <p>受控表单:值与 dirty 状态上抛页面(未保存离开提示由页面 useBlocker 承担);
 * 校验内联红字不弹窗(规范 §8.2)。</p>
 *
 * @author Moma
 */

interface Props {
  /** 编辑时的初始值(创建时省略) */
  initial?: NovelSaveReq;
  /** 提交中(禁用保存按钮) */
  saving: boolean;
  onSubmit: (req: NovelSaveReq) => void;
  onCancel: () => void;
  /** dirty 状态上抛(页面据此挂路由离开守卫) */
  onDirtyChange?: (dirty: boolean) => void;
}

/** 表单状态 */
interface FormState {
  title: string;
  genre: string;
  description: string;
}

export default function NovelForm({ initial, saving, onSubmit, onCancel, onDirtyChange }: Props) {
  const [form, setForm] = useState<FormState>({
    title: initial?.title ?? '',
    genre: initial?.genre ?? '',
    description: initial?.description ?? '',
  });
  const [error, setError] = useState<string | null>(null);
  const [tplKey, setTplKey] = useState('');

  // dirty 上抛:任一字段偏离初始值即视为有未保存修改
  useEffect(() => {
    const dirty =
      form.title !== (initial?.title ?? '') ||
      form.genre !== (initial?.genre ?? '') ||
      form.description !== (initial?.description ?? '');
    onDirtyChange?.(dirty);
  }, [form, initial, onDirtyChange]);

  /** 模板选中:填充题材与简介(可再改) */
  const applyTemplate = (key: string): void => {
    setTplKey(key);
    const v = templateValues(key);
    setForm((f) => ({ ...f, genre: v.genre, description: v.description }));
  };

  const submit = (): void => {
    const title = form.title.trim();
    if (!title) {
      setError(t('novels.form.titleRequired'));
      return;
    }
    if (title.length > 128) {
      setError(t('novels.form.titleMax'));
      return;
    }
    setError(null);
    onSubmit({
      title,
      genre: form.genre.trim() || null,
      description: form.description.trim() || null,
    });
  };

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <NovelTemplatePicker value={tplKey} onChange={applyTemplate} />

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-[var(--sf-text-dim)]">{t('novels.form.title')} *</span>
        <input
          className="sf-input"
          value={form.title}
          maxLength={128}
          autoFocus
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-[var(--sf-text-dim)]">{t('novels.form.genre')}</span>
        <input
          className="sf-input"
          value={form.genre}
          maxLength={32}
          onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-[var(--sf-text-dim)]">{t('novels.form.description')}</span>
        <textarea
          className="sf-input min-h-28 resize-y"
          value={form.description}
          maxLength={5000}
          placeholder={t('novels.form.descPlaceholder')}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
      </label>

      {error && <p className="text-sm text-[var(--sf-error)]">{error}</p>}

      <div className="flex items-center justify-end gap-2">
        <button type="button" className="sf-btn min-h-10 px-4" disabled={saving} onClick={onCancel}>
          {t('common.cancel')}
        </button>
        <button type="submit" className="sf-btn sf-btn-primary min-h-10 px-5" disabled={saving}>
          {t('common.save')}
        </button>
      </div>
    </form>
  );
}

import { Building2, Landmark, PenLine, Rocket, Search, Sparkles } from 'lucide-react';
import { t } from '@/shared/i18n';
import { NOVEL_TEMPLATES, type NovelTemplate } from '../templates';

/**
 * 题材模板选择器(功能文档 §5.4:选中即填充表单,可再改)。
 *
 * <p>受控组件:选中键由父级表单持有,点击回调上抛;
 * 空白模板恒排最后(templates.ts 顺序)。</p>
 *
 * @author Moma
 */

const ICONS = {
  sparkles: Sparkles,
  building: Building2,
  rocket: Rocket,
  landmark: Landmark,
  search: Search,
  'pen-line': PenLine,
} as const;

interface Props {
  /** 当前选中模板键(空串=未选) */
  value: string;
  onChange: (key: string) => void;
}

export default function NovelTemplatePicker({ value, onChange }: Props) {
  return (
    <div>
      <div className="mb-1.5 text-sm text-[var(--sf-text-dim)]">{t('novels.form.template')}</div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {NOVEL_TEMPLATES.map((tpl: NovelTemplate) => {
          const Icon = ICONS[tpl.icon];
          const active = value === tpl.key;
          return (
            <button
              key={tpl.key}
              type="button"
              aria-pressed={active}
              className={`sf-btn flex min-h-10 flex-col items-start gap-1 px-3 py-2 text-left text-sm ${
                active ? 'sf-btn-primary' : ''
              }`}
              onClick={() => onChange(tpl.key)}
            >
              <Icon size={15} aria-hidden />
              <span className="truncate">{t(`novels.tpl.${tpl.key}.name`)}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 text-xs text-[var(--sf-text-dim)]">{t('novels.form.templateHint')}</p>
    </div>
  );
}

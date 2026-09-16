import { useLang } from '@/shared/i18n/LangContext';
import { t } from '@/shared/i18n';

/**
 * 语言切换控件(单按钮循环:中文↔English;按钮展示待切换的目标语言,
 * 语言名显示自身不做翻译;落位 MainLayout 与登录页顶栏)。
 */
export default function LangSwitcher() {
  const { lang, setLang } = useLang();
  return (
    <button
      type="button"
      className="sf-icon-btn px-2 py-2 text-sm font-semibold"
      aria-label={t('lang.switch')}
      title={t('lang.switch')}
      onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
    >
      {/* 展示待切换的目标语言(点击即达),而非当前语言 */}
      {lang === 'zh' ? 'EN' : '中'}
    </button>
  );
}

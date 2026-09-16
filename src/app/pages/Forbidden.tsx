import { t } from '@/shared/i18n';

/**
 * 403 无权限页(功能文档 M0;非管理员访问管理入口等场景)。
 */
export default function Forbidden() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="sf-panel p-10 text-center">
        <p className="mb-4 text-lg">{t('common.forbidden')}</p>
        <button type="button" className="sf-btn" onClick={() => history.back()}>
          {t('common.back')}
        </button>
      </div>
    </main>
  );
}

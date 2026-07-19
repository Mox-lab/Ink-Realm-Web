import { Component } from 'react';
import PropTypes from 'prop-types';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { useI18n } from '../context/I18nContext.jsx';

/**
 * 错误兜底展示(函数组件,便于使用 useI18n)。
 * <p>由 {@link ErrorBoundary} 在捕获到渲染期异常后渲染。</p>
 *
 * @author songshan.li (ID: 17099618)
 */
function ErrorFallback() {
  const { t } = useI18n();
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center"
      style={{ background: 'var(--sf-bg)', color: 'var(--sf-text)' }}
    >
      <AlertTriangle size={40} style={{ color: 'var(--sf-accent)' }} />
      <h1 className="text-xl" style={{ fontFamily: 'var(--sf-font-display)' }}>
        {t('common.errorTitle')}
      </h1>
      {/* 生产环境展示统一友好提示,不暴露技术细节 */}
      <p className="text-sm" style={{ color: 'var(--sf-text-muted, var(--sf-text))' }}>
        {t('common.systemBusy')}
      </p>
      <button
        type="button"
        className="sf-btn flex items-center gap-2 px-4 py-2"
        onClick={() => window.location.reload()}
      >
        <RefreshCw size={16} />
        {t('common.reload')}
      </button>
    </div>
  );
}

/**
 * 全局错误边界。
 *
 * <p>捕获子树渲染期未处理异常,避免整页白屏,并展示统一友好提示
 * (对应《前端规范》五「全局错误捕获」)。网络层 401 / 业务错误由
 * api/client.js 拦截器处理,不进入此边界。</p>
 *
 * @author songshan.li (ID: 17099618)
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  /** 捕获到异常时切换到兜底 UI。 */
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  /** 统一日志出口:后续可在此接入日志上报接口。 */
  componentDidCatch(error, info) {
    // 仅开发环境打印,生产由构建插件移除 console
    if (import.meta.env?.DEV) {
      console.error('[ErrorBoundary]', error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  /** 被保护的子树 */
  children: PropTypes.node,
};

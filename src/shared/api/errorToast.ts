import { toast } from 'sonner';
import { ApiError } from './client';

/**
 * 统一错误提示(四件套之四):sonner 全局唯一错误出口。
 *
 * <p>组件内 catch 一律调本函数,勿自行 toast(规范 §8.2);
 * 以消息文本为 sonner 去重 id,同文案短时间只弹一条。</p>
 *
 * @author Moma
 */

/**
 * 弹出错误提示。
 *
 * @param msg 面向用户的中文提示
 * @param err 原始错误(可选,仅控制台记录便于排查,不重复弹窗)
 */
export function notifyError(msg: string, err?: unknown): void {
  // 业务错误优先展示后端 message(如"作品名已存在")
  const detail = err instanceof ApiError ? err.message : undefined;
  toast.error(detail ? `${msg}:${detail}` : msg, { id: `${msg}:${detail ?? ''}` });
  if (err !== undefined) {
    // 控制台保留完整错误上下文
    console.warn(`[notifyError] ${msg}`, err);
  }
}

import { tokenStore } from './token';

/**
 * SSE 流式请求(四件套之二):生成/续写/润色/对话全链路统一入口。
 *
 * <p>用 fetch + ReadableStream 手工解析 SSE 帧(event:/data: 行,空行分发),
 * 支持 POST 携带 JSON 体(原生 EventSource 不支持 POST)。</p>
 *
 * <p>⚠️ 与 client 纪律一致:调用方传**不带 /api 前缀**的路径,本模块内部拼接。</p>
 *
 * @author Moma
 */

/** 流式事件处理器集合 */
export interface StreamHandlers {
  /**
   * 每个完整 SSE 帧回调。
   *
   * @param event 事件名(如 message/done/error)
   * @param data  数据载荷(JSON 字符串或纯文本)
   */
  onEvent: (event: string, data: string) => void;
  /** 流正常结束回调(服务端 done 事件后) */
  onDone?: () => void;
  /** 流异常回调(网络断开/HTTP 错误/解析失败) */
  onError?: (err: unknown) => void;
}

/**
 * 发起 SSE 流式 POST。
 *
 * @param url      业务路径(不带 /api 前缀,如 /writing/stream/chapter)
 * @param body     请求体(自动 JSON 序列化)
 * @param handlers 事件处理器
 * @param signal   中断信号(取消生成用)
 */
export async function streamPost(
  url: string,
  body: unknown,
  handlers: StreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const token = tokenStore.getAccess();
  try {
    const res = await fetch(`/api${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!res.ok || !res.body) {
      handlers.onError?.(new Error(`SSE 请求失败: HTTP ${res.status}`));
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    // 帧累积缓冲:SSE 帧以空行分隔
    let buffer = '';
    let eventName = 'message';
    let dataLines: string[] = [];
    let done = false;

    // 逐块解码并按帧分发
    for (;;) {
      const { value, done: finished } = await reader.read();
      if (finished) break;
      buffer += decoder.decode(value, { stream: true });

      const frames = buffer.split('\n\n');
      // 最后一段可能是不完整帧,留在缓冲
      buffer = frames.pop() ?? '';

      for (const frame of frames) {
        for (const line of frame.split('\n')) {
          if (line.startsWith('event:')) {
            eventName = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            dataLines.push(line.slice(5).trimStart());
          }
        }
        if (dataLines.length > 0) {
          const data = dataLines.join('\n');
          handlers.onEvent(eventName, data);
          // 服务端 done 事件标志流结束
          if (eventName === 'done') done = true;
        }
        eventName = 'message';
        dataLines = [];
      }
      if (done) break;
    }

    if (done) {
      handlers.onDone?.();
    } else {
      // 流提前关闭且无 done 事件,按异常处理
      handlers.onError?.(new Error('SSE 流异常关闭(未收到 done 事件)'));
    }
  } catch (err) {
    // AbortError 属用户主动取消,不算异常
    if ((err as Error).name !== 'AbortError') {
      handlers.onError?.(err);
    }
  }
}

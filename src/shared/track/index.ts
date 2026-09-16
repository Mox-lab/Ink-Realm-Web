/**
 * 埋点 SDK:事件名 `<域>.<动作>`(规范 §8),fire-and-forget 静默失败。
 *
 * <p>用裸 fetch 不走 client 拦截器——未登录时的埋点(如 auth.login 点击)
 * 绝不能触发 401 刷新链路;track 域 G5 上线前接口 404 属预期,静默吞掉。</p>
 *
 * @author Moma
 */

/**
 * 上报埋点事件。
 *
 * @param event 事件名(如 auth.login)
 * @param props 附加属性(可空)
 */
export function track(event: string, props?: Record<string, unknown>): void {
  if (typeof fetch === 'undefined') return;
  fetch('/api/track/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, props: props ?? {}, ts: Date.now() }),
    keepalive: true,
  }).catch(() => {
    // 静默失败:埋点永不影响主流程
  });
}

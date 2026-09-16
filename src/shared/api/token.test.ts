import { describe, expect, it } from 'vitest';
import { parsePayload, tokenStore } from './token';

/**
 * tokenStore 单测:JWT 解析与过期判定(纯函数,不碰 localStorage)。
 *
 * @author Moma
 */

/** 构造测试用 JWT(header.payload.signature,载荷 base64url 编码) */
function makeJwt(payload: Record<string, unknown>): string {
  const encode = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${encode({ alg: 'HS256' })}.${encode(payload)}.sig`;
}

describe('parsePayload', () => {
  it('正确解析标准 JWT 载荷', () => {
    const jwt = makeJwt({ sub: '10086', exp: 1_800_000_000 });
    const payload = parsePayload(jwt);
    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe('10086');
    expect(payload?.exp).toBe(1_800_000_000);
  });

  it('非法 token 返回 null', () => {
    expect(parsePayload('not-a-jwt')).toBeNull();
    expect(parsePayload('')).toBeNull();
  });
});

describe('tokenStore.isExpired', () => {
  it('未过期 token 返回 false', () => {
    // 过期时间设为远未来
    const jwt = makeJwt({ sub: '1', exp: Math.floor(Date.now() / 1000) + 3600 });
    expect(tokenStore.isExpired(jwt)).toBe(false);
  });

  it('已过期 token 返回 true', () => {
    const jwt = makeJwt({ sub: '1', exp: Math.floor(Date.now() / 1000) - 3600 });
    expect(tokenStore.isExpired(jwt)).toBe(true);
  });

  it('不可解析 token 视为过期', () => {
    expect(tokenStore.isExpired('garbage')).toBe(true);
  });
});

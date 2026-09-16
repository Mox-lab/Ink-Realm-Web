import { describe, expect, it } from 'vitest';
import { assessPasswordStrength } from './passwordStrength';

/**
 * 密码强度评估边界用例。
 *
 * @author Moba
 */
describe('assessPasswordStrength', () => {
  it('长度不足 6 一律弱(含空串)', () => {
    expect(assessPasswordStrength('')).toBe(0);
    expect(assessPasswordStrength('Ab1!')).toBe(0);
  });

  it('单一类别字符为弱(即使较长)', () => {
    expect(assessPasswordStrength('abcdef')).toBe(0);
    expect(assessPasswordStrength('123456')).toBe(0);
    expect(assessPasswordStrength('abcdefghij')).toBe(0);
  });

  it('短且类别少为弱', () => {
    expect(assessPasswordStrength('abc123')).toBe(0);
  });

  it('中等强度:长度达标且两类以上,或短但杂', () => {
    expect(assessPasswordStrength('Abc123')).toBe(1); // 6 位 3 类
    expect(assessPasswordStrength('Abc12345')).toBe(1); // 8 位 3 类
    expect(assessPasswordStrength('abcd1234')).toBe(1); // 8 位 2 类
  });

  it('强:长且杂', () => {
    expect(assessPasswordStrength('Abc1234567')).toBe(2); // 10 位 3 类
    expect(assessPasswordStrength('abcd1234efgh')).toBe(2); // 12 位 2 类
    expect(assessPasswordStrength('Abc123!@#$')).toBe(2); // 10 位 4 类
  });
});

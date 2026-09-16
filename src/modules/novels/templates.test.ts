import { describe, expect, it } from 'vitest';
import { NOVEL_TEMPLATES, templateValues } from './templates';

/**
 * 题材模板单测:模板清单完整性与填充值取词。
 *
 * @author Moma
 */

describe('NOVEL_TEMPLATES', () => {
  it('含 5 个题材模板 + 1 个空白模板', () => {
    expect(NOVEL_TEMPLATES).toHaveLength(6);
    expect(NOVEL_TEMPLATES.at(-1)?.key).toBe('blank');
  });

  it('模板键无重复', () => {
    const keys = NOVEL_TEMPLATES.map((t) => t.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('templateValues', () => {
  it('blank 模板返回空串(从零手填)', () => {
    const v = templateValues('blank');
    expect(v.genre).toBe('');
    expect(v.description).toBe('');
  });

  it('题材模板返回当前语言文案(node 环境回退中文)', () => {
    const v = templateValues('fantasy');
    expect(v.genre).toBe('东方玄幻');
    expect(v.description.length).toBeGreaterThan(0);
  });

  it('未知键回退键名(t() 死键约定,便于发现)', () => {
    const v = templateValues('nonexistent');
    expect(v.genre).toBe('novels.tpl.nonexistent.genre');
  });
});

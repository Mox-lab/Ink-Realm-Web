import { describe, expect, it } from 'vitest';
import { getLang, setLang, t } from './index';
import { dict as zhDict } from './zh';
import { dict as enDict } from './en';

/**
 * i18n 核心单测:翻译回退与语言切换(node 环境无 localStorage,验证防御逻辑)。
 *
 * @author Moma
 */

describe('t 翻译', () => {
  it('命中当前语言字典', () => {
    expect(t('common.confirm')).toBe('确认');
  });

  it('键不存在时回退返回键名(便于发现死键)', () => {
    expect(t('not.exist.key')).toBe('not.exist.key');
  });
});

describe('语言切换', () => {
  it('setLang 后 t 输出跟随切换', () => {
    setLang('en');
    expect(getLang()).toBe('en');
    expect(t('common.confirm')).toBe('Confirm');
    // 恢复中文,避免影响其他用例
    setLang('zh');
    expect(t('common.confirm')).toBe('确认');
  });
});

describe('zh/en 字典键同步', () => {
  it('两字典键集合完全一致(防单侧漏键)', () => {
    expect(Object.keys(enDict).sort()).toEqual(Object.keys(zhDict).sort());
  });

  it('所有键值均为非空字符串', () => {
    for (const [key, zhValue] of Object.entries(zhDict)) {
      expect(zhValue.length).toBeGreaterThan(0);
      // en 侧同键必须有非空翻译(键同步用例已保证键存在,此处兜底空串)
      expect(enDict[key]?.length ?? 0).toBeGreaterThan(0);
    }
  });
});

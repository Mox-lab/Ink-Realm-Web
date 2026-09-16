import { t } from '@/shared/i18n';

/**
 * 题材模板常量(功能文档 §5.4 NovelTemplatePicker:选中即填充表单,可再改)。
 *
 * <p>G2 无模板表,前端常量承载;名称/简介走 i18n 键,渲染时经 t() 取当前语言。
 * 模板填充的 genre/description 属用户数据,随界面语言入库(个人工具可接受)。</p>
 *
 * @author Moma
 */

/** 题材模板 */
export interface NovelTemplate {
  /** 模板键(同时用于 i18n 键前缀与测试标识) */
  key: string;
  /** 图标(lucide 图标名,由组件映射) */
  icon: 'sparkles' | 'building' | 'rocket' | 'landmark' | 'search' | 'pen-line';
}

/** 内置题材模板(blank=空白手填,恒排最后) */
export const NOVEL_TEMPLATES: NovelTemplate[] = [
  { key: 'fantasy', icon: 'sparkles' },
  { key: 'urban', icon: 'building' },
  { key: 'scifi', icon: 'rocket' },
  { key: 'history', icon: 'landmark' },
  { key: 'mystery', icon: 'search' },
  { key: 'blank', icon: 'pen-line' },
];

/**
 * 取模板填充值(genre/description 的 i18n 键约定:
 * `novels.tpl.<key>.genre` 与 `novels.tpl.<key>.desc`)。
 *
 * @param key 模板键
 * @returns 题材与简介填充值(blank 模板返回空串)
 */
export function templateValues(key: string): { genre: string; description: string } {
  if (key === 'blank') {
    return { genre: '', description: '' };
  }
  return { genre: t(`novels.tpl.${key}.genre`), description: t(`novels.tpl.${key}.desc`) };
}

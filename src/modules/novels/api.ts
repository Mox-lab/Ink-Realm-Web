import { client } from '@/shared/api/client';
import { track } from '@/shared/track';

/**
 * novels 模块 API:作品列表/创建/详情/更新/删除/TXT 导出。
 * client 拦截器已解包 Result,直接返回业务载荷。
 *
 * @author Moma
 */

/** 作品(列表/写操作返回,与后端 NovelVO 对齐) */
export interface NovelItem {
  /** 作品 ID */
  id: number;
  /** 作品名 */
  title: string;
  /** 题材(可空) */
  genre: string | null;
  /** 简介(可空) */
  description: string | null;
  /** 状态:draft 草稿 */
  status: string;
  /** 总字数(G5 起有数据源) */
  wordCount: number;
  /** 创建时间(ISO 8601) */
  createdAt: string;
  /** 更新时间(ISO 8601) */
  updatedAt: string;
}

/** 作品详情(含统计,与后端 NovelDetailVO 对齐) */
export interface NovelDetail {
  novel: NovelItem;
  /** 章节数(G2 阶段恒 0,ink_chapter 表 G5 落地) */
  chapterCount: number;
  /** 设定条目数(删除确认弹窗数据源) */
  loreCount: number;
}

/** 作品保存请求(创建/更新共用,与后端 NovelSaveReq 对齐) */
export interface NovelSaveReq {
  /** 作品名(必填,≤128 字) */
  title: string;
  /** 题材(可选) */
  genre?: string | null;
  /** 简介(可选) */
  description?: string | null;
}

/**
 * 当前用户的作品列表(按更新时间倒序)。
 *
 * @returns 作品列表
 */
export function listNovels(): Promise<NovelItem[]> {
  return client.get('/novels').then((r) => r.data);
}

/**
 * 创建作品。
 *
 * @param req 保存请求
 * @returns 创建后的作品
 */
export function createNovel(req: NovelSaveReq): Promise<NovelItem> {
  return client.post('/novels', req).then((r) => r.data);
}

/**
 * 作品详情(含章节数/设定数统计)。
 *
 * @param id 作品 ID
 * @returns 详情
 */
export function getNovel(id: number): Promise<NovelDetail> {
  return client.get(`/novels/${id}`).then((r) => r.data);
}

/**
 * 更新作品。
 *
 * @param id  作品 ID
 * @param req 保存请求
 * @returns 更新后的作品
 */
export function updateNovel(id: number, req: NovelSaveReq): Promise<NovelItem> {
  return client.put(`/novels/${id}`, req).then((r) => r.data);
}

/**
 * 删除作品(逻辑删除,不可撤销)。
 *
 * @param id 作品 ID
 */
export function deleteNovel(id: number): Promise<void> {
  return client.delete(`/novels/${id}`).then(() => undefined);
}

/** 导出文档格式:txt 纯文本 / md Markdown */
export type ExportFormat = 'txt' | 'md';

/**
 * 导出作品文档(G2 含作品元信息,章节正文随 G5 接入)。
 *
 * <p>responseType blob:响应拦截器对 Blob 无 'code' 字段判定,原样透传。</p>
 *
 * @param id     作品 ID
 * @param format 导出格式
 * @returns 文档文件 Blob
 */
export async function exportNovel(id: number, format: ExportFormat): Promise<Blob> {
  const res = await client.get(`/novels/${id}/export`, { responseType: 'blob', params: { format } });
  return res.data as Blob;
}

/**
 * 导出并触发浏览器下载(列表卡片右下角)。
 *
 * <p>内聚埋点 + blob 下载;错误上抛由调用方 notifyError 提示。</p>
 *
 * @param id     作品 ID
 * @param title  作品名(下载文件名)
 * @param format 导出格式
 */
export async function downloadNovelExport(id: number, title: string, format: ExportFormat): Promise<void> {
  track('novel.export', { novelId: id, format });
  const blob = await exportNovel(id, format);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title}.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}

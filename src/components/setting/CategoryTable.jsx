import { Pencil, Trash2 } from 'lucide-react';
import { useI18n } from '../../context/I18nContext.jsx';
import { parseStruct } from './struct.js';

/**
 * 配置驱动分化表格。
 * <p>依据分类的列配置(CAT_COLUMNS)渲染专属列,消除「所有分类都用同一套百科卡片」的重复感;
 * 每行提供编辑/删除操作,编辑回调交由父组件弹出结构化编辑器。</p>
 *
 * @param {object} props
 * @param {Array} props.items 已按分类筛选的设定列表
 * @param {Array} props.columns 列配置(来自 getColumns)
 * @param {(item:object)=>void} props.onEdit 编辑回调
 * @param {(id:string|number)=>void} props.onDelete 删除回调
 * @author songshan.li (ID: 17099618)
 */

/** 取单元格原始值:keyword/text 特殊,其余取自结构化 data。 */
function cellValue(item, col) {
  const { data, text } = parseStruct(item.description);
  if (col.key === 'keyword') return item.keyword;
  if (col.key === 'text') return text;
  return data[col.key];
}

/** 属性迷你条(取前 3 项)。 */
function AttrBars({ attrs }) {
  const entries = Object.entries(attrs || {}).slice(0, 3);
  if (!entries.length) return <span className="text-2xs text-white/30">—</span>;
  return (
    <div className="space-y-0.5">
      {entries.map(([k, v]) => (
        <div key={k} className="flex items-center gap-1">
          <span className="w-10 shrink-0 truncate text-2xs text-white/45">{k}</span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/5">
            <div className="h-full rounded-full bg-cyan-300/70" style={{ width: (Number(v) || 0) + '%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function renderCell(item, col, t) {
  const val = cellValue(item, col);
  switch (col.type) {
    case 'name':
      return <span className="font-bold text-white">{val || '—'}</span>;
    case 'text':
      return <span className="line-clamp-2 text-xs text-white/55">{val || '—'}</span>;
    case 'tags': {
      const tags = val || [];
      if (!tags.length) return <span className="text-2xs text-white/30">—</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 3).map((tg) => (
            <span key={tg} className="rounded bg-white/5 px-1.5 py-0.5 text-2xs text-white/45">
              {tg}
            </span>
          ))}
        </div>
      );
    }
    case 'attrs':
      return <AttrBars attrs={val} />;
    case 'count':
      return (
        <span className="font-mono text-xs text-cyan-300/70">
          {Array.isArray(val) ? val.length : 0}
        </span>
      );
    case 'rank':
      return val ? (
        <span className="rounded border border-amber-300/30 bg-amber-300/10 px-1.5 py-0.5 text-2xs text-amber-200/80">
          {val}
        </span>
      ) : (
        <span className="text-2xs text-white/30">—</span>
      );
    case 'number':
      return <span className="font-mono text-xs text-white/80">{val ?? '—'}</span>;
    case 'progress':
      return (
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/5">
            <div className="h-full rounded-full bg-cyan-300/70" style={{ width: (Number(val) || 0) * 100 + '%' }} />
          </div>
          <span className="font-mono text-2xs text-white/50">{Math.round((Number(val) || 0) * 100)}%</span>
        </div>
      );
    default:
      return <span className="text-xs text-white/55">{val || '—'}</span>;
  }
}

export default function CategoryTable({ items, columns, onEdit, onDelete }) {
  const { t } = useI18n();

  if (!items || items.length === 0) {
    return (
      <div className="rounded border border-dashed border-cyan-400/10 py-12 text-center text-xs text-white/30">
        {t('setting.empty')}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-cyan-400/15 text-left text-2xs tracking-widest text-cyan-300/60">
            {columns.map((c) => (
              <th key={c.key} className="px-3 py-2 font-normal">
                {t(c.label)}
              </th>
            ))}
            <th className="px-3 py-2 text-right font-normal">{t('setting.colActions')}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id} className="border-b border-cyan-400/10 transition hover:bg-cyan-300/[0.03]">
              {columns.map((c) => (
                <td key={c.key} className="px-3 py-2 align-top text-white/75">
                  {renderCell(it, c, t)}
                </td>
              ))}
              <td className="px-3 py-2 text-right align-top">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(it)}
                    className="font-mono text-2xs tracking-widest text-cyan-300/50 hover:text-cyan-300"
                    title={t('common.edit')}
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(it.id)}
                    className="font-mono text-2xs tracking-widest text-rose-300/50 hover:text-rose-300"
                    title={t('common.delete')}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, FileText, Copy, ChevronRight, ArrowRight, History, Trash2, PenLine, Check, Plus, Compass, BookMarked } from 'lucide-react';
import { toast } from 'sonner';
import { notifyError } from '../api/client.js';
import {
  planOutline as planOutlineApi,
  expandOutlineVolume as expandOutlineVolumeApi,
  generateConcept,
  generateSetting,
  saveOutline as saveOutlineApi,
  listOutlines,
  getOutline,
  activateOutline,
  deleteOutline
} from '../api/index.js';
import { listSettings } from '../api/data.js';
import { buildSettingConstraint } from '../utils/settingConstraint.js';
import HistoryDrawer from '../components/HistoryDrawer.jsx';
import SaveButton from '../components/SaveButton.jsx';
import DraftRestoreBanner from '../components/DraftRestoreBanner.jsx';
import { useI18n } from '../context/I18nContext.jsx';
import { STORAGE_KEYS, draftKey } from '../constants/storage.js';
import { loadDraft, clearDraft } from '../utils/storage.js';
import { useAutoSave } from '../hooks/useAutoSave.js';
import { parseOutlineVolumes, serializeVolumes, insertVolumeChapters } from '../utils/parse.js';
import { useNovelId } from '../hooks/useNovelId.js';

/**
 * 章节节点卡片(横向流程中的单章)。
 */
function FlowNode({ node, active, onClick, onJumpToChapter }) {
  return (
    <div
      className={`sf-scan relative flex w-[80vw] shrink-0 cursor-pointer flex-col rounded border p-4 transition sm:w-64 md:w-72 ${
        active
          ? 'border-cyan-300 bg-cyan-400/[0.08] shadow-[0_0_24px_rgba(var(--sf-accent-r),var(--sf-accent-g),var(--sf-accent-b),0.25)]'
          : 'border-cyan-400/15 bg-black/40 hover:border-cyan-300/50 hover:bg-cyan-400/[0.04]'
      }`}
    >
      <div
        onClick={onClick}
        className="flex h-full flex-col"
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded border border-cyan-300/40 bg-cyan-300/10 font-mono text-xs text-cyan-300">
              {String(node.no).padStart(2, '0')}
            </div>
            <span className="sf-chip">CHAPTER</span>
          </div>
          <span className="font-mono text-2xs text-white/30">
            {String(node.index + 1).padStart(3, '0')}
          </span>
        </div>

        <div className="mb-2 text-sm font-bold leading-tight text-white">{node.title}</div>

        <div className="line-clamp-3 flex-1 text-xs leading-relaxed text-white/60">
          {node.summary || '(无摘要)'}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-cyan-400/10 pt-2 text-2xs tracking-widest text-cyan-300/40">
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onJumpToChapter?.(node);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation();
              onJumpToChapter?.(node);
            }
          }}
          className="flex items-center gap-1 rounded px-1.5 py-1 text-cyan-300/60 transition hover:bg-cyan-400/10 hover:text-cyan-300"
          title="以此节点为大纲跳转到章节页"
        >
          <PenLine className="h-3 w-3" />
          写此章
        </span>
        <ChevronRight className="h-3 w-3" />
      </div>
    </div>
  );
}

/**
 * 单卷内的横向章节流程(可横向滚动)。
 * 平铺场景会挂 scrollRef 以支持左右按钮;分组场景每卷独立滚动,不挂 scrollRef。
 */
function VolumeChapterFlow({ chapters, activeNode, onSelectNode, onJump, scrollRef }) {
  const { t } = useI18n();
  if (!chapters || chapters.length === 0) {
    return (
      <div className="py-6 text-center text-2xs tracking-wide text-white/30">
        {t('outline.volumeEmpty')}
      </div>
    );
  }
  return (
    <div
      ref={scrollRef}
      className="sf-scroll-x flex items-stretch gap-2 overflow-x-auto pb-2"
      style={scrollRef ? { scrollBehavior: 'smooth' } : undefined}
    >
      {chapters.map((node, i) => (
        <div key={node.index} className="flex items-stretch gap-2">
          <FlowNode
            node={node}
            active={activeNode?.index === node.index}
            onClick={() => onSelectNode(node)}
            onJumpToChapter={onJump}
          />
          {i < chapters.length - 1 && (
            <div className="flex items-center px-1 text-cyan-300/40">
              <ArrowRight className="h-4 w-4" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * 逐卷内联编辑弹窗:编辑单卷的卷名、卷主线,以及逐章的章号/标题/细纲,
 * 支持增删章节。保存时把编辑结果回写为大纲全文(经 serializeVolumes)。
 *
 * @param {{open:boolean, vol:object, onClose:Function, onSave:Function}} props
 */
function VolumeEditModal({ open, vol, onClose, onSave }) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [arc, setArc] = useState('');
  const [chapters, setChapters] = useState([]);

  useEffect(() => {
    if (open && vol) {
      setName(vol.volume.name || '');
      setArc(vol.volume.arc || '');
      setChapters((vol.chapters || []).map((c) => ({ ...c })));
    }
  }, [open, vol]);

  if (!open || !vol) return null;

  const updateChapter = (i, patch) =>
    setChapters((cs) => cs.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const removeChapter = (i) => setChapters((cs) => cs.filter((_, idx) => idx !== i));
  const addChapter = () => {
    const maxNo = chapters.reduce((m, c) => Math.max(m, Number(c.no) || 0), 0);
    setChapters((cs) => [...cs, { index: -1, no: maxNo + 1, title: '', summary: '' }]);
  };

  const handleSave = () => {
    onSave({
      volume: { index: vol.volume.index, name: name.trim(), arc: arc.trim() },
      chapters: chapters.map((c, i) => ({
        ...c,
        no: c.no || i + 1,
        title: (c.title || '').trim() || `第 ${i + 1} 章`,
        summary: (c.summary || '').trim()
      }))
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="sf-panel-hud flex max-h-[88vh] w-full max-w-2xl flex-col p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between border-b border-cyan-400/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="sf-chip">EDIT VOLUME</span>
            <span className="text-sm font-bold text-white">
              {t('outline.volumeEditTitle')}
              {vol.volume.name ? ` · ${vol.volume.name}` : ` · ${t('outline.volumeDefault', { n: vol.volume.index })}`}
            </span>
          </div>
          <button onClick={onClose} className="sf-btn-ghost">
            {t('common.cancel')}
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {/* 卷名 / 卷主线 */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-2xs tracking-widest text-cyan-300/60">
                {t('outline.volumeNameLabel')}
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('outline.volumeNamePlaceholder')}
                className="sf-input w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-2xs tracking-widest text-cyan-300/60">
                {t('outline.volumeArcLabel')}
              </label>
              <input
                value={arc}
                onChange={(e) => setArc(e.target.value)}
                placeholder={t('outline.volumeArcPlaceholder')}
                className="sf-input w-full"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-2xs tracking-widest text-cyan-300/50">
              {chapters.length} {t('outline.chapterUnit')}
            </span>
            <button onClick={addChapter} className="sf-btn-ghost">
              <Plus className="h-3 w-3" /> {t('outline.addChapter')}
            </button>
          </div>

          {/* 章节逐条编辑 */}
          <div className="space-y-3">
            {chapters.map((c, i) => (
              <div key={i} className="rounded border border-cyan-400/15 bg-black/30 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <input
                    type="number"
                    value={c.no}
                    onChange={(e) => updateChapter(i, { no: e.target.value })}
                    className="sf-input w-16"
                    title={t('outline.chapterNo')}
                  />
                  <input
                    value={c.title}
                    onChange={(e) => updateChapter(i, { title: e.target.value })}
                    placeholder={t('outline.chapterTitleLabel')}
                    className="sf-input flex-1"
                  />
                  <button
                    onClick={() => removeChapter(i)}
                    className="sf-btn-ghost shrink-0"
                    title={t('outline.removeChapter')}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <textarea
                  value={c.summary}
                  onChange={(e) => updateChapter(i, { summary: e.target.value })}
                  rows={3}
                  placeholder={t('outline.chapterSummaryLabel')}
                  className="sf-input w-full resize-y text-xs leading-relaxed"
                />
              </div>
            ))}
            {chapters.length === 0 && (
              <div className="py-6 text-center text-2xs tracking-wide text-white/30">
                {t('outline.volumeEmpty')}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2 border-t border-cyan-400/10 pt-3">
          <button onClick={onClose} className="sf-btn-ghost">
            {t('common.cancel')}
          </button>
          <button onClick={handleSave} className="sf-btn">
            <Check className="h-4 w-4" /> {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Outline() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const novelId = useNovelId();
  const STORAGE_KEY = draftKey(STORAGE_KEYS.DRAFT_OUTLINE, novelId);
  const persisted = useMemo(() => loadDraft(STORAGE_KEY), [STORAGE_KEY]);
  const [theme, setTheme] = useState(persisted?.theme || '');
  const [setting, setSetting] = useState(persisted?.setting || '');
  const [rawResult, setRawResult] = useState(persisted?.rawResult || '');
  const [activeNode, setActiveNode] = useState(null);

  // 卷规划:可编辑的卷计划文本(空 = 尚未规划)
  const [volumePlan, setVolumePlan] = useState(persisted?.volumePlan || '');
  const [planLoading, setPlanLoading] = useState(false);
  // 阶段1/2 生成态:题材蓝图 / 设定集
  const [conceptLoading, setConceptLoading] = useState(false);
  const [settingGenLoading, setSettingGenLoading] = useState(false);
  // 从设定集库载入约束
  const [libLoading, setLibLoading] = useState(false);

  // 逐卷展开加载态:expandingIdx 为当前正在展开的卷号;expandingAll 为"展开全部"
  const [expandingIdx, setExpandingIdx] = useState(null);
  const [expandingAll, setExpandingAll] = useState(false);

  // 历史
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);

  const scrollRef = useRef(null);

  // 解析为"卷 → 章"两级结构;逐卷折叠预览
  const volumes = useMemo(() => parseOutlineVolumes(rawResult), [rawResult]);
  const totalChapters = useMemo(
    () => volumes.reduce((s, v) => s + v.chapters.length, 0),
    [volumes]
  );
  // 逐卷折叠状态:true = 收起(仅多卷时生效)
  const [collapsed, setCollapsed] = useState({});
  // 仅单卷且无卷名(纯平铺大纲)时退化为原横向流程图
  const isSingleFlat = volumes.length === 1 && !volumes[0].volume.name;
  // 是否全部卷已收起(用于"展开/收起全部"按钮文案)
  const allCollapsed = volumes.length > 0 && volumes.every((v) => collapsed[v.volume.index]);
  // 任意生成进行中(规划 / 展开 / 概念 / 设定)
  const loading = planLoading || expandingAll || expandingIdx !== null || conceptLoading || settingGenLoading || libLoading;

  // UX-05:大纲草稿对象(供 useAutoSave 使用)
  const draftState = useMemo(
    () => ({
      theme,
      setting,
      rawResult,
      volumePlan,
      loading,
      savedAt: Date.now()
    }),
    [theme, setting, rawResult, volumePlan, loading]
  );

  const autoSave = useAutoSave(draftState, STORAGE_KEY, { interval: 5000, enabled: !loading });

  // 草稿恢复:挂载时若 persisted 非空且非 loading 飞行态,弹恢复提示
  const [showRestoreBanner, setShowRestoreBanner] = useState(false);
  const [pendingDraft, setPendingDraft] = useState(null);

  useEffect(() => {
    if (!persisted) return;
    if (persisted.loading) return;
    if (persisted.rawResult || persisted.theme) {
      setPendingDraft(persisted);
      setShowRestoreBanner(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRestoreDraft = (draft) => {
    if (!draft) return;
    if (typeof draft.theme === 'string') setTheme(draft.theme);
    if (typeof draft.setting === 'string') setSetting(draft.setting);
    if (typeof draft.rawResult === 'string') setRawResult(draft.rawResult);
    if (typeof draft.volumePlan === 'string') setVolumePlan(draft.volumePlan);
    setShowRestoreBanner(false);
    setPendingDraft(null);
    toast.success(t('draft.restore'));
  };

  const handleDiscardDraft = () => {
    clearDraft(STORAGE_KEY);
    setTheme('');
    setSetting('');
    setRawResult('');
    setVolumePlan('');
    setShowRestoreBanner(false);
    setPendingDraft(null);
    toast.success(t('draft.discard'));
  };

  const draftHint = useMemo(() => {
    if (!pendingDraft?.savedAt) return '';
    const mins = Math.max(0, Math.round((Date.now() - pendingDraft.savedAt) / 60000));
    return t('draft.hintMinutes').replace('{n}', String(mins));
  }, [pendingDraft, t]);

  /** 卷规划:调用 /api/outline/plan 生成可编辑的卷结构,并作为骨架写入正文 */
  const handlePlan = async () => {
    if (!theme.trim()) {
      toast.error(t('outline.themeRequired'));
      return;
    }
    setPlanLoading(true);
    try {
      const data = await planOutlineApi(theme.trim(), setting.trim() || undefined);
      if (data.error) {
        toast.error(data.error);
        return;
      }
      const plan = data.volumePlan || data.outline || '';
      setVolumePlan(plan);
      setRawResult(plan);
      toast.success(t('outline.planReady'));
    } catch (err) {
      notifyError(t('outline.planFailed') + ':' + (err.response?.data?.message || err.message), err);
    } finally {
      setPlanLoading(false);
    }
  };

  /** 采用当前(可能已编辑的)卷规划,重建大纲骨架 */
  const applyPlan = () => {
    if (!volumePlan.trim()) {
      toast.error(t('outline.planRequired'));
      return;
    }
    setRawResult(volumePlan.trim());
    toast.success(t('outline.planApplied'));
  };

  /** 阶段1 构思:把当前主题(一句话灵感)扩展为题材蓝图,回填到主题框 */
  const handleGenConcept = async () => {
    if (!theme.trim()) {
      toast.error(t('outline.conceptRequired'));
      return;
    }
    setConceptLoading(true);
    try {
      const blueprint = await generateConcept(theme.trim());
      if (blueprint) {
        setTheme(blueprint);
        toast.success(t('outline.planReady'));
      }
    } catch (err) {
      notifyError(t('outline.conceptFailed') + ':' + (err.response?.data?.message || err.message), err);
    } finally {
      setConceptLoading(false);
    }
  };

  /** 阶段2 设定:基于主题(题材蓝图)生成设定集,回填到设定集框 */
  const handleGenSetting = async () => {
    if (!theme.trim()) {
      toast.error(t('outline.settingGenRequired'));
      return;
    }
    setSettingGenLoading(true);
    try {
      const settingText = await generateSetting(theme.trim());
      if (settingText) {
        setSetting(settingText);
        toast.success(t('outline.planReady'));
      }
    } catch (err) {
      notifyError(t('outline.settingGenFailed') + ':' + (err.response?.data?.message || err.message), err);
    } finally {
      setSettingGenLoading(false);
    }
  };

  /** 从设定集库载入约束:聚合已建设定,填充到设定框(覆盖前确认) */
  const handleLoadFromLib = async () => {
    if (setting.trim() && !window.confirm(t('outline.loadFromLibConfirm'))) return;
    setLibLoading(true);
    try {
      const list = await listSettings();
      const arr = Array.isArray(list) ? list : [];
      if (arr.length === 0) {
        toast.info(t('outline.loadFromLibEmpty'));
        return;
      }
      setSetting(buildSettingConstraint(arr));
      toast.success(t('outline.loadFromLibDone').replace('{n}', String(arr.length)));
    } catch (err) {
      notifyError(t('outline.loadFromLibFailed') + ':' + (err.response?.data?.message || err.message), err);
    } finally {
      setLibLoading(false);
    }
  };

  /** 清除卷规划,回到未规划状态 */
  const clearVolumePlan = () => {
    setVolumePlan('');
    setRawResult('');
    toast.success(t('outline.planCleared'));
  };

  /** 展开单卷细纲:基于卷规划调用 /api/outline/volume,回写该卷章节 */
  const expandVolume = async (volIndex) => {
    if (!volumePlan.trim()) {
      toast.error(t('outline.planRequired'));
      return;
    }
    setExpandingIdx(volIndex);
    try {
      const data = await expandOutlineVolumeApi(
        theme.trim() || volumePlan,
        { volumePlan: volumePlan.trim(), volumeIndex: volIndex, setting: setting.trim() || undefined }
      );
      if (data.error) {
        toast.error(data.error);
        return;
      }
      setRawResult((prev) => insertVolumeChapters(prev, volIndex, data.outline));
      toast.success(t('outline.volumeExpanded').replace('{n}', String(volIndex)));
    } catch (err) {
      notifyError(t('outline.expandFailed') + ':' + (err.response?.data?.message || err.message), err);
    } finally {
      setExpandingIdx(null);
    }
  };

  /** 展开全部卷细纲:逐卷顺序展开尚未展开的卷 */
  const expandAll = async () => {
    if (!volumePlan.trim()) {
      toast.error(t('outline.planRequired'));
      return;
    }
    const targets = volumes.filter((v) => v.chapters.length === 0).map((v) => v.volume.index);
    if (targets.length === 0) {
      toast.info(t('outline.allExpanded'));
      return;
    }
    setExpandingAll(true);
    try {
      for (const idx of targets) {
        const data = await expandOutlineVolumeApi(
          theme.trim() || volumePlan,
          { volumePlan: volumePlan.trim(), volumeIndex: idx, setting: setting.trim() || undefined }
        );
        if (data.error) {
          toast.error(data.error);
          continue;
        }
        setRawResult((prev) => insertVolumeChapters(prev, idx, data.outline));
      }
      toast.success(t('outline.allExpanded'));
    } catch (err) {
      notifyError(t('outline.expandFailed') + ':' + (err.response?.data?.message || err.message), err);
    } finally {
      setExpandingAll(false);
    }
  };

  /** 展开/收起全部卷 */
  const toggleAllVolumes = () => {
    setCollapsed((prev) => {
      const allC = volumes.every((v) => prev[v.volume.index]);
      const next = volumes.reduce((acc, v) => {
        acc[v.volume.index] = !allC;
        return acc;
      }, {});
      return next;
    });
  };

  const reset = () => {
    setTheme('');
    setSetting('');
    setRawResult('');
    setActiveNode(null);
    setVolumePlan('');
    clearDraft(STORAGE_KEY);
    autoSave.clear();
    toast.success(t('outline.resetDone'));
  };

  const copy = async () => {
    await navigator.clipboard.writeText(rawResult);
    toast.success(t('common.copied'));
  };

  /** 跳转到章节页,并把当前节点的大纲作为预填数据透传 */
  const handleJumpToChapter = (node) => {
    setActiveNode(node);
    navigate(`/novels/${novelId}/chapter`, {
      state: {
        outlineText: node.summary || '',
        chapterNo: node.no,
        chapterTitle: node.title || '',
        from: 'outline'
      }
    });
  };

  /** 保存到数据库(新建版本) */
  const handleSave = async () => {
    if (!rawResult.trim()) throw new Error('内容为空');
    const payload = {
      title: theme ? theme.slice(0, 50) : `v-${new Date().toISOString().slice(0, 10)}`,
      theme,
      chapters: totalChapters,
      content: rawResult
    };
    const data = await saveOutlineApi(payload);
    autoSave.clear();
    if (data && data.id) {
      if (historyOpen) openHistory();
    }
    return data;
  };

  /** 拉取历史列表 */
  const openHistory = async () => {
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const list = await listOutlines();
      setHistoryItems(
        (list || []).map((o) => ({
          id: o.id,
          title: o.title || `v${o.version}`,
          desc: o.contentPreview,
          meta: `v${o.version} · ${o.chapters || 0}章 · ${o.contentLength || 0}字`,
          active: !!o.isActive,
          version: o.version,
          chapters: o.chapters,
          contentLength: o.contentLength,
          createdAt: o.createdAt
        }))
      );
    } catch (err) {
      notifyError(t('outline.loadHistoryFailed') + ':' + (err.response?.data?.message || err.message), err);
    } finally {
      setHistoryLoading(false);
    }
  };

  /** 选中历史版本 → 加载到编辑区 */
  const handleSelectHistory = async (item) => {
    try {
      const detail = await getOutline(item.id);
      setRawResult(detail.content || '');
      if (detail.theme) setTheme(detail.theme);
      setHistoryOpen(false);
      toast.success(t('outline.loadedVersion').replace('{n}', detail.version));
    } catch (err) {
      notifyError(t('outline.loadFailed') + ':' + (err.response?.data?.message || err.message), err);
    }
  };

  /** 激活历史版本 */
  const handleActivateHistory = async (item) => {
    try {
      await activateOutline(item.id);
      setHistoryItems((prev) =>
        prev.map((x) => ({ ...x, active: x.id === item.id }))
      );
      toast.success(t('outline.activated').replace('{n}', item.version));
    } catch (err) {
      notifyError(t('outline.activateFailed') + ':' + (err.response?.data?.message || err.message), err);
    }
  };

  /** 删除历史版本 */
  const handleDeleteHistory = async (item) => {
    try {
      await deleteOutline(item.id);
      setHistoryItems((prev) => prev.filter((x) => x.id !== item.id));
      toast.success(t('common.delete') + ' ✓');
    } catch (err) {
      notifyError(t('outline.deleteFailed') + ':' + (err.response?.data?.message || err.message), err);
    }
  };

  // 逐卷内联编辑弹窗:当前正在编辑的卷(为 null 时关闭)
  const [editVol, setEditVol] = useState(null);

  /** 逐卷内联编辑保存:将单卷改动合回大纲全文 */
  const handleVolumeSave = (edited) => {
    const newVolumes = volumes.map((v) =>
      v.volume.index === edited.volume.index ? edited : v
    );
    setRawResult(serializeVolumes(newVolumes));
    setActiveNode(null);
    setEditVol(null);
    toast.success(t('outline.volumeSaved'));
  };

  const hasContent = !!rawResult && !loading;

  return (
    <div className="flex min-h-full flex-col">
      {/* 顶部标题区 */}
      <header className="border-b border-cyan-400/10 px-4 py-6 sm:px-8 sm:py-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="sf-heading">{t('nav.outline')}</div>
          <p className="mt-2 pl-4 text-xs tracking-wide text-cyan-300/50">
            {t('outline.subheading')}
          </p>
        </div>
        {totalChapters > 0 && (
          <div className="flex items-center gap-2 text-2xs tracking-wider text-cyan-300/60 sm:gap-3 sm:text-xs">
            <span className="sf-dot" />
            <span>{t('outline.chapterCount').replace('{n}', String(totalChapters).padStart(2, '0'))}</span>
          </div>
        )}
      </header>

      <div className="flex-1 px-4 py-6 sm:px-8 sm:py-8">
        {/* UX-05 草稿恢复提示 */}
        {showRestoreBanner && (
          <DraftRestoreBanner
            draft={pendingDraft}
            hint={draftHint}
            onRestore={handleRestoreDraft}
            onDiscard={handleDiscardDraft}
          />
        )}
        {/* 输入区 */}
        <div className="sf-panel-hud mb-6 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
            <div>
              <label className="mb-1 block text-2xs tracking-widest text-cyan-300/60">{t('outline.theme')}</label>
              <input
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder={t('outline.themePlaceholder')}
                className="sf-input w-full"
              />
            </div>
            <div className="flex items-end gap-2">
              <button onClick={handleGenConcept} disabled={conceptLoading || planLoading} className="sf-btn-ghost h-[42px] w-full sm:w-auto">
                {conceptLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Compass className="h-4 w-4" />}
                {conceptLoading ? t('outline.genConceptRunning') : t('outline.genConcept')}
              </button>
              <button onClick={handlePlan} disabled={planLoading} className="sf-btn h-[42px] w-full sm:w-auto">
                {planLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                {planLoading ? t('outline.generating') : t('outline.planGenerate')}
              </button>
            </div>
          </div>

          {/* 设定集:可选,作为约束随大纲请求带入,保证世界观/人物自洽 */}
          <div className="mt-3">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <label className="block text-2xs tracking-widest text-cyan-300/60">{t('outline.setting')}</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLoadFromLib}
                  disabled={libLoading}
                  className="sf-btn-ghost shrink-0"
                  title={t('outline.loadFromLib')}
                >
                  {libLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <BookMarked className="h-3 w-3" />}
                  {t('outline.loadFromLib')}
                </button>
                <button
                  onClick={handleGenSetting}
                  disabled={settingGenLoading || !theme.trim()}
                  className="sf-btn-ghost shrink-0"
                  title={t('outline.genSetting')}
                >
                  {settingGenLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Compass className="h-3 w-3" />}
                  {t('outline.genSetting')}
                </button>
              </div>
            </div>
            <textarea
              value={setting}
              onChange={(e) => setSetting(e.target.value)}
              rows={3}
              spellCheck={false}
              placeholder={t('outline.settingPlaceholder')}
              className="sf-input w-full resize-y text-xs leading-relaxed"
            />
            <p className="mt-1 text-2xs tracking-wider text-cyan-300/40">
              {t('outline.settingHint')}
            </p>
          </div>

          {/* 二级操作行:历史 / 保存 / 清空 */}
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-cyan-400/10 pt-3">
            <button onClick={openHistory} className="sf-btn-ghost">
              <History className="h-3 w-3" /> {t('outline.history')}
            </button>
            {hasContent && (
              <SaveButton onClick={handleSave} label={t('outline.saveAsNew')} />
            )}
            {(theme || rawResult) && !loading && (
              <button onClick={reset} className="sf-btn-ghost">
                <Trash2 className="h-3 w-3" /> {t('common.reset')}
              </button>
            )}
            {/* 自动保存状态指示 */}
            <span className="ml-auto inline-flex items-center gap-1 text-2xs tracking-widest text-cyan-300/40">
              {autoSave.status === 'pending' && (
                <>
                  <span className="sf-dot" />
                  {t('draft.autoSaving')}
                </>
              )}
              {autoSave.status === 'saving' && (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t('draft.autoSaving')}
                </>
              )}
              {autoSave.status === 'saved' && (
                <>
                  <Check className="h-3 w-3 text-emerald-300/70" />
                  <span className="text-emerald-300/70">{t('draft.autoSaved')}</span>
                </>
              )}
            </span>
          </div>

          {planLoading && <div className="sf-loader-bar mt-3" />}
        </div>

        {/* 卷结构规划 + 大纲流程图(融合为单一工作区) */}
        {volumes.length > 0 || volumePlan.trim() ? (
          <div className="sf-panel-hud p-4">
            {/* 头部:标题 + 全局操作(重新规划 / 清除 / 展开全部 / 全部展开收起 / 复制) */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="sf-chip">OUTLINE</span>
                <span className="text-sm text-white/70">{t('outline.flowTitle')}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={handlePlan} disabled={planLoading} className="sf-btn-ghost">
                  {planLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <PenLine className="h-3 w-3" />}
                  {planLoading ? t('outline.generating') : t('outline.planRegenerate')}
                </button>
                {volumePlan.trim() && (
                  <button onClick={clearVolumePlan} className="sf-btn-ghost">
                    <Trash2 className="h-3 w-3" /> {t('outline.planClear')}
                  </button>
                )}
                {volumes.length > 1 && (
                  <>
                    <button onClick={expandAll} disabled={expandingAll} className="sf-btn-ghost">
                      {expandingAll ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                      {t('outline.expandAllVolumes')}
                    </button>
                    <button
                      onClick={toggleAllVolumes}
                      className="sf-btn-ghost"
                      title={t('outline.toggleAll')}
                    >
                      {allCollapsed ? t('outline.expandAll') : t('outline.collapseAll')}
                    </button>
                  </>
                )}
                <button onClick={copy} className="sf-btn-ghost">
                  <Copy className="h-3 w-3" /> {t('common.copy').toUpperCase()}
                </button>
              </div>
            </div>

            {/* 卷规划编辑(可修改卷名/章数后应用为骨架);与流程图同处一面板 */}
            {volumePlan.trim() && (
              <div className="mb-4 rounded border border-cyan-400/15 bg-black/30 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-2xs tracking-widest text-cyan-300/60">
                    <span className="sf-chip">VOLUME PLAN</span>
                    {t('outline.planTitle')}
                  </span>
                  <button onClick={applyPlan} className="sf-btn-ghost">
                    <Check className="h-3 w-3" /> {t('outline.applyPlan')}
                  </button>
                </div>
                <p className="mb-2 text-2xs leading-relaxed tracking-wide text-cyan-300/50">
                  {t('outline.planDesc')}
                </p>
                <textarea
                  value={volumePlan}
                  onChange={(e) => setVolumePlan(e.target.value)}
                  rows={6}
                  spellCheck={false}
                  className="sf-input w-full resize-y font-mono text-xs leading-relaxed"
                  placeholder={t('outline.planPlaceholder')}
                />
              </div>
            )}

            {/* 单卷(无卷标记)退化为原横向流程图;多卷按卷分组 */}
            {isSingleFlat ? (
              <div>
                <div className="mb-3 flex items-center justify-end">
                  <button onClick={() => setEditVol(volumes[0])} className="sf-btn-ghost">
                    <PenLine className="h-3 w-3" /> {t('outline.editVolume')}
                  </button>
                </div>
                <VolumeChapterFlow
                  chapters={volumes[0].chapters}
                  activeNode={activeNode}
                  onSelectNode={setActiveNode}
                  onJump={handleJumpToChapter}
                  scrollRef={scrollRef}
                />
              </div>
            ) : (
              volumes.map((vol) => {
                const vIdx = vol.volume.index;
                const isCollapsed = !!collapsed[vIdx];
                const expanded = vol.chapters.length > 0;
                const isExpanding = expandingIdx === vIdx || expandingAll;
                return (
                  <div
                    key={vIdx}
                    className="mb-3 overflow-hidden rounded border border-cyan-400/15 bg-black/30"
                  >
                    <div className="flex w-full items-center gap-3 px-3 py-2.5 transition hover:bg-cyan-400/[0.04]">
                      <button
                        onClick={() => setCollapsed((c) => ({ ...c, [vIdx]: !c[vIdx] }))}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <ChevronRight
                          className={`h-4 w-4 shrink-0 text-cyan-300/60 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                        />
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-cyan-300/40 bg-cyan-300/10 font-mono text-xs text-cyan-300">
                          {String(vIdx).padStart(2, '0')}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-bold text-white">
                            {vol.volume.name || `第 ${vIdx} 卷`}
                          </div>
                          {vol.volume.arc && (
                            <div className="truncate text-2xs text-cyan-300/50">
                              {vol.volume.arc}
                            </div>
                          )}
                        </div>
                        <span className="shrink-0 font-mono text-2xs tracking-widest text-cyan-300/40">
                          {vol.chapters.length} {t('outline.chapterUnit')}
                        </span>
                      </button>
                      {/* 逐卷操作:修改本卷 / 应用本卷(展开) / 重新规划本卷(重新展开) */}
                      <button
                        onClick={() => setEditVol(vol)}
                        className="sf-btn-ghost shrink-0"
                        title={t('outline.editVolume')}
                      >
                        <PenLine className="h-3 w-3" /> {t('outline.editVolume')}
                      </button>
                      {!expanded ? (
                        <button
                          onClick={() => expandVolume(vIdx)}
                          disabled={isExpanding}
                          className="sf-btn-ghost shrink-0"
                          title={t('outline.applyVolume')}
                        >
                          {isExpanding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                          {t('outline.applyVolume')}
                        </button>
                      ) : (
                        <button
                          onClick={() => expandVolume(vIdx)}
                          disabled={isExpanding}
                          className="sf-btn-ghost shrink-0"
                          title={t('outline.replanVolume')}
                        >
                          {isExpanding ? <Loader2 className="h-3 w-3 animate-spin" /> : <PenLine className="h-3 w-3" />}
                          {t('outline.replanVolume')}
                        </button>
                      )}
                    </div>
                    {!isCollapsed && (
                      <div className="px-3 pb-3">
                        {expanded ? (
                          <VolumeChapterFlow
                            chapters={vol.chapters}
                            activeNode={activeNode}
                            onSelectNode={setActiveNode}
                            onJump={handleJumpToChapter}
                          />
                        ) : (
                          <div className="py-4 text-center text-2xs tracking-wide text-cyan-300/40">
                            {t('outline.volumeNotExpanded')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {activeNode && (
              <div className="mt-4 rounded border border-cyan-400/20 bg-black/40 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="sf-chip">{t('outline.detail').toUpperCase()}</span>
                    <span className="text-sm font-bold text-white">
                      [{String(activeNode.no).padStart(2, '0')}] {activeNode.title}
                    </span>
                  </div>
                  <button
                    onClick={() => handleJumpToChapter(activeNode)}
                    className="flex items-center gap-1.5 rounded border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-xs tracking-widest text-cyan-300 transition hover:bg-cyan-400/20"
                    title={t('outline.jumpToChapter')}
                  >
                    <PenLine className="h-3 w-3" />
                    {t('outline.jumpToChapter')}
                  </button>
                </div>
                <pre className="max-h-[40vh] overflow-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-white/80">
                  {activeNode.summary}
                </pre>
              </div>
            )}
          </div>
        ) : (
          !loading && (
            <div className="sf-panel rounded border border-dashed border-cyan-400/10 py-20 text-center text-white/30">
              <FileText className="mx-auto mb-3 h-10 w-10 opacity-40" />
              <div className="text-xs tracking-wide">{t('outline.planFirstHint')}</div>
            </div>
          )
        )}

      </div>

      {/* 逐卷内联编辑弹窗 */}
      <VolumeEditModal
        open={!!editVol}
        vol={editVol}
        onClose={() => setEditVol(null)}
        onSave={handleVolumeSave}
      />

      {/* 历史抽屉 */}
      <HistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title={t('outline.history')}
        items={historyItems}
        loading={historyLoading}
        onSelect={handleSelectHistory}
        onDelete={handleDeleteHistory}
        renderMeta={(it) => (
          <div className="mt-1 flex items-center justify-between gap-2">
            <div className="font-mono text-2xs tracking-widest text-cyan-300/40">{it.meta}</div>
            {!it.active && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleActivateHistory(it);
                }}
                className="font-mono text-2xs tracking-widest text-amber-300/60 hover:text-amber-300"
              >
                {t('outline.activate').toUpperCase()}
              </button>
            )}
          </div>
        )}
      />
    </div>
  );
}

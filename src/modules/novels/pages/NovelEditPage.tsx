import { useCallback, useEffect, useRef, useState } from 'react';
import { useBlocker, useNavigate, useParams } from 'react-router';
import { t } from '@/shared/i18n';
import { useLangSync } from '@/shared/i18n/LangContext';
import { notifyError } from '@/shared/api/errorToast';
import { track } from '@/shared/track';
import { createNovel, getNovel, updateNovel, type NovelSaveReq } from '../api';
import NovelForm from '../components/NovelForm';

/**
 * /novels/new 与 /novels/:novelId/edit 共用页(功能文档 §5.4)。
 *
 * <p>创建:选模板填充 → 保存 → 总览;编辑:加载回填 → 保存 → 总览。
 * 未保存离开提示:dirty 时 useBlocker 拦截路由跳转(window.confirm 承载,
 * 后续可升级自定义弹窗);刷新/关页由 beforeunload 兜底。</p>
 *
 * @author Moma
 */
export default function NovelEditPage() {
  useLangSync();
  const navigate = useNavigate();
  const { novelId } = useParams();
  const isEdit = novelId !== undefined;
  const id = Number(novelId);

  const [initial, setInitial] = useState<NovelSaveReq | null>(isEdit ? null : { title: '', genre: null, description: null });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  // 坑:blocker 的判断在 navigate 时同步执行,读 state 拿到的是旧渲染闭包值——
  // 保存成功后 setDirty(false)+navigate 同一微任务,blocker 仍视为 dirty 而误弹确认框。
  // dirty 必须由 ref 承载即时值,blocker 读 ref;state 仅驱动 beforeunload 挂载/卸载。
  const dirtyRef = useRef(false);
  // useCallback 稳定引用:作为 NovelForm effect 依赖,避免每渲染重跑(验收问题 9)
  const applyDirty = useCallback((v: boolean): void => {
    dirtyRef.current = v;
    setDirty(v);
  }, []);

  // 编辑模式:加载详情回填(404/越权 → 回列表)
  useEffect(() => {
    if (!isEdit) return;
    if (!Number.isInteger(id) || id <= 0) {
      navigate('/novels', { replace: true });
      return;
    }
    getNovel(id)
      .then((d) =>
        setInitial({
          title: d.novel.title,
          genre: d.novel.genre,
          description: d.novel.description,
        }),
      )
      .catch((err) => {
        notifyError(t('novels.overview.notFound'), err);
        navigate('/novels', { replace: true });
      })
      .finally(() => setLoading(false));
  }, [isEdit, id, navigate]);

  // 路由离开守卫:dirty 时拦截确认(读 ref 即时值,勿读 state 旧闭包)
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => dirtyRef.current && currentLocation.pathname !== nextLocation.pathname,
  );
  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    if (window.confirm(`${t('novels.form.unsavedTitle')}\n${t('novels.form.unsavedText')}`)) {
      blocker.proceed();
    } else {
      blocker.reset();
    }
  }, [blocker]);

  // 刷新/关闭页签兜底
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent): void => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const submit = (req: NovelSaveReq): void => {
    setSaving(true);
    const call = isEdit ? updateNovel(id, req) : createNovel(req);
    track(isEdit ? 'novel.update' : 'novel.create', isEdit ? { novelId: id } : { title: req.title });
    call
      .then((novel) => {
        applyDirty(false);
        navigate(`/novels/${novel.id}/overview`);
      })
      .catch((err) => notifyError(t('novels.form.saveFailed'), err))
      .finally(() => setSaving(false));
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="sf-heading mb-5 text-xl font-semibold">
        {isEdit ? t('novels.form.editTitle') : t('novels.form.createTitle')}
      </h1>
      {loading || initial === null ? (
        <div className="sf-panel p-6">
          <div className="h-4 w-1/3 animate-pulse rounded bg-[var(--sf-border)]" aria-hidden />
        </div>
      ) : (
        <div className="sf-panel p-5 sm:p-6">
          <NovelForm
            initial={initial}
            saving={saving}
            onSubmit={submit}
            onCancel={() => navigate('/novels')}
            onDirtyChange={applyDirty}
          />
        </div>
      )}
    </div>
  );
}

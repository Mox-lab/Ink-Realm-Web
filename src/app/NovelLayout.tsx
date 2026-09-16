import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router';
import { t } from '@/shared/i18n';
import { notifyError } from '@/shared/api/errorToast';
import { useNovelStore } from '@/shared/stores/novelStore';
import { getNovel, type NovelDetail } from '@/modules/novels/api';

/**
 * 工作台壳(/novels/:novelId/**,功能文档 §4 路由树)。
 *
 * <p>职责:①校验路径作品 ID;②注册 X-Novel-Id 隔离键(novelStore → client 拦截器
 * 统一注入,规范前端 §9);③加载作品详情经 Outlet context 下发子页(避免重复请求);
 * ④归属校验失败(404/越权同文案)回列表;⑤卸载清理隔离键,防列表页请求误带。</p>
 *
 * @author Moma
 */
export default function NovelLayout() {
  const navigate = useNavigate();
  const { novelId } = useParams();
  const setCurrentNovel = useNovelStore((s) => s.setCurrentNovel);
  const clearNovel = useNovelStore((s) => s.clearNovel);
  const [detail, setDetail] = useState<NovelDetail | null>(null);

  const id = Number(novelId);

  useEffect(() => {
    // 非法路径 ID:直接回列表
    if (!Number.isInteger(id) || id <= 0) {
      navigate('/novels', { replace: true });
      return;
    }
    setCurrentNovel(id);
    setDetail(null);
    getNovel(id)
      .then(setDetail)
      .catch((err) => {
        // 不存在/越权同文案(后端 404),不暴露资源存在性
        notifyError(t('novels.overview.notFound'), err);
        navigate('/novels', { replace: true });
      });
    return () => {
      // 离开工作台:清隔离键,列表页请求不再携带 X-Novel-Id
      clearNovel();
    };
  }, [id, navigate, setCurrentNovel, clearNovel]);

  if (!detail) {
    return <div className="p-8 text-center text-[var(--sf-text-dim)]">{t('common.loading')}</div>;
  }
  return <Outlet context={detail} />;
}

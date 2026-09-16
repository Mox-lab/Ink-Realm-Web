import { ArrowLeft, BookOpen, GitBranch, Inbox, ScrollText } from 'lucide-react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router';
import { t } from '@/shared/i18n';
import { useLangSync } from '@/shared/i18n/LangContext';
import type { NovelDetail } from '@/modules/novels/api';
import SettingTab from '../components/SettingTab';
import DictTab from '../components/DictTab';
import RelationTab from '../components/RelationTab';
import CandidateTab from '../components/CandidateTab';

/**
 * /novels/:novelId/lore 设定集(功能文档 §5.9/§6.5,G3)。
 *
 * <p>四 tab 结构:设定(10 分类词条)/字典(7 段人工维护)/关系(ID 引用+快照)/
 * 候选(AI 提取审核区,G3 无数据源空态诚实)。tab 状态经 searchParams 持久,
 * 刷新/回跳保持所在页签。</p>
 *
 * @author Moba
 */

/** tab 键与图标/标题映射 */
const TABS = [
  { key: 'settings', icon: BookOpen, labelKey: 'lore.tab.settings' },
  { key: 'dicts', icon: ScrollText, labelKey: 'lore.tab.dicts' },
  { key: 'relations', icon: GitBranch, labelKey: 'lore.tab.relations' },
  { key: 'candidates', icon: Inbox, labelKey: 'lore.tab.candidates' },
] as const;

/** 合法 tab 键(防 URL 篡改) */
type TabKey = (typeof TABS)[number]['key'];

export default function LorePage() {
  useLangSync();
  const navigate = useNavigate();
  const detail = useOutletContext<NovelDetail>();
  const [searchParams, setSearchParams] = useSearchParams();

  // tab 经 URL 持久:非法值回退设定页
  const rawTab = searchParams.get('tab');
  const tab: TabKey = TABS.some((x) => x.key === rawTab) ? (rawTab as TabKey) : 'settings';

  /** 切换 tab(同步 searchParams,刷新保持) */
  const switchTab = (key: TabKey): void => {
    setSearchParams({ tab: key }, { replace: true });
  };

  return (
    <div className="sf-page flex flex-col gap-5">
      {/* 顶行:返回总览 + 标题 */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="sf-icon-btn min-h-10 min-w-10"
          aria-label={t('lore.backToOverview')}
          onClick={() => navigate(`/novels/${detail.novel.id}/overview`)}
        >
          <ArrowLeft size={16} aria-hidden />
        </button>
        <h1 className="sf-heading line-clamp-1 text-xl font-semibold">{t('lore.title')}</h1>
        <span className="sf-chip ml-1 hidden sm:inline">{detail.novel.title}</span>
      </div>

      {/* tab 行:触控目标 ≥40px,横向可滚动(移动端 4 tab 不挤压) */}
      <div role="tablist" aria-label={t('lore.title')} className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map(({ key, icon: Icon, labelKey }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={`sf-btn min-h-10 flex-1 flex-none items-center justify-center gap-1.5 whitespace-nowrap px-3 text-sm sm:flex-none ${
              tab === key ? 'sf-btn-primary' : ''
            }`}
            onClick={() => switchTab(key)}
          >
            <Icon size={15} aria-hidden />
            {t(labelKey)}
          </button>
        ))}
      </div>

      {/* tab 内容 */}
      {tab === 'settings' && <SettingTab />}
      {tab === 'dicts' && <DictTab />}
      {tab === 'relations' && <RelationTab />}
      {tab === 'candidates' && <CandidateTab />}
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, Loader2, Users, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import {
  listCollaborators,
  inviteCollaborator,
  updateCollaboratorRole,
  removeCollaborator
} from '../api/index.js';
import { useI18n } from '../context/I18nContext.jsx';

/**
 * 协作者管理面板(BASE-11 多用户协作)。
 * <p>仅由小说 owner 在总览页渲染(NovelOverview 已按 {@code overview.role === 'owner'} 控制)。</p>
 * <ul>
 *   <li>输入被邀请用户名 + 选择角色(editor / viewer)→ 邀请</li>
 *   <li>列表展示现有协作者:用户名 / 角色 / 改角色下拉 / 移除按钮</li>
 * </ul>
 *
 * @param {number|string} novelId 小说 ID
 * @author songshan.li (ID: 17099618)
 */
export default function CollaboratorPanel({ novelId }) {
  const { t } = useI18n();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('editor');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listCollaborators(novelId);
      setList(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(err.message || t('novel.collaborator.load.failed'));
    } finally {
      setLoading(false);
    }
  }, [novelId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleInvite = async (e) => {
    e.preventDefault();
    const name = username.trim();
    if (!name) return;
    setInviting(true);
    setError('');
    try {
      await inviteCollaborator(novelId, { username: name, role });
      toast.success(t('novel.collaborator.invite.success'));
      setUsername('');
      await load();
    } catch (err) {
      // 拦截器已弹全局 toast,这里内联展示便于对照表单
      setError(err.message || t('novel.collaborator.invite.failed'));
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm(t('novel.collaborator.remove.confirm'))) return;
    setBusyId(id);
    try {
      await removeCollaborator(novelId, id);
      toast.success(t('novel.collaborator.remove.success'));
      await load();
    } catch (err) {
      setError(err.message || t('novel.collaborator.remove.failed'));
    } finally {
      setBusyId(null);
    }
  };

  const handleRoleChange = async (id, newRole) => {
    setBusyId(id);
    try {
      await updateCollaboratorRole(novelId, id, newRole);
      toast.success(t('novel.collaborator.role.updated'));
      await load();
    } catch (err) {
      setError(err.message || t('novel.collaborator.role.failed'));
    } finally {
      setBusyId(null);
    }
  };

  const roleLabel = (r) =>
    t(r === 'editor' ? 'novel.collaborator.role.editor' : 'novel.collaborator.role.viewer');

  return (
    <section className="mt-6 rounded border border-cyan-400/15 bg-black/30 p-5">
      <div className="mb-4 flex items-center gap-2 text-sm tracking-wide text-cyan-300/80">
        <Users className="h-4 w-4" />
        {t('novel.collaborator.title')}
      </div>

      {/* 邀请表单 */}
      <form onSubmit={handleInvite} className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={t('novel.collaborator.invite.username')}
          className="sf-input min-w-[140px] flex-1 !px-3 !py-2 text-sm"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="sf-input !px-3 !py-2 text-sm"
        >
          <option value="editor">{t('novel.collaborator.role.editor')}</option>
          <option value="viewer">{t('novel.collaborator.role.viewer')}</option>
        </select>
        <button
          type="submit"
          disabled={inviting}
          className="flex items-center gap-1 rounded border border-cyan-400/40 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-300 transition hover:bg-cyan-400/20 disabled:opacity-50"
        >
          {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {t('novel.collaborator.action.invite')}
        </button>
      </form>

      {error && (
        <div className="mb-3 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* 列表 */}
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-cyan-300/50">
          <Loader2 className="h-4 w-4 animate-spin" /> {t('common.loading')}
        </div>
      ) : list.length === 0 ? (
        <div className="text-xs text-white/40">{t('novel.collaborator.empty')}</div>
      ) : (
        <ul className="space-y-2">
          {list.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded border border-white/5 bg-black/20 px-3 py-2"
            >
              <div className="min-w-0">
                <div className="truncate text-sm text-white/90">{c.username}</div>
                <div className="flex items-center gap-1 text-2xs tracking-wider text-cyan-300/40">
                  <ShieldAlert className="h-3 w-3" />
                  {roleLabel(c.role)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={c.role}
                  disabled={busyId === c.id}
                  onChange={(e) => handleRoleChange(c.id, e.target.value)}
                  className="sf-input !px-2 !py-1 text-xs"
                >
                  <option value="editor">{t('novel.collaborator.role.editor')}</option>
                  <option value="viewer">{t('novel.collaborator.role.viewer')}</option>
                </select>
                <button
                  onClick={() => handleRemove(c.id)}
                  disabled={busyId === c.id}
                  title={t('novel.collaborator.action.remove')}
                  className="rounded p-1.5 text-white/40 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
                >
                  {busyId === c.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

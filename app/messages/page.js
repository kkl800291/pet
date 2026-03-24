import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '../../components/app-shell.js';
import { initials } from '../../lib/domain.js';
import { getCurrentOwner } from '../../lib/auth.js';
import { getState } from '../../lib/state.js';

export default async function MessagesPage() {
  const owner = await getCurrentOwner();
  if (!owner) redirect('/login');

  const state = await getState();
  const chats = state.chats
    .filter((chat) => chat.ownerIds.includes(owner.id))
    .sort((a, b) => new Date(b.messages.at(-1)?.createdAt || 0) - new Date(a.messages.at(-1)?.createdAt || 0));

  return (
    <AppShell
      title="消息中心"
      subtitle="查看私聊会话、未读数和最新消息。"
      actions={<Link href="/feed" className="btn btn-secondary">回广场</Link>}
    >
      <div className="grid">
        {chats.map((chat) => (
          <article key={chat.id} className="card">
            <div className="post-topline">
              <div className="avatar">{initials(chat.id)}</div>
              <div className="post-meta">
                <div className="post-title-row">
                  <strong>
                    会话 {chat.ownerIds.filter((id) => id !== owner.id).map((id) => state.owners.find((item) => item.id === id)?.name || id).join('、')}
                  </strong>
                  <span className="status-pill">未读 {chat.unreadByOwnerId?.[owner.id] || 0}</span>
                </div>
                <div className="helper">最后消息：{chat.messages.at(-1)?.content || '暂无'}</div>
              </div>
            </div>
            <div className="inline-actions" style={{ marginTop: 14 }}>
              <Link href={`/chat/${chat.id}`} className="btn btn-primary">
                打开会话
              </Link>
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}

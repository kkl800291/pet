import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '../../../components/app-shell.js';
import { getCurrentAdmin } from '../../../lib/auth.js';
import { buildOwnerLookup, buildPetLookup, getState } from '../../../lib/state.js';

export default async function AdminReviewPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');

  const state = await getState();
  const ownerLookup = buildOwnerLookup(state);
  const petLookup = buildPetLookup(state);
  const pendingPosts = state.posts.filter((post) => post.status === 'pending');

  return (
    <AppShell
      admin
      title="内容审核"
      subtitle="机审前置触发的内容进入人工审核队列。"
      actions={<Link href="/admin" className="btn btn-secondary">返回概览</Link>}
    >
      <div className="grid">
        {pendingPosts.map((post) => (
          <article key={post.id} className="card">
            <div className="post-topline">
              <div className="avatar">PR</div>
              <div className="post-meta">
                <div className="post-title-row">
                  <strong>{post.title}</strong>
                  <span className="status-pill">{post.status}</span>
                </div>
                <div className="helper">
                  {petLookup.get(post.petId)?.name} · {ownerLookup.get(post.ownerId)?.name}
                </div>
              </div>
            </div>
            <p className="post-content" style={{ marginTop: 12 }}>
              {post.content}
            </p>
            <div className="row-actions">
              <form action={`/api/admin/posts/${post.id}/approve`} method="post">
                <button className="btn btn-primary" type="submit">
                  通过
                </button>
              </form>
              <form action={`/api/admin/posts/${post.id}/reject`} method="post">
                <button className="btn btn-danger" type="submit">
                  驳回
                </button>
              </form>
            </div>
          </article>
        ))}
        {pendingPosts.length === 0 ? <div className="card">当前没有待审日志。</div> : null}
      </div>
    </AppShell>
  );
}

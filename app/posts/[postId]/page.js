import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { AppShell } from '../../../components/app-shell.js';
import { initials } from '../../../lib/domain.js';
import { getCurrentOwner } from '../../../lib/auth.js';
import { backendJson } from '../../../lib/backend.js';

export default async function PostDetailPage({ params }) {
  const owner = await getCurrentOwner();
  if (!owner) redirect('/login');

  const { response, payload } = await backendJson(`/api/posts/${params.postId}`, { withCookies: true });
  if (response.status === 404) notFound();
  if (!response.ok) {
    throw new Error('failed_to_load_post');
  }
  const post = payload?.post;
  if (!post) notFound();
  const pet = post.pet;
  const petOwner = post.owner;

  return (
    <AppShell
      title={post.title}
      subtitle="日志详情页，支持点赞、评论和举报。"
      actions={<Link href="/feed" className="btn btn-secondary">返回广场</Link>}
    >
      <div className="split">
        <section className="card">
          <div className="post-topline">
            <div className="avatar">{initials(pet?.name)}</div>
            <div className="post-meta">
              <div className="post-title-row">
                <strong>{pet?.name || '未知宠物'}</strong>
                <span className="post-owner-muted">by {petOwner?.name || '匿名主人'}</span>
              </div>
              <div className="post-time">{new Date(post.createdAt).toLocaleString()}</div>
            </div>
          </div>
          <p className="post-content" style={{ marginTop: 18 }}>
            {post.content}
          </p>
          <div className="inline-actions" style={{ marginTop: 16 }}>
            <form action={`/api/posts/${post.id}/like`} method="post">
              <button className="btn btn-secondary" type="submit">
                点赞 {post.likes.length}
              </button>
            </form>
          </div>
          <div className="panel" style={{ marginTop: 18 }}>
            <h3>举报内容</h3>
            <div className="helper">可补充文字说明和最多 3 条证据链接，后台会直接读取这些字段。</div>
            <form className="form-stack" action={`/api/posts/${post.id}/report`} method="post" encType="multipart/form-data" style={{ marginTop: 16 }}>
              <label>
                <div className="muted-label">举报原因</div>
                <textarea name="reason" rows={3} placeholder="例如：疑似广告引流、内容失实、侵犯隐私" required defaultValue="内容需要人工确认" />
              </label>
              <label>
                <div className="muted-label">证据链接 1</div>
                <input name="evidence" placeholder="https://example.com/evidence-1.png" />
              </label>
              <label>
                <div className="muted-label">证据链接 2</div>
                <input name="evidence" placeholder="https://example.com/evidence-2.png" />
              </label>
              <label>
                <div className="muted-label">证据链接 3</div>
                <input name="evidence" placeholder="https://example.com/evidence-3.png" />
              </label>
              <label>
                <div className="muted-label">上传证据图片</div>
                <input name="evidenceFile" type="file" accept="image/*" multiple />
                <div className="helper">可一次选择最多 3 张图片，后台会直接收录到举报证据中。</div>
              </label>
              <button className="btn btn-ghost" type="submit">
                提交举报
              </button>
            </form>
          </div>
          <div className="panel" style={{ marginTop: 18 }}>
            <h3>评论</h3>
            <div className="grid">
              {post.comments.map((comment) => (
                <div key={comment.id} className="card" style={{ padding: 14 }}>
                  <div className="helper">{comment.content}</div>
                  <div className="post-time">{new Date(comment.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
            <form className="form-stack" action={`/api/posts/${post.id}/comments`} method="post" style={{ marginTop: 16 }}>
              <textarea name="content" rows={3} placeholder="写下你的评论..." required />
              <button className="btn btn-primary" type="submit">
                发表评论
              </button>
            </form>
          </div>
        </section>
        <aside className="card">
          <h3>日志信息</h3>
          <div className="helper">可见范围：{post.visibility}</div>
          <div className="helper">审核状态：{post.status}</div>
          <div className="helper">点赞数：{post.likes.length}</div>
          <div className="helper">评论数：{post.comments.length}</div>
          <div className="inline-actions" style={{ marginTop: 16 }}>
            <Link href={`/pets/${pet?.id || ''}`} className="btn btn-secondary">
              去宠物主页
            </Link>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

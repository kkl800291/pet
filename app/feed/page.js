import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '../../components/app-shell.js';
import { PostCard } from '../../components/post-card.js';
import { getCurrentOwner } from '../../lib/auth.js';
import { backendJson } from '../../lib/backend.js';

export default async function FeedPage() {
  const owner = await getCurrentOwner();
  if (!owner) redirect('/login');

  const { response, payload } = await backendJson('/api/feed', { withCookies: true });
  if (!response.ok) {
    throw new Error('failed_to_load_feed');
  }
  const posts = payload?.items || [];

  return (
    <AppShell
      title="宠物广场"
      subtitle="按时间倒序展示内容，先验证记录习惯和内容互动。"
      actions={
        <>
          <Link href="/pets/new" className="btn btn-primary">
            新建宠物
          </Link>
          <Link href="/messages" className="btn btn-secondary">
            去消息中心
          </Link>
        </>
      }
    >
      <section className="hero">
        <div className="hero-actions">
          <Link href="/posts/new" className="btn btn-primary">
            发布日志
          </Link>
          <Link href="/pets" className="btn btn-secondary">
            宠物主页
          </Link>
        </div>
        <p className="helper">
          广场优先承载公开内容，评论、点赞、关注和举报都能从这里起步。
        </p>
      </section>

      <div className="grid" style={{ marginTop: 20 }}>
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            pet={post.pet}
            owner={post.owner}
            commentCount={post.comments.length}
            likeCount={post.likes.length}
            statusBadge="已通过"
          />
        ))}
      </div>
    </AppShell>
  );
}

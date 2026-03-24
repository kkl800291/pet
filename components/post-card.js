import Link from 'next/link';
import { initials } from '../lib/domain.js';

export function PostCard({ post, pet, owner, commentCount, likeCount, statusBadge }) {
  return (
    <article className="card post-card">
      <div className="post-topline">
        <div className="avatar">{initials(pet?.name || owner?.name)}</div>
        <div className="post-meta">
          <div className="post-title-row">
            <Link href={`/pets/${pet?.id || ''}`} className="post-owner">
              {pet?.name || '未知宠物'}
            </Link>
            <span className="post-owner-muted">by {owner?.name || '匿名主人'}</span>
          </div>
          <div className="post-time">{new Date(post.createdAt).toLocaleString()}</div>
        </div>
        <div className="status-pill">{statusBadge}</div>
      </div>
      <h3>{post.title}</h3>
      <p className="post-content">{post.content}</p>
      <div className="post-stats">
        <span>点赞 {likeCount}</span>
        <span>评论 {commentCount}</span>
        <span>可见性 {post.visibility}</span>
      </div>
      <div className="post-actions">
        <Link href={`/posts/${post.id}`} className="text-link">
          查看详情
        </Link>
      </div>
    </article>
  );
}

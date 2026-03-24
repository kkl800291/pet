import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { AppShell } from '../../../components/app-shell.js';
import { initials, threadIdFor } from '../../../lib/domain.js';
import { getCurrentOwner } from '../../../lib/auth.js';
import { getState } from '../../../lib/state.js';

export default async function PetDetailPage({ params }) {
  const owner = await getCurrentOwner();
  if (!owner) redirect('/login');

  const state = await getState();
  const pet = state.pets.find((item) => item.id === params.petId);
  if (!pet) notFound();
  const petOwner = state.owners.find((item) => item.id === pet.ownerId);
  const posts = state.posts.filter((post) => post.petId === pet.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const iFollow = state.follows.some((follow) => follow.followerOwnerId === owner.id && follow.targetPetId === pet.id);
  const myPet = state.pets.find((item) => item.ownerId === owner.id);
  const mutual = Boolean(myPet) && iFollow && state.follows.some((follow) => follow.followerOwnerId === pet.ownerId && follow.targetPetId === myPet.id);
  const threadId = threadIdFor(owner.id, pet.ownerId);

  return (
    <AppShell
      title={pet.name}
      subtitle={`${pet.species} · ${pet.breed || '未填写'} · ${pet.age || '年龄待补充'}`}
      actions={
        <div className="inline-actions">
          <Link href={`/posts/new?petId=${pet.id}`} className="btn btn-primary">
            发日志
          </Link>
          {mutual ? (
            <Link href={`/chat/${threadId}`} className="btn btn-secondary">
              去私聊
            </Link>
          ) : (
            <form action="/api/follows" method="post">
              <input type="hidden" name="targetPetId" value={pet.id} />
              <button className="btn btn-secondary" type="submit">
                {iFollow ? '已关注' : '关注'}
              </button>
            </form>
          )}
        </div>
      }
    >
      <div className="split">
        <section className="card">
          <div className="post-topline">
            <div className="avatar">{initials(pet.name)}</div>
            <div>
              <h3 style={{ marginBottom: 4 }}>{pet.name}</h3>
              <div className="helper">主人：{petOwner?.name || '未知'}</div>
            </div>
          </div>
          <div className="grid cols-2" style={{ marginTop: 16 }}>
            <div className="panel">
              <div className="muted-label">标签</div>
              <div className="helper">{(pet.tags || []).join('、') || '暂无'}</div>
            </div>
            <div className="panel">
              <div className="muted-label">生活习性</div>
              <div className="helper">{pet.habits || '暂无'}</div>
            </div>
          </div>
          <div className="panel" style={{ marginTop: 16 }}>
            <div className="muted-label">注意事项</div>
            <div className="helper">{pet.notes || '暂无'}</div>
          </div>
        </section>
        <aside className="card">
          <h3>快速动作</h3>
          <div className="helper">关注后可以进入私聊；宠物主页适合作为公开名片。</div>
          <div className="inline-actions" style={{ marginTop: 14 }}>
            <Link href="/feed" className="btn btn-secondary">
              返回广场
            </Link>
            <Link href="/messages" className="btn btn-secondary">
              看消息
            </Link>
          </div>
        </aside>
      </div>

      <section style={{ marginTop: 20 }} className="grid">
        {posts.map((post) => (
          <article key={post.id} className="card">
            <h3>{post.title}</h3>
            <p className="helper">{post.content}</p>
            <Link href={`/posts/${post.id}`} className="text-link">
              查看日志
            </Link>
          </article>
        ))}
      </section>
    </AppShell>
  );
}

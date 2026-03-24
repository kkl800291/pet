import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '../../components/app-shell.js';
import { initials } from '../../lib/domain.js';
import { getCurrentOwner } from '../../lib/auth.js';
import { getState } from '../../lib/state.js';

export default async function PetsPage() {
  const owner = await getCurrentOwner();
  if (!owner) redirect('/login');

  const state = await getState();
  const pets = state.pets.filter((pet) => pet.ownerId === owner.id);

  return (
    <AppShell
      title="宠物主页"
      subtitle="每只宠物都拥有自己的记录流、标签和提醒。"
      actions={
        <Link href="/pets/new" className="btn btn-primary">
          创建宠物
        </Link>
      }
    >
      <div className="grid cols-3">
        {pets.map((pet) => (
          <article key={pet.id} className="card">
            <div className="post-topline">
              <div className="avatar">{initials(pet.name)}</div>
              <div>
                <h3 style={{ marginBottom: 4 }}>{pet.name}</h3>
                <div className="helper">
                  {pet.species} · {pet.breed || '未填写'} · {pet.age || '年龄待补充'}
                </div>
              </div>
            </div>
            <p className="helper" style={{ marginTop: 12 }}>
              {pet.notes || '暂无备注'}
            </p>
            <div className="inline-actions">
              <Link href={`/pets/${pet.id}`} className="btn btn-secondary">
                查看主页
              </Link>
              <Link href={`/posts/new?petId=${pet.id}`} className="btn btn-primary">
                发日志
              </Link>
            </div>
          </article>
        ))}
        {pets.length === 0 ? (
          <div className="card">
            还没有宠物档案，先创建一个吧。
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}

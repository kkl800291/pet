import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '../../../components/app-shell.js';
import { getCurrentAdmin } from '../../../lib/auth.js';
import { getState } from '../../../lib/state.js';

export default async function AdminPetsPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');

  const state = await getState();

  return (
    <AppShell
      admin
      title="宠物管理"
      subtitle="查看所有宠物档案，作为运营和审核的基础。"
      actions={<Link href="/admin" className="btn btn-secondary">返回概览</Link>}
    >
      <div className="grid cols-3">
        {state.pets.map((pet) => (
          <article key={pet.id} className="card">
            <h3>{pet.name}</h3>
            <div className="helper">{pet.species} · {pet.breed || '未填写'}</div>
            <div className="helper">主人：{state.owners.find((owner) => owner.id === pet.ownerId)?.name}</div>
            <Link href={`/pets/${pet.id}`} className="text-link">
              打开主页
            </Link>
          </article>
        ))}
      </div>
    </AppShell>
  );
}

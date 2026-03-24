import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '../../../components/app-shell.js';
import { getCurrentAdmin } from '../../../lib/auth.js';
import { getState } from '../../../lib/state.js';

export default async function AdminUsersPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');

  const state = await getState();

  return (
    <AppShell
      admin
      title="用户管理"
      subtitle="用于查看主人状态和执行封禁 / 解封。"
      actions={<Link href="/admin" className="btn btn-secondary">返回概览</Link>}
    >
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>主人</th>
              <th>手机号</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {state.owners.map((owner) => (
              <tr key={owner.id}>
                <td>{owner.name}</td>
                <td>{owner.phone}</td>
                <td>{owner.status}</td>
                <td>
                  <div className="row-actions">
                    <form action={`/api/admin/owners/${owner.id}/${owner.status === 'banned' ? 'unban' : 'ban'}`} method="post">
                      <button className="btn btn-secondary" type="submit">
                        {owner.status === 'banned' ? '解封' : '封禁'}
                      </button>
                    </form>
                    <Link href="/admin/pets" className="btn btn-ghost">
                      查看宠物
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

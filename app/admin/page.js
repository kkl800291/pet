import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '../../components/app-shell.js';
import { getCurrentAdmin } from '../../lib/auth.js';
import { getState } from '../../lib/state.js';

export default async function AdminHomePage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');

  const state = await getState();

  return (
    <AppShell
      admin
      title="后台概览"
      subtitle="内容审核、举报治理和用户管理的最小可用中心。"
      actions={
        <>
          <Link href="/admin/review" className="btn btn-primary">
            去审核
          </Link>
          <Link href="/feed" className="btn btn-secondary">
            看前台
          </Link>
        </>
      }
    >
      <div className="grid cols-4">
        <div className="stat-card">
          <div className="muted-label">用户数</div>
          <div className="stat-value">{state.owners.length}</div>
        </div>
        <div className="stat-card">
          <div className="muted-label">宠物数</div>
          <div className="stat-value">{state.pets.length}</div>
        </div>
        <div className="stat-card">
          <div className="muted-label">待审日志</div>
          <div className="stat-value">{state.posts.filter((post) => post.status === 'pending').length}</div>
        </div>
        <div className="stat-card">
          <div className="muted-label">待处理举报</div>
          <div className="stat-value">{state.reports.filter((report) => report.status === 'open').length}</div>
        </div>
      </div>
      <div className="grid cols-3" style={{ marginTop: 20 }}>
        <Link href="/admin/review" className="card">
          <h3>内容审核</h3>
          <div className="helper">审核待发布内容与敏感日志。</div>
        </Link>
        <Link href="/admin/users" className="card">
          <h3>用户管理</h3>
          <div className="helper">封禁、解封和状态查看。</div>
        </Link>
        <Link href="/admin/reports" className="card">
          <h3>举报处理</h3>
          <div className="helper">处理内容和用户举报闭环。</div>
        </Link>
      </div>
    </AppShell>
  );
}

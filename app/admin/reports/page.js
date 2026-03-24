import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '../../../components/app-shell.js';
import { getCurrentAdmin } from '../../../lib/auth.js';
import { getState } from '../../../lib/state.js';

export default async function AdminReportsPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');

  const state = await getState();

  return (
    <AppShell
      admin
      title="举报处理"
      subtitle="对日志、评论与用户进行治理闭环。"
      actions={<Link href="/admin" className="btn btn-secondary">返回概览</Link>}
    >
      <div className="grid">
        {state.reports.map((report) => (
          <article key={report.id} className="card">
            <div className="post-topline">
              <div className="avatar">RP</div>
              <div className="post-meta">
                <div className="post-title-row">
                  <strong>{report.targetType}</strong>
                  <span className="status-pill">{report.status}</span>
                </div>
                <div className="helper">{report.reason}</div>
              </div>
            </div>
            <div className="helper" style={{ marginTop: 10 }}>
              举报对象：{report.targetId} · 举报人：{report.reporterOwnerId}
            </div>
            <div className="row-actions" style={{ marginTop: 14 }}>
              <form action={`/api/admin/reports/${report.id}/resolve`} method="post">
                <button className="btn btn-primary" type="submit">
                  标记已处理
                </button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}

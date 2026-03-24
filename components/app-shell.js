import Link from 'next/link';
import { getCurrentAdmin, getCurrentOwner } from '../lib/auth.js';

export async function AppShell({ title, subtitle, actions, children, admin = false }) {
  const owner = admin ? null : await getCurrentOwner();
  const adminUser = admin ? await getCurrentAdmin() : null;

  const navItems = admin
    ? [
        ['/admin', '概览'],
        ['/admin/review', '内容审核'],
        ['/admin/users', '用户管理'],
        ['/admin/pets', '宠物管理'],
        ['/admin/reports', '举报处理']
      ]
    : [
        ['/feed', '广场'],
        ['/pets', '宠物'],
        ['/messages', '消息'],
        ['/settings', '设置']
      ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">P</div>
          <div>
            <div className="brand-title">Pet Loop</div>
            <div className="brand-subtitle">{admin ? '管理后台' : '宠物社区 MVP'}</div>
          </div>
        </div>
        <nav className="nav-list">
          {navItems.map(([href, label]) => (
            <Link key={href} href={href} className="nav-link">
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="muted-label">{admin ? '当前管理员' : '当前主人'}</div>
          <div className="sidebar-user">{admin ? adminUser?.name || '未登录' : owner?.name || '未登录'}</div>
          <div className="sidebar-meta">{admin ? adminUser?.email || 'admin@pet.local' : owner?.phone || '请先登录'}</div>
        </div>
      </aside>
      <main className="content-area">
        <header className="page-header">
          <div>
            <p className="eyebrow">{admin ? 'Admin Console' : 'Pet Community MVP'}</p>
            <h1>{title}</h1>
            {subtitle ? <p className="subtitle">{subtitle}</p> : null}
          </div>
          <div className="page-actions">{actions}</div>
        </header>
        {children}
      </main>
    </div>
  );
}

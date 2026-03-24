import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '../../../components/app-shell.js';
import { getCurrentAdmin } from '../../../lib/auth.js';

export default async function AdminLoginPage() {
  const admin = await getCurrentAdmin();
  if (admin) redirect('/admin');

  return (
    <AppShell
      admin
      title="管理后台登录"
      subtitle="用于内容审核、举报处理、用户封禁与运营配置。"
      actions={<Link href="/" className="btn btn-secondary">返回首页</Link>}
    >
      <div className="split">
        <section className="card">
          <form className="form-stack" action="/api/admin/login" method="post">
            <label>
              <div className="muted-label">邮箱</div>
              <input name="email" defaultValue="admin@pet.local" required />
            </label>
            <label>
              <div className="muted-label">密码</div>
              <input name="password" type="password" defaultValue="admin123" required />
            </label>
            <button className="btn btn-primary" type="submit">
              登录后台
            </button>
          </form>
        </section>
        <section className="card">
          <h3>演示账号</h3>
          <div className="helper">admin@pet.local / admin123</div>
        </section>
      </div>
    </AppShell>
  );
}

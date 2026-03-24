import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '../../components/app-shell.js';
import { getCurrentOwner } from '../../lib/auth.js';

export default async function LoginPage() {
  const owner = await getCurrentOwner();
  if (owner) {
    redirect('/feed');
  }

  return (
    <AppShell
      title="用户登录 / 绑定"
      subtitle="当前版本用手机号模拟微信登录 + 绑定宠物身份。"
      actions={
        <>
          <Link href="/" className="btn btn-secondary">
            返回首页
          </Link>
        </>
      }
    >
      <div className="split">
        <section className="card">
          <h3>进入用户端</h3>
          <p className="helper">输入手机号和昵称后，会自动创建或更新主人身份。</p>
          <form className="form-stack" action="/api/auth/login" method="post">
            <label>
              <div className="muted-label">手机号</div>
              <input name="phone" placeholder="13800000000" required />
            </label>
            <label>
              <div className="muted-label">昵称</div>
              <input name="name" placeholder="阿柯" required />
            </label>
            <button className="btn btn-primary" type="submit">
              登录并进入广场
            </button>
          </form>
        </section>
        <section className="card">
          <h3>说明</h3>
          <ul className="helper">
            <li>第一版先用手机号 + 宠物档案完成身份绑定。</li>
            <li>后续可以替换成微信登录、短信验证和更强的账号找回流程。</li>
            <li>宠物主页是产品核心，主人只是管理者身份。</li>
          </ul>
        </section>
      </div>
    </AppShell>
  );
}

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '../../components/app-shell.js';
import { getCurrentOwner } from '../../lib/auth.js';

export default async function SettingsPage() {
  const owner = await getCurrentOwner();
  if (!owner) redirect('/login');

  return (
    <AppShell
      title="我的 / 设置"
      subtitle="当前版本以宠物为主身份，主人仅作为管理主体。"
      actions={<Link href="/login" className="btn btn-secondary">切换账号</Link>}
    >
      <div className="grid cols-2">
        <div className="card">
          <h3>当前账号</h3>
          <div className="helper">昵称：{owner.name}</div>
          <div className="helper">手机号：{owner.phone}</div>
          <div className="helper">状态：{owner.status}</div>
        </div>
        <div className="card">
          <h3>产品边界</h3>
          <div className="helper">V1 不做商业化、不做同城、不做搜索和推荐算法。</div>
          <div className="helper">优先验证记录习惯、社区互动和审核治理。</div>
        </div>
      </div>
    </AppShell>
  );
}

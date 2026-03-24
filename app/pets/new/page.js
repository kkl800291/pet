import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '../../../components/app-shell.js';
import { getCurrentOwner } from '../../../lib/auth.js';

export default async function NewPetPage() {
  const owner = await getCurrentOwner();
  if (!owner) redirect('/login');

  return (
    <AppShell
      title="创建宠物"
      subtitle="用结构化字段完成建档，后续可用于提醒和检索。"
      actions={<Link href="/pets" className="btn btn-secondary">返回宠物</Link>}
    >
      <section className="card">
        <form className="form-stack" action="/api/pets" method="post">
          <div className="form-grid">
            <label>
              <div className="muted-label">宠物名</div>
              <input name="name" required placeholder="糯米" />
            </label>
            <label>
              <div className="muted-label">物种</div>
              <input name="species" required placeholder="猫 / 狗 / 兔" />
            </label>
            <label>
              <div className="muted-label">品种</div>
              <input name="breed" placeholder="英短" />
            </label>
            <label>
              <div className="muted-label">年龄</div>
              <input name="age" placeholder="2岁" />
            </label>
            <label>
              <div className="muted-label">性别</div>
              <input name="sex" placeholder="母" />
            </label>
            <label>
              <div className="muted-label">标签</div>
              <input name="tags" placeholder="亲人, 爱睡觉" />
            </label>
          </div>
          <label>
            <div className="muted-label">注意事项</div>
            <textarea name="notes" rows={3} placeholder="例如：换粮要循序渐进" />
          </label>
          <label>
            <div className="muted-label">生活习性</div>
            <textarea name="habits" rows={3} placeholder="例如：早上更活跃" />
          </label>
          <div className="inline-actions">
            <button className="btn btn-primary" type="submit">
              保存宠物档案
            </button>
          </div>
        </form>
      </section>
    </AppShell>
  );
}

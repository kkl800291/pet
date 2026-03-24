import Link from 'next/link';
import { AppShell } from '../components/app-shell.js';
import { getState } from '../lib/state.js';

export default async function HomePage() {
  const state = await getState();
  const approvedPosts = state.posts.filter((post) => post.status === 'approved');

  return (
    <AppShell
      title="Web 原型预览"
      subtitle="这不是正式后台，而是当前产品结构的 Web 预览层；真正的业务接口已经拆到 backend/。"
      actions={
        <>
          <Link href="/login" className="btn btn-primary">
            进入用户端
          </Link>
          <Link href="/admin/login" className="btn btn-secondary">
            管理后台
          </Link>
        </>
      }
    >
      <section className="hero">
        <div className="grid cols-3">
          <div className="stat-card">
            <div className="muted-label">宠物档案</div>
            <div className="stat-value">{state.pets.length}</div>
            <div className="helper">每只宠物都能独立拥有主页与日志流。</div>
          </div>
          <div className="stat-card">
            <div className="muted-label">公开日志</div>
            <div className="stat-value">{approvedPosts.length}</div>
            <div className="helper">先做时间流，后续再扩展推荐与同城。</div>
          </div>
          <div className="stat-card">
            <div className="muted-label">待审核内容</div>
            <div className="stat-value">{state.posts.filter((post) => post.status === 'pending').length}</div>
            <div className="helper">机审前置 + 人审兜底，降低社区风险。</div>
          </div>
        </div>
      </section>

      <div className="grid cols-2" style={{ marginTop: 20 }}>
        <div className="card">
          <h3>核心路径</h3>
          <ol className="helper">
            <li>手机号绑定后创建宠物档案。</li>
            <li>用模板日志记录日常、提醒和习性。</li>
            <li>在广场浏览、点赞、评论、关注。</li>
            <li>互相关注后发起私聊。</li>
            <li>举报、拉黑与后台审核形成治理闭环。</li>
          </ol>
        </div>
        <div className="card">
          <h3>当前种子数据</h3>
          <div className="helper">系统自带演示主人、宠物、日志和聊天记录，可直接体验完整闭环。</div>
          <div className="inline-actions" style={{ marginTop: 14 }}>
            <Link href="/feed" className="btn btn-primary">
              看广场
            </Link>
            <Link href="/pets" className="btn btn-secondary">
              看宠物
            </Link>
            <Link href="/messages" className="btn btn-secondary">
              看消息
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

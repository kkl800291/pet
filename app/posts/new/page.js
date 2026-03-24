import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '../../../components/app-shell.js';
import { getCurrentOwner } from '../../../lib/auth.js';
import { backendJson } from '../../../lib/backend.js';

export default async function NewPostPage({ searchParams }) {
  const owner = await getCurrentOwner();
  if (!owner) redirect('/login');

  const { response, payload } = await backendJson(`/api/pets?ownerId=${encodeURIComponent(owner.id)}`, { withCookies: true });
  if (!response.ok) {
    throw new Error('failed_to_load_owner_pets');
  }
  const pets = payload?.items || [];
  if (!pets.length) {
    redirect('/pets/new');
  }
  const defaultPetId = searchParams?.petId || pets[0]?.id || '';

  return (
    <AppShell
      title="发布日志"
      subtitle="用模板化内容记录宠物的日常、注意事项和生活习性。"
      actions={<Link href="/feed" className="btn btn-secondary">返回广场</Link>}
    >
      <section className="card">
        <form className="form-stack" action="/api/posts" method="post" encType="multipart/form-data">
          <label>
            <div className="muted-label">选择宠物</div>
            <select name="petId" defaultValue={defaultPetId}>
              {pets.map((pet) => (
                <option key={pet.id} value={pet.id}>
                  {pet.name}
                </option>
              ))}
            </select>
          </label>
          <div className="form-grid">
            <label>
              <div className="muted-label">标题</div>
              <input name="title" placeholder="今天精神不错" required />
            </label>
            <label>
              <div className="muted-label">可见范围</div>
              <select name="visibility" defaultValue="public">
                <option value="public">公开</option>
                <option value="followers">关注可见</option>
                <option value="private">仅自己可见</option>
              </select>
            </label>
          </div>
          <label>
            <div className="muted-label">内容</div>
            <textarea name="content" rows={6} required placeholder="今天喂了什么、有没有异常、有什么提醒..." />
          </label>
          <label>
            <div className="muted-label">图片</div>
            <input name="file" type="file" accept="image/*" />
          </label>
          <div className="inline-actions">
            <button className="btn btn-primary" type="submit">
              发布日志
            </button>
          </div>
        </form>
      </section>
    </AppShell>
  );
}

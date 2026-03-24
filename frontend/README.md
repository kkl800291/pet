# Frontend (Vue 3)

管理后台重构工程，技术栈：Vue 3 + Vite + Pinia + Vue Router。

## 启动

1. 启动后端：

```bash
npm run dev:backend
```

2. 启动前端：

```bash
npm --prefix frontend install
npm run dev:frontend
```

访问：`http://127.0.0.1:3101`

## 路由

- `/login`
- `/dashboard`
- `/review`
- `/reports`
- `/users`
- `/pets`
- `/audits`
- `/settings`

## 说明

- Vite 代理 `/api`、`/uploads` 到 `http://127.0.0.1:4000`
- Session 走 Cookie（`withCredentials: true`）
- UI 风格按 Stitch 3.0 的蓝灰风控后台方向实现

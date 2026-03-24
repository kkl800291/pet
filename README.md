# Pet Community MVP

宠物社区项目的分层仓库。

## 当前结构

- `backend/`：独立 REST API + SQLite 后端
- `frontend/`：Vue3 管理后台（重构版）
- `miniapp/`：微信小程序骨架目录
- `app/`：Web 原型 / 管理入口预览

## 运行

```bash
npm run dev:backend
npm run dev:frontend
```

后端默认地址：

- REST API: `http://127.0.0.1:4000`
- WebSocket: `ws://127.0.0.1:4000/ws`
- 管理后台: `http://127.0.0.1:3101`

如果你还想看当前 Web 原型：

```bash
npm run dev
```

Web 预览地址：

- `http://127.0.0.1:3100`

## 生产启动

后端建议单独启动：

```bash
npm run start:backend
```

关键环境变量参考：

- [backend/.env.example](/Users/bossli/Desktop/pet/backend/.env.example)

健康检查：

- Liveness: `GET /health`
- Readiness: `GET /readyz`

## 演示账号

- 用户端：任意手机号 + 昵称
- 管理员：`admin@pet.local` / `admin123`

## 说明

- 后端对外只提供 REST API，不再把前后端糊在一起。
- 小程序和后续新前端都应该只消费 `backend/` 的接口。

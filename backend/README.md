# Backend

独立的 REST API + SQLite 后端。

## 运行

```bash
npm run dev:backend
```

默认地址：

- REST API: `http://127.0.0.1:4000`
- WebSocket: `ws://127.0.0.1:4000/ws`

## 当前职责

- 用户登录
- 宠物建档
- 日志发布
- 广场内容
- 关注与私聊
- 举报审核
- 管理后台接口
- 基础配置与审计日志

## 生产部署最小要求

- 参考 [backend/.env.example](/Users/bossli/Desktop/pet/backend/.env.example) 配置生产环境变量
- 生产环境建议：
  - `BACKEND_HOST=0.0.0.0`
  - `BACKEND_TRUST_PROXY=true`
  - `BACKEND_COOKIE_SECURE=true`
  - `BACKEND_COOKIE_SAMESITE=none`
  - `CORS_ORIGINS` 配置成真实前端域名

## 健康检查

- Liveness: `GET /health`
- Readiness: `GET /readyz`

## 当前生产硬化项

- Helmet 安全头
- API 全局限流
- 登录接口限流
- 统一 JSON 错误返回
- 请求 `x-request-id`
- 上传文件大小与数量限制
- HTTP keep-alive / headers timeout 配置

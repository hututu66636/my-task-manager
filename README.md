# 智能任务管理系统（Task Manager）

React + Node.js + Supabase 的课程实训项目。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + Vite（蓝白卡片风，适配电脑/手机） |
| 后端 | Node.js + Express（`server.js`，部署后由 Vercel 托管） |
| 数据库 | Supabase（PostgreSQL，表 `tasks`） |
| 托管 | GitHub → Vercel 部署 |

## 功能

- 添加任务（标题 + 高/中/低优先级 + 可选截止日期）
- 任务列表（最新任务排最上面，已完成显示删除线、文字变淡）
- 一键切换完成 / 未完成
- 删除任务（有确认提示）
- 筛选：全部 / 高 / 中 / 低优先级
- 按标题搜索
- 统计面板：总数、已完成、未完成、完成率
- 截止日期 + 逾期任务红色提醒
- 数据存 Supabase 云端（未配置时自动降级本地演示模式）

## 本地运行

```bash
npm install
npm run dev:api   # 终端1：启动后端 http://localhost:3001
npm run dev       # 终端2：启动前端 http://localhost:5173
```

一体化预览（先构建再用后端托管）：

```bash
npm install
npm run build
npm start         # 打开 http://localhost:3001
```

## 配置 Supabase（必须做，否则是本地演示模式）

1. 登录 https://supabase.com 创建项目
2. SQL Editor 里执行本仓库的 `supabase-setup.sql`
3. Project Settings → API Keys，复制 Project URL 和 publishable key
4. 把它们写入 Vercel 环境变量（或本地 `.env`，配合 dotenv 使用时自行加载）：

```
SUPABASE_URL=https://你的项目ID.supabase.co
SUPABASE_ANON_KEY=sb_publishable_你的key
```

## 部署到 Vercel

1. 代码推送到 GitHub
2. Vercel → Add New Project → 导入该仓库（框架选 Other）
3. 环境变量里添加 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY`
4. Deploy，完成后在 Settings → Domains 绑定自己的域名

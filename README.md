# 我的待办

自用的待办小站：分类、勾选打钩、完成记录。线上地址计划为 todo.linqiumeng.com。

- 样式是一本线圈便签本：米白纸（默认）/ 暗色可切换，待办按分类分段，勾选时画一个蓝色圆珠笔的钩
- 主页：所有未完成的待办 + 今天完成的（打钩留在原位）；昨天及以前完成的只在「记录」页出现，按天分组
- 分类：在主页点「管理分类」新建、改名、换颜色、删除；删除分类后，里面的待办移到「未分类」
- 没有账号系统，打开网站要输入一次口令（环境变量 `PASSCODE`），浏览器会记住

技术栈：React（Vite）+ Express + MongoDB（Mongoose），部署在 Vercel，Express 作为 `/api` 的 Serverless 函数运行。结构和菜谱站一样。

## 本地开发

```bash
npm install
npm run dev
```

打开 http://localhost:5174 ，口令是 `dev`。不配置 `.env` 时会自动启动本地数据库，数据存在 `.data/`。

如果在 `.env` 里填了 `MONGODB_URI`，连的就是线上数据库，本地的改动会直接出现在线上。

## 部署（Vercel）

环境变量：

| 名称 | 说明 |
|---|---|
| `MONGODB_URI` | 和菜谱站同一个 Atlas 集群，把库名从 `/recipes` 换成 `/todo` |
| `PASSCODE` | 打开网站时输入的口令，改了之后各设备需要重新输入 |

## 接口

所有接口都要带 `X-Passcode` 请求头（口令经过 `encodeURIComponent`）。

```
GET    /api/check                         验证口令
GET    /api/categories                    分类列表
POST   /api/categories                    { name, color }
PATCH  /api/categories/:id                { name?, color? }
DELETE /api/categories/:id                里面的待办移到未分类
GET    /api/todos?since=<ISO>             未完成的 + since 之后完成的
GET    /api/todos/history?before=&category=   已完成，按完成时间倒序，每页 50 条；category 可为 none
POST   /api/todos                         { title, category? }
PATCH  /api/todos/:id                     { title?, category?, done? }
DELETE /api/todos/:id
```

# MindBase

一个你可以自己托管的极简笔记 app。Notion 的外观,无限嵌套的笔记本,图片直接粘进来自动存到你自己的 R2。

**线上 demo**:<https://mindbase.me>

---

## 这是什么

如果你觉得 Notion 太重、卡顿、数据被锁在别人那里,但又离不开"笔记本嵌套笔记 + 随手贴图 + 封面图"这套手感,这个项目就是给你的。

- **两种概念,就两种**:笔记本(可以无限嵌套)、笔记(挂在任意一层)。
- **看起来像 Notion**:纯白底、黑字、面包屑、行式列表、hover 才显示的弱装饰。
- **数据全在你自己账号下**:Cloudflare D1 存文本,Cloudflare R2 存图片。你随时导出成 JSON 搬走。
- **不是 SaaS**:每个想用的人自己开一份,完整掌控自己的库。

## 它能做什么

- 笔记本可以嵌笔记本,一直往下嵌。面包屑一路顺着点回去。
- 每个笔记 / 笔记本都能:改名、换 emoji 图标、加封面图(8 张预置 + 任意 URL)。首页本身也一样。
- 笔记正文:
  - `⌘/Ctrl + B` 加粗,`⌘/Ctrl + I` 斜体
  - 行首打 `# ␣` / `## ␣` / `### ␣` 自动变成 H1/H2/H3
  - 底部常驻工具条:H1/H2/H3/正文/加粗/斜体/插图
  - 截图直接 `⌘/Ctrl + V` 粘,或拖文件进来,自动上传到你的 R2
  - 删图、删笔记、删笔记本时,对应 R2 对象自动一起清掉
- Google 一键登录(Sign in with Google)
- 一键导出所有数据成 JSON

## 技术栈

| 层 | 用什么 |
|---|---|
| 前端 | Vue 3 · Vue Router · Tailwind CSS 4 · Vite |
| 后端 | Cloudflare Workers(原生 JS,分 `api → service → repository` 三层) |
| 数据库 | Cloudflare D1(SQLite) |
| 图片 | Cloudflare R2(Worker 代理 `/i/<key>` 路由读取) |
| 认证 | Google Identity Services(ID Token) + 自签 JWT Cookie |

全家桶都跑在 Cloudflare 边缘,免费额度对个人用基本够用。

---

## 快速开始

整个过程大概 **15–20 分钟**,涉及三个外部账号:**GitHub**(fork 代码)、**Google Cloud**(OAuth 登录)、**Cloudflare**(部署)。按顺序走就行。

### 0. 准备

确认本机:

- Node.js 20.19+ 或 22.12+
- 一个 Cloudflare 账号(免费版够)
- 一个 Google 账号
- 一个可选的自定义域名(没有也能用 `.workers.dev` 测试域名)

```bash
git clone https://github.com/<你的账号>/mindbase
cd mindbase
npm install
```

### 1. Cloudflare 侧:建 D1 和 R2

D1 是 SQLite,R2 是对象存储。两个都在 Cloudflare 免费额度里。

```bash
# 登录 CF 账号(浏览器跳过去点同意)
npx wrangler login

# 建一个名叫 mindbase 的 D1 数据库,记住返回的 database_id
npx wrangler d1 create mindbase

# 建一个 R2 桶放图片
npx wrangler r2 bucket create mindbase-images
```

D1 命令会吐一段 JSON 片段,里面有 `database_id`,长这样:

```
✅ Successfully created DB 'mindbase'
"database_id": "e4e59dd3-5890-46ba-9725-6bbdd6453d4a"
```

把这个 id 先记下,下一步要填。

顺便拿一下你的 account_id:

```bash
npx wrangler whoami
```

输出里会有一串 32 位的十六进制,就是你的 `account_id`。

### 2. Google 侧:建 OAuth Client ID

登录的按钮是 Google 官方的 "Sign in with Google" 按钮,要在 Google Cloud Console 注册一个 OAuth 客户端,告诉 Google 允许哪个网站用它登录。

1. 进 <https://console.cloud.google.com/>,左上角点项目选择器 → 新建项目,随便起个名字(比如 "mindbase")。
2. 左侧菜单 → **APIs & Services** → **OAuth consent screen**
   - User Type 选 **External**
   - App name 填你想要的,User support email 填你自己的邮箱就行
   - Scopes 跳过,Test users 可以加上自己的邮箱方便先测
   - 保存完回到 Dashboard
3. 左侧菜单 → **Credentials** → 上方 **+ CREATE CREDENTIALS** → **OAuth client ID**
   - Application type 选 **Web application**
   - **Authorized JavaScript origins** 这一栏很关键,加两条:
     - `http://localhost:5173`(本地开发)
     - `https://你的域名`(部署后;不用自定义域名就填 `https://<worker-name>.<你的子账号>.workers.dev`)
   - **Authorized redirect URIs** 留空,我们不走跳转登录
4. 点 **Create**,页面会弹出 **Client ID**,复制备用。长这样:
   ```
   1234567890-abc...xyz.apps.googleusercontent.com
   ```

> ⚠️ JavaScript origins 如果填错(比如少了 `https://` 或者域名拼错),前端 Google 按钮就不会出现。后面调试如果登录按钮空空,优先回来检查这一项。

### 3. 填 `wrangler.jsonc`

所有私密配置都集中在这一份文件里,`wrangler.jsonc` 本身已经在 `.gitignore`,不会被提交。

```bash
cp wrangler.example.jsonc wrangler.jsonc
```

打开 `wrangler.jsonc`,按注释填:

| 字段 | 从哪里来 |
|---|---|
| `account_id` | 第 1 步 `npx wrangler whoami` |
| `d1_databases[0].database_id` | 第 1 步创建 D1 时返回的 |
| `vars.GOOGLE_CLIENT_ID` | 第 2 步 Google Console |
| `vars.JWT_SECRET` | 随便生成,下面有命令 |
| `routes[0].pattern` | 你的域名;**如果不绑自定义域名,直接把整个 `routes` 段删掉** |

生成 JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4. 建表

远端 D1 初始化:

```bash
npx wrangler d1 execute mindbase --remote --file=mindbase.sql --yes
```

如果想本地先测(`npm run dev` 会模拟一个本地 D1):

```bash
npx wrangler d1 execute mindbase --local --file=mindbase.sql --yes
```

`mindbase.sql` 就是完整的建表脚本,跑一次就够了。以后要加字段就改这份文件 + 手写一句 `ALTER TABLE`,没有迁移框架那套负担。

### 5. 跑起来 / 部署上去

本地开发:

```bash
npm run dev
```

打开 <http://localhost:5173>,点 Google 登录,就能开始写了。

部署上线:

```bash
npm run deploy
```

首次部署会吐一个 `.workers.dev` 的测试 URL。如果你在 `wrangler.jsonc` 的 `routes` 里填了自定义域名,Cloudflare 会自动帮你:

- 往你托管的 DNS 里加 CNAME
- 申请并绑定 SSL 证书
- 1–2 分钟后 `https://你的域名` 就能访问

> 注意:自定义域名必须**先托管在 Cloudflare**(在 CF 控制台 Websites 里加过)。如果域名还在别家 DNS,先把 nameserver 换到 CF,等几分钟生效再 deploy。

## 绑自定义域名

如果你想把它放在自己的域名下(比如 `notes.example.com`):

1. 确认域名已经托管在 Cloudflare(Websites 列表里能看到它)
2. 在 `wrangler.jsonc` 的 `routes` 数组里写:
   ```jsonc
   "routes": [
     { "pattern": "notes.example.com", "custom_domain": true }
   ]
   ```
3. 回到 Google Cloud Console 的 OAuth Client 里,把 `https://notes.example.com` 加进 **Authorized JavaScript origins**
4. `npm run deploy`

Cloudflare 会自动完成 DNS + 证书。如果几分钟后打不开,去 CF 控制台 → 你的 Worker → Settings → Domains & Routes 看绑定状态。

---

## 导出 / 备份数据

右上角头像 → **⬇ 导出数据**,下载一个 `mindbase-export-YYYY-MM-DD.json`,里面是:

```json
{
  "exported_at": "...",
  "version": 1,
  "user":       { "email": "...", "name": "...", ... },
  "notebooks":  [ { "id": "...", "parent_id": "...", "name": "...", ... } ],
  "notes":      [ { "id": "...", "notebook_id": "...", "title": "...", "content": "<html>", ... } ]
}
```

所有 id 都在里面,层级关系靠 `parent_id` / `notebook_id` 复原。内容是 HTML(因为编辑器就是 contenteditable),搬到别处也好解析。

## 项目结构

```
server/
  index.js                 Worker 入口
  api/                     路由 → service
  service/                 业务编排
  repository/              D1 SQL
  domain/auth/             JWT + Google ID token 校验
  domain/image/            R2 引用提取 / 清理

src/
  views/                   Home / Notebook / Note / Welcome
  components/              AppHeader / Breadcrumb / Cover* / EmojiPicker / ItemList / ContentEditor / EditorToolbar / Popover
  composables/             useAuth / useGoogle
  api/client.js            fetch 封装
  lib/                     cover / emoji / html / image 辅助
  router/                  vue-router

mindbase.sql               数据库完整 DDL(一份就够)
wrangler.example.jsonc     配置模板(复制成 wrangler.jsonc 后填)
```

## 常见问题

**登录按钮没出来?**
Google JavaScript origins 填错了。回 Google Cloud Console → Credentials,编辑 OAuth client,确认 `http://localhost:5173` 或你的域名在列表里,**一字不差**(连 http/https 都要对)。改完等 1–2 分钟生效。

**部署成功但打开报 500?**
`wrangler.jsonc` 里 `vars.JWT_SECRET` 没填。后端每次签发 cookie 都要它,空着就抛错。

**图片上传失败?**
检查 R2 桶名跟 `wrangler.jsonc` 里 `r2_buckets[0].bucket_name` 一致。名字错了会 500。

**换电脑继续开发?**
git clone 之后重新 `cp wrangler.example.jsonc wrangler.jsonc` 填一遍就行。所有敏感信息不在仓库里,所以换机器需要重新填。

## 设计取舍

- **正文存 HTML 而不是结构化 JSON(block)**:`contenteditable` 原生产 HTML,`innerHTML` 存起来就完事。代价是暂时没有块级类型化编辑。以后想上 tiptap / lexical 再说。
- **粘贴强制去格式**:避免把外部富文本样式拖进来;但粘贴里如果有图片文件会被识别,走上传。
- **R2 清理**:笔记保存时 diff 旧/新 HTML,删掉的图立刻清;删笔记 / 笔记本时递归清子孙。严格校验 key 前缀是当前用户,绝不误删别人的图。
- **JWT secret 放 `vars` 不是 `wrangler secret`**:一切都在被 gitignore 的 `wrangler.jsonc` 里,集中好管。多环境部署再考虑迁 `wrangler secret put`。

## License

[MIT](./LICENSE) —— 随便拿去改、拿去用。

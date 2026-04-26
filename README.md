# MindBase 🌿

**你和 AI 共用的一本笔记库。**

📝 你写笔记 · 🤖 AI 读、整理、写 · 📦 数据全在你自己 Cloudflare 账号下

🔗 **Live demo:** <https://mindbase.me>

---

## 📸 长什么样

<table>
<tr>
  <td width="50%">
    <img src="https://mindbase.me/screenshots/home.png" alt="首页"/>
    <p align="center"><sub>🏠 首页:笔记本 + 笔记混排,拖动整理</sub></p>
  </td>
  <td width="50%">
    <img src="https://mindbase.me/screenshots/notebook-reading.png" alt="笔记本"/>
    <p align="center"><sub>📚 笔记本无限嵌套,封面图 + emoji 图标</sub></p>
  </td>
</tr>
<tr>
  <td width="50%">
    <img src="https://mindbase.me/screenshots/note-editor.png" alt="编辑器"/>
    <p align="center"><sub>✏️ Notion 式编辑器:H1/H2/粗体/斜体/粘贴图</sub></p>
  </td>
  <td width="50%">
    <img src="https://mindbase.me/screenshots/ai-authorization.png" alt="AI 授权"/>
    <p align="center"><sub>🤖 一键 AI 授权,关闭立刻失效</sub></p>
  </td>
</tr>
</table>

---

## ✨ 特性

- 📁 **无限嵌套笔记本** + 笔记,emoji 图标 + 8 张预置封面 / 自定义图
- ✏️ **Notion 式编辑器**:H1/H2/H3、粗体、斜体、行首 `# ` Markdown 快捷键
- 📷 **粘贴即上传**:`⌘V` 截图直传你自己的 R2,删笔记自动清理
- 🔍 **全文搜索**:笔记本名 + 笔记标题 + 正文
- 🎯 **三种拖动语义**:同级**重排**(拖到上下边缘)/ **嵌套**(悬停笔记本 0.5s 自动切到"放入")/ **跨级移动**(拖到面包屑任意上级或首页)
- 🔐 **Google 一键登录**
- 🤖 **一键 AI 授权**:OpenAPI 3.1 schema + Bearer token
- 🎒 **可下载 Skill 包**:兼容 Anthropic Skills,丢进 `~/.claude/skills/` 即可

## 🛠 技术栈

Cloudflare Workers · D1 · R2 · Vue 3 · Tailwind CSS 4 · Vite · OpenAPI 3.1 · Anthropic Skills

后端 `api → service → repository` 三层。私密配置全在 gitignore 的 `wrangler.jsonc` 里。

## 🚀 自己部署一份

需要:**Cloudflare 账号**、**Google 账号**、**Node 20.19+**

```bash
git clone https://github.com/valueriver/mindbase
cd mindbase && npm install

# 1️⃣  建 D1 + R2(记下返回的 database_id)
npx wrangler d1 create mindbase
npx wrangler r2 bucket create mindbase

# 2️⃣  Google Cloud Console 建 OAuth Web Client
#    https://console.cloud.google.com/apis/credentials
#    Authorized JavaScript origins 加 http://localhost:5173 + 你的域名

# 3️⃣  填配置
cp wrangler.example.jsonc wrangler.jsonc
# 改 account_id / database_id / GOOGLE_CLIENT_ID / JWT_SECRET

# 4️⃣  建表
npx wrangler d1 execute mindbase --remote --file=mindbase.sql --yes

# 5️⃣  部署
npm run deploy
```

本地开发 `npm run dev`,打开 <http://localhost:5173>

## 🤖 AI 怎么接进来

`/ai` 页面有两块:

- 💬 **快捷消息** —— 复制粘贴给 ChatGPT / Claude,AI 自己 fetch schema 干活
- 🎒 **技能包** —— 下载 zip 放进 AI 运行时的 skills 目录,以后不用粘消息

底层是 OpenAPI 3.1 schema(`/api/ai/openapi.json`),GPT Actions / Claude Custom Connector / 任何支持 OpenAPI 的工具都能 import。

AI 拿到的是**读+写**权限,但管令牌的接口(`/api/tokens/*`)永远拒绝它 —— 撤销和重发只有你能做。

## 📜 License

[MIT](./LICENSE) —— 拿去改、拿去用,觉得有用记得给个 ⭐

# MindBase

**你和你 AI 共用的一本笔记库。**

你在这里写笔记,像在 Notion 里一样 —— 嵌套的笔记本、emoji 图标、封面图、粘贴就进 R2 的截图。

点一下"开启 AI 授权",复制一段消息发给 ChatGPT / Claude,AI 就能**读写**这本库 —— 翻笔记、做检索、写摘要、新建条目、整理结构,跟你一起用。

关闭授权 → AI 立刻失去访问。随时可开可关。

**Live demo:** <https://mindbase.me>

---

## 为什么做这个

笔记是你思考方式的骨架。AI 时代,你的 AI 应该能看到这副骨架 —— 不然它永远是个刚认识你的陌生人。

但大厂那套 "让 AI 接入你数据" 的方式通常意味着:把数据交出去,信任一个黑箱。MindBase 反过来:

- **数据你自己托管**。Cloudflare D1(笔记)+ R2(图片),都在你自己的账号下。
- **AI 通过一条可撤销的凭证访问**。不是长期 OAuth,不是账号密码,就一串可以随时清掉的令牌。
- **AI 可以读写,但不能管理令牌本身**。撤销 / 重发 这件事永远在你手上。
- **你和 AI 看的是同一份东西**。你或它改了,另一边下一次读到的就是新的。

## 能做什么

- 笔记本无限嵌套,笔记可以挂在任意一层或根
- 每层都能:改名、换 emoji、设封面(8 张预置 + 自定义 URL)
- 富文本编辑:H1/H2/H3、粗体、斜体(Markdown 行首快捷键 + `⌘B` / `⌘I`)
- `⌘V` 粘贴图片 / 拖文件进来 → 直传你自己的 R2
- 删笔记 / 笔记本时,用到的图自动从 R2 清理
- 全文搜索:笔记本名 + 笔记标题 + 笔记正文(`/api/search?q=...`)
- 右上角头像 → AI 授权 → 开启 / 关闭 + 一键复制消息发给 AI
- 一份可下载的 Skill 包,放进任何兼容 Anthropic Skills 的 AI 运行时即可
- Google 一键登录

## 怎么接进 AI

线上是一份标准 **OpenAPI 3.1** schema,任何支持 OpenAPI 的 AI 工具都能直接 import。

开启授权后,`/ai` 页面给你两个核心值:

- **Schema URL** — `https://<你的域名>/api/ai/openapi.json`(无需鉴权,描述全部接口)
- **API Key** — 一串 `mb_` 开头的 Bearer token

三种用法,挑一个:

### A. 对话型 AI(最简单)

`/ai` 页面 → "消息" tab → **复制消息** → 粘到 ChatGPT / Claude 对话里。AI 会自己 fetch schema 然后开始调。

### B. GPTs Action / Custom Connector

把 Schema URL 和 API Key 配进自定义 GPT 的 Action,或 Claude 的 Custom Connector / 其它支持 OpenAPI 的工具:

1. Schema 选 "Import from URL",填 Schema URL
2. Authentication 选 API Key → Bearer,填 API Key

### C. Skill 包

`/ai` 页面 → "技能" tab → 下载 `mindbase-skill.zip`,解压到 AI 运行时的 skills 目录(Claude Code 是 `~/.claude/skills/`)。AI 会在你提到笔记时自动加载这套指令,不用每次粘消息。

---

**AI 不能动的接口:** `/api/tokens/*`(管理令牌本身)—— 撤销和重发永远在用户手里。

## 技术栈

Cloudflare Workers · D1 · R2 · Vue 3 · Tailwind CSS 4 · Vite · OpenAPI 3.1 · Anthropic Skills

后端分 `api → service → repository` 三层。所有私密配置集中在 gitignore 的 `wrangler.jsonc` 里。Skill 包由 `scripts/build-skill.mjs` 在构建前自动打成 zip。

## 自己部署一份

你需要:**Cloudflare 账号**、**Google 账号**、**Node 20.19+**。

```bash
git clone https://github.com/valueriver/mindbase
cd mindbase && npm install

# 1. 建 D1 + R2(记住返回的 database_id)
npx wrangler d1 create mindbase
npx wrangler r2 bucket create mindbase-images

# 2. 建 Google OAuth Client ID
#    https://console.cloud.google.com/apis/credentials
#    类型选 Web application,"Authorized JavaScript origins" 加 http://localhost:5173 和你的线上域名

# 3. 填配置
cp wrangler.example.jsonc wrangler.jsonc
# 改里面的 account_id / database_id / GOOGLE_CLIENT_ID / JWT_SECRET(随机长串)
# 不绑自定义域名就把 routes 段删掉

# 4. 建表
npx wrangler d1 execute mindbase --remote --file=mindbase.sql --yes

# 5. 部署
npm run deploy
```

本地跑 `npm run dev`,开 <http://localhost:5173>。

更详细的说明见 [`wrangler.example.jsonc`](./wrangler.example.jsonc) 里的注释。

## License

[MIT](./LICENSE)

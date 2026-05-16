# MindBase

**同步你和 AI 的上下文。**

把记忆从抽象的数据变成自然的形状,每个应用就是你生活的一面 —— 你看见,AI 也看见。

---

## 🏠 自建

依托 **Cloudflare Workers + D1**,跑在你自己的账号下。

- **几乎零成本** —— 个人使用规模下 CF 的免费额度完全够用
- **30 天时间点恢复** —— D1 内建 point-in-time recovery,误删不怕
- **数据永远在你手上** —— 一行 `wrangler d1 export` 整库带走,SQL 文件去哪都能进
- **开源、自部署** —— 代码 MIT,你的 token、你的 JWT secret、你的钥匙

---

## 🌱 自然

记忆不再是一条一条扁平的数据。每个应用都**具备它本该有的形状、交互和功能** —— 你看见就知道它是什么,不需要翻译字段。

- 🎬 电影是 2:3 海报方块 —— 一眼就是电影
- 📖 书是书脊 —— 一眼就是书
- 💳 银行卡是 `**** **** **** 1234` —— 一眼就是卡
- 🎯 目标是进度条 + 大圆 "+1" 按钮
- 🖼️ 影集是照片网格
- 🔐 密码是 `•••` mask + "显示" 按钮
- 💰 记账是 `+` 绿 / `−` 红 + ¥ 数字

**眼睛 = 大脑,没有翻译那一步。**

目前内置 40+ 个应用,按生活类别归组:

| 类别 | 应用 |
|---|---|
| 🌊 **流水** | 主页 · ✅ 待办 · 💰 记账 · 📅 日程 · 🕰️ 回忆 · ❤️ 健康 |
| 📝 **内容** | 📚 笔记 · 🪟 网页 · 📜 指令集 · ✍️ 文章 |
| 🎬 **品味** | 电影 · 📖 书单 · 🎵 音乐 · 🎮 游戏 · 🎨 展览 · 🎤 演唱会 |
| 🍳 **生活** | 菜谱 · 🖼️ 影集 · 🗺️ 足迹 · ✈️ 旅行 · 📂 项目 · 🎯 目标 · 🎁 心愿单 |
| 💎 **资产** | 资产 · 💳 银行卡 · 💸 订阅 · 📘 说明书 · 💻 设备 · 🛂 证件库 · 🌐 域名 |
| 🪪 **身份** | 个人档 · 📄 简历 · 👥 通讯录 · 📧 邮箱 · 🆔 网络账号 |
| 🔐 **凭据** | 密码箱 · 🔑 API · 🤖 大模型 · 🖥️ 服务器 |
| ⚙️ **系统** | 💬 对话 · 🔗 协作 · 设置 |

---

## 🔄 同步

一份数据,**所有 AI 共用** —— 聊任何话题都不丢上下文。

### 内置助理(产品里的"对话")

D1 直连,**只有一把工具:`sql_query`**。它能聚合("上个月外卖花了多少")、跨应用整理("把今天主页帖子整理成笔记")、批量更新 —— 所有 SQL 在对话里展开可见,主动访问是可观测的。OpenAI 兼容,任何 base URL 都能填(DeepSeek / SiliconFlow / 自部署 vLLM)。

### 外部 AI(Claude Code / Codex / ChatGPT / Cursor / Cline …)

`设置 → 协作` 一键开启,拿到一把 `mb_` token。两种接入:

- **Anthropic Skill(长期使用)** —— 下载 zip,放进 AI 运行时的 skills 目录,这个 AI 长期就"会用" MindBase。
  ```
  https://github.com/realuckyang/mindbase/raw/main/mindbase.zip
  ```
  - Claude Code: `~/.claude/skills/mindbase/`
  - 其它支持 Anthropic Skills 的工具:查它各自的 skills 路径

- **OpenAPI 3.1(零安装)** —— 把 schema URL + token 粘进 ChatGPT / 任何支持 OpenAPI 的 AI,30 秒接入,AI 自己读 schema 干活。

同一把 token,N 个 AI 共用同一份事实。

---

## 🛠️ 创造

**生活在长,应用在长**。

仓库根的 `AGENTS.md` 30 行讲清楚"加一个新应用"的契约:5 个文件丢一捆,3 处中央注册表改一下,就接入了。

最高效用法 —— 把 mindbase clone 到本地,告诉 Codex 或 Claude Code:

> "按 AGENTS.md 加一个 plants 应用,记我的多肉:名字、买入日期、上次浇水、备注。"

10 分钟后跑 `npm run deploy`,你自己的 MindBase 就多了一面。AI 也立刻看得见 —— 因为表叫 `app_plants_items`,自动落进它的视野规则(`app_<name>_*` 表前缀决定 AI 视野)。

---

## 🚀 自己部署一份

需要:**Cloudflare 账号**、**Node 22+**

```bash
git clone https://github.com/realuckyang/mindbase
cd mindbase && npm install

# 1. 建 D1 + R2
npx wrangler d1 create mindbase
npx wrangler r2 bucket create mindbase

# 2. 填配置
cp wrangler.example.jsonc wrangler.jsonc
# 改 account_id / database_id / JWT_SECRET(随便生成一串长字符串)

# 3. 建表(单一 SQL 文件,所有应用拼一起)
npx wrangler d1 execute mindbase --remote --file=mindbase.sql --yes

# 4. 部署
npm run deploy
```

第一次访问让你 setup 用户名 + 密码(存进你自己 D1,PBKDF2 哈希),之后用密码登录。

备份整库:

```bash
npx wrangler d1 export mindbase --remote --output backup-$(date +%Y%m%d).sql
```

---

## 🧱 技术栈

| 层 | 用了什么 |
|---|---|
| 运行时 | Cloudflare Workers |
| 存储 | D1 (SQLite) + R2 (图片) |
| 鉴权 | PBKDF2 + HS256 JWT cookie(180 天) |
| 前端 | Vue 3 + Vite + Tailwind v4 |
| AI | OpenAI 兼容 Chat Completions + 流式 + 工具调用 |
| 标准 | OpenAPI 3.1 + Anthropic Skills |

后端 `apps/<name>/` 一捆 `{api, service, repository, schema}`;`lib/` 装跨切的 auth / utils / events 等。

```
mindbase/
  mindbase.sql              auto-generated,build-schema 从各 app 拼起来
  AGENTS.md                 给 AI 加应用的契约
  server/
    index.js                Worker 入口
    router.js               /api/<name> 统一分发
    lib/                    auth / utils / events
    apps/<name>/            每应用一捆
  gui/
    main.js  App.vue  router.js  api.js
    components/             AppShell / Popover / Cover / ...
    apps/<name>/            每应用一个 index.vue
  skills/mindbase/          打成根目录 mindbase.zip 的 SKILL.md 源
```

---

## License

[MIT](./LICENSE) —— 拿去改、拿去用,觉得有用 ⭐ 一下。

# MindBase

**自建你和 AI 共同的上下文。**

把记忆从一锅炖,拆成生活的形状。钱归"记账",书归"书单",看过的展览归"展览",在用的服务器归"服务器" —— 每个应用就是你生活的一面。你看见,AI 也看见。

---

## 四个关键词

> 🏠 **自建** —— 数据全在你的 Cloudflare 账号下,一行 `wrangler d1 export` 整库带走。
> 🌱 **自然** —— 应用的名字、形状、交互,都跟你脑子里本来就有的对得上,不需要翻译。
> 🔄 **同步** —— 内置助理 + 外部 AI(Skill / OpenAPI)看同一份事实,聊任何话题都不丢上下文。
> 🛠️ **创造** —— 生活在长,应用在长。`AGENTS.md` 30 行讲完怎么让 Claude Code 替你加新应用。

---

## 🧠 为什么这么做

主流 AI "记忆" 把你的笔记、想法、偏好,**全部压成文本或向量**,丢进黑箱,AI 偶尔摸点东西出来。你看不见、改不动,信不信全凭感觉。

MindBase 走反方向 —— 每个生活面独立成应用 + 独立表 + 独立 UI。AI 通过 SQL 读 `app_<name>_*` 表前缀,你通过 UI 读写。看见的就是它是什么,**没有翻译那一步**。

> 🎯 AI 时代的记忆不是 AI 的事,是你的事。
> 你的生活本来就有形状。MindBase 把这些形状还给你,顺便让 AI 看见。

---

## 🌊 主页 = 一条时间轴

主页是入口,也是你和 AI 的会合点。

- **手写帖子**(`app_home_posts`):像微博一样的小卡,记一句话、贴张图,AI 也可以替你写(`author` 字段标作者:`user` / `claude-code` / `codex` / `cursor` 等)。
- **应用事件**(`app_home_events`):各应用在关键动作后由后端 `emitHomeEvent()` 写一条,例如"记了一笔咖啡 ¥18"、"读完《XX》"、"目标 +1"。

两条流合并按时间排序,按"今天 / 昨天 / 之前"分组渲染。一眼就知道这一天过得怎么样,AI 也用同一个视角理解你。

**隐私边界**:密码箱 / 银行卡 / 证件库 / API key / 大模型 key / 网络账号 / 邮箱 不冒泡事件,只在自己的应用里。

---

## 🧩 40+ 应用(自然)

每个应用对应你生活的一面。表名带 `app_<name>_*` 前缀,AI 一眼扫到所有"上下文"。

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

每个应用的形状都不一样 —— 电影是海报、书是书脊、银行卡是 `**** 1234`、目标是进度条 + "+1"、密码是 `•••` mask、照片是网格。**眼睛 = 大脑,没有翻译。**

---

## 🔄 同步(对话 + 协作)

> 一份数据,两种用法:在产品里跟内置助理对话,或把 token 给到外部 AI。

### 内置助理(对话)

进 `对话` 模块,填 OpenAI 兼容的 base URL / API key / model(DeepSeek / SiliconFlow / 自部署 vLLM 都行)。

内置助理拿到 D1 直连,**只有一把工具:`sql_query`**。它能聚合("上个月外卖花了多少")、跨应用整理("把今天主页帖子整理成笔记")、批量更新 —— 所有 SQL 在对话里展开可见,**主动访问是可观测的**。

### 外部协作(token)

`设置 → 协作` 一键开启,拿到一把 `mb_` 开头的 token,把 Base URL + token 给到任意外部 AI:

- **粘消息给在线 AI** —— 复制快捷消息,粘到 ChatGPT / Claude / Gemini 任意聊天框,AI 自己 fetch OpenAPI schema 干活。
- **装技能包(长期使用)** —— 从 GitHub raw 下载:
  ```
  https://github.com/realuckyang/mindbase/raw/main/mindbase.zip
  ```
  解压到 AI 运行时 skills 目录:
  - Claude Code: `~/.claude/skills/mindbase/`
  - 其它支持 Anthropic Skills 的工具:查它各自的 skills 路径

  zip 不含任何凭证,装好后用你的 Base URL + token 配上即可。

外部 AI 走标准 REST(`/api/<name>` CRUD),完整 schema 在 `/api/ai/openapi.json`,高频应用精挑出来了,完整清单走 SQL 自发现。

---

## 🛠️ 创造(自己加应用)

`AGENTS.md` 写明了"加一个新应用"的契约:5 个文件丢一捆,3 处中央注册表改一下,就接入了。

```
server/apps/<name>/{schema.sql, repository.js, service.js, api.js}
gui/apps/<name>/index.vue
+ server/router.js · gui/router.js · gui/components/AppShell.vue
```

最高效用法:把 mindbase clone 到本地,告诉 Claude Code:

> "按 AGENTS.md 加一个 plants 应用,记我的多肉:名字、买入日期、上次浇水、备注。"

10 分钟后跑 `npm run deploy`,你自己的 MindBase 就多了一面。AI 也立刻看得见 —— 因为表叫 `app_plants_items`,自动落进它的视野规则。

---

## 🏠 自建(自己部署)

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

### 备份

```bash
npx wrangler d1 export mindbase --remote --output backup-$(date +%Y%m%d).sql
```

整库一个 SQL 文件,导出来想干嘛干嘛。

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

后端 `apps/<name>/` 一捆 `{api, service, repository, schema}`;`lib/` 装跨切的 auth / utils / events 等。单一约束:**`app_<name>_*` 表前缀决定 AI 视野**。

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

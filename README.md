# MindBase

**同步你和 AI 的上下文。**

---

## 这是一个什么样的产品

主流的 AI "记忆" 是这样工作的:把你的笔记、想法、偏好,**全部压成一段文本或向量**,丢给一个黑箱,AI 偶尔从里面摸点东西出来。你看不见、改不动,信不信全凭感觉。

MindBase 走反方向 —— **把记忆从一锅炖,拆成生活的形状**。

钱归"记账",书归"书单",看过的展览归"展览",在用的服务器归"服务器",每一个应用就是你生活的一面。AI 不再"语义摸索",而是用 SQL **看见**每一张表、每一条记录。你也看见。

> 🎯 **AI 时代的记忆不是 AI 的事,是你的事。**
> 你的生活本来就有形状。MindBase 把这些形状还给你,顺便让 AI 看见。
> **你看见什么,就是它是什么。**

---

## 两条产品原则

### 1. 形状即意义

Notion / 通用数据库的所有数据都长一样 —— 你必须读字段名才知道"这是什么"。MindBase 不这样:

- 🎬 电影是 **2:3 海报方块** —— 一眼就是电影
- 📖 书是 **2:3 书脊** —— 一眼就是书
- 💳 银行卡是 **`**** **** **** 1234`** —— 一眼就是卡
- 🎯 目标是 **进度条 + 大圆 "+1" 按钮**
- 🔐 密码是 **`•••` mask + "显示密码"**
- 🖼️ 影集是 **照片网格**
- 💰 记账是 **+ 绿 / − 红 + ¥ 数字**

眼睛 = 大脑,**没有翻译那一步**。

### 2. 自然的存在,自然的名字,应有的形状、交互、功能

每个应用要满足两层:

- **自然**(决定要不要做):用户脑中本来就有的概念才做("书"是有的,"内容容器"不是)
- **应有**(决定怎么做):形状、交互、功能要一次给对(电影必须有海报,银行卡必须 mask,密码必须默认隐藏)

---

## 应用清单(40+)

每个应用对应你生活的一面。表名带 `app_<name>_*` 前缀,AI 一眼就能扫到所有"上下文"。

| 类别 | 应用 |
|---|---|
| **流水** | 🌊 动态 · ✅ 待办 · 💰 记账 · 📅 日程 · 🕰️ 回忆 · ❤️ 健康 |
| **内容** | 📚 笔记 · 🪟 网页 · 📜 指令集 · ✍️ 文章 |
| **品味** | 🎬 电影 · 📖 书单 · 🎵 音乐 · 🎮 游戏 · 🎨 展览 · 🎤 演唱会 |
| **生活** | 🍳 菜谱 · 🖼️ 影集 · 🗺️ 足迹 · ✈️ 旅行 · 📂 项目 · 🎯 目标 · 🎁 心愿单 |
| **资产** | 💎 资产 · 💳 银行卡 · 💸 订阅 · 📘 说明书 · 💻 设备 · 🛂 证件库 · 🌐 域名 |
| **身份** | 🪪 个人档 · 📄 简历 · 👥 通讯录 · 📧 邮箱 · 🆔 网络账号 |
| **凭据** | 🔐 密码箱 · 🔑 API · 🤖 大模型 · 🖥️ 服务器 |
| **系统** | 💬 对话 · 🔗 协作 · ⚙️ 设置 |

不是固定清单。你可以**自己加新应用** —— 见下面"自定义应用"。

---

## 三种用 AI 的方式

`设置 → 协作` 一键开启,拿到一把 token 之后:

### 1️⃣ 粘消息给在线 AI(零安装,30 秒)

复制快捷消息,粘到 ChatGPT / Claude / Gemini 任意聊天框 —— AI 自己 fetch OpenAPI schema 干活。

### 2️⃣ 装技能包(长期使用)

下载:

```
https://github.com/realuckyang/mindbase/raw/main/mindbase.zip
```

解压到 AI 运行时的 skills 目录:

- **Claude Code**: `~/.claude/skills/mindbase/`
- **其它支持 Anthropic Skills 的工具**:查它各自的 skills 路径

zip 不含任何凭证,装好后用你的 Base URL + token 配上即可。

### 3️⃣ 内嵌助理

进 `对话` 模块,填好 OpenAI 兼容的 base URL / API key / model(支持 DeepSeek / SiliconFlow / 自部署 vLLM 等任何兼容端点)。

内嵌助理拿到 D1 直连,**只有一把工具:`sql_query`**。它能聚合("上个月外卖花了多少")、跨应用整理("把今天动态整理成笔记")、批量更新 —— 所有 SQL 在对话里展开可见,**主动访问是可观测的**。

---

## 自定义应用

仓库根目录的 `AGENTS.md` 写明了"加一个新应用"的契约(后端 5 步、前端 4 步)。最高效用法:把 mindbase clone 到本地,告诉 Claude Code:

> "按 AGENTS.md 加一个 plants 应用,记我的多肉:名字、买入日期、上次浇水、备注。"

10 分钟后跑 `npm run deploy`,你自己的 MindBase 就多了一面。AI 也立刻看得见 —— 因为表叫 `app_plants_items`,自动落进它的视野规则。

---

## 自己部署一份

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

# 3. 建表
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

## 技术栈

| 层 | 用了什么 |
|---|---|
| 运行时 | Cloudflare Workers |
| 存储 | D1 (SQLite) + R2 (图片) |
| 鉴权 | PBKDF2 + HS256 JWT cookie(180 天) |
| 前端 | Vue 3 + Vite + Tailwind v4 |
| AI | OpenAI 兼容 Chat Completions + 流式 + 工具调用 |
| 标准 | OpenAPI 3.1 + Anthropic Skills |

后端 `apps/<name>/` 一捆 `{api, service, repository, schema}`;`system/` 装跨切的 auth / utils / image / search 等。单一约束:**`app_<name>_*` 表前缀决定 AI 视野**。

```
mindbase/
  mindbase.sql              auto-generated,build-schema 从各 app 拼起来
  AGENTS.md                 给 AI 加应用的契约
  server/
    index.js                Worker 入口
    router.js               /api/<name> 统一分发
    lib/                    auth / utils
    system/                 user / image / search / openapi(平台 HTTP 模块)
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

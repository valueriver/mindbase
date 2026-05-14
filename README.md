# MindBase

**你的私有个人知识库。**

📝 笔记 · 想法 · 待办 · 记账 · 记忆 · 助理  
📦 数据全在你自己 Cloudflare 账号下,一份 SQLite 文件,可以随时下载备份  
🤖 接入任何 AI(ChatGPT / Claude / Gemini …),它能直接读写你的数据


---

## 长什么样

<table>
<tr>
  <td width="50%">
    <img src="https://i.mindbase.me/screenshots/v2/01-launcher.png" alt="应用切换面板"/>
    <p align="center"><sub>七个模块,各做一件事</sub></p>
  </td>
  <td width="50%">
    <img src="https://i.mindbase.me/screenshots/v2/02-memos.png" alt="想法"/>
    <p align="center"><sub>💡 想法 —— 心里想到的,顺手记一下</sub></p>
  </td>
</tr>
<tr>
  <td width="50%">
    <img src="https://i.mindbase.me/screenshots/v2/03-todos.png" alt="待办"/>
    <p align="center"><sub>✅ 待办 —— 要做的事,一项一项完成</sub></p>
  </td>
  <td width="50%">
    <img src="https://i.mindbase.me/screenshots/v2/04-notes.png" alt="笔记"/>
    <p align="center"><sub>📚 笔记 —— 无限嵌套笔记本,Notion 风可定制图标和封面</sub></p>
  </td>
</tr>
<tr>
  <td width="50%">
    <img src="https://i.mindbase.me/screenshots/v2/05-ledger.png" alt="记账"/>
    <p align="center"><sub>💰 记账 —— 逐笔记录的收支,助理可以查询统计</sub></p>
  </td>
  <td width="50%">
    <img src="https://i.mindbase.me/screenshots/v2/06-memory.png" alt="记忆"/>
    <p align="center"><sub>🧠 记忆 —— 希望助理始终记得的事情,三档可见性</sub></p>
  </td>
</tr>
<tr>
  <td width="50%">
    <img src="https://i.mindbase.me/screenshots/v2/07-search.png" alt="搜索"/>
    <p align="center"><sub>🔍 搜索 —— 笔记、想法、记账,一处查找</sub></p>
  </td>
  <td width="50%">
    <img src="https://i.mindbase.me/screenshots/v2/08-assistant.png" alt="助理"/>
    <p align="center"><sub>💬 助理 —— 接入任何大模型,带工具直查 D1</sub></p>
  </td>
</tr>
</table>

---

## 为什么再做一个

| 别人 | MindBase |
|---|---|
| 云笔记 SaaS | **单人单机自部署**,数据在你自己的 Cloudflare 账号里 |
| 向量数据库 + RAG | 助理直接 SQL,因为表清晰、量小,SQL 就是最自然的查询语言 |
| 多用户协同 | **一个人用**,没有用户系统,没有分享,没有权限管理 |
| 一个工具一个 app | 笔记、待办、记账、记忆、想法 **共用一份 SQLite**,助理一次能看全 |

设计哲学一句话:**数据握在自己手里,AI 像你一样翻这些数据。**

---

## 每个模块

| 模块 | 一句话 |
|---|---|
| 💬 **助理** | 接入任意大模型,带 `sql_query` 工具,可以直接读写你的库 |
| 💡 **想法** | 时间线随手记,⌘ + Enter 记下,⌘ + V 粘截图 |
| ✅ **待办** | 单一任务清单 |
| 📚 **笔记** | 无限嵌套笔记本,自定义 emoji 图标 + 8 张预置封面 + 自上传封面;Notion 式编辑器(H1/H2/H3/粗斜体);三种拖动:重排 / 嵌套 / 跨级移动 |
| 💰 **记账** | 收支流水,按日分组,月度统计,分类自动补全 |
| 🧠 **记忆** | 给助理看的长期上下文。三档可见性: |
|   |   · **count** —— 只让助理知道"有 N 条记忆" |
|   |   · **summary** —— 注入标题 + 描述,内容隐藏 |
|   |   · **full** —— 全部注入 |
| 🔍 **搜索** | 一处查找所有模块的内容 |

---

## AI 怎么接进来

`设置 → 协作` 一键开启,拿到一把 token + 一段快捷消息。两种用法:

### 1. 粘给在线 AI(零安装)

复制快捷消息,粘到 ChatGPT / Claude / Gemini 等任意聊天框 —— AI 自己 fetch schema 干活。30 秒搞定。

### 2. 装技能包(Anthropic Skills,长期使用)

下载 `mindbase-skill.zip`,放进 AI 运行时的 skills 目录:

- **Claude Code**: `~/.claude/skills/mindbase/`
- **其它支持 Skills 的工具**(Claude Desktop / Cursor 扩展 / Cline / 自建 agent 框架等):查它各自的 skills 路径

底层是 OpenAPI 3.1 schema(`/api/ai/openapi.json`),GPT Actions / Claude Custom Connector / 任何支持 OpenAPI 的工具都能 import。

AI 拿到**读 + 写**所有数据的权限,token 一旦泄漏立刻在「协作」里关掉即作废。

---

## 自己部署一份

需要:**Cloudflare 账号**、**Node 22+**

```bash
git clone https://github.com/realuckyang/mindbase
cd mindbase && npm install

# 1. 建 D1 + R2(记下返回的 database_id)
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

打开你的 Workers 域名,第一次访问会让你创建账号(用户名 + 密码,存进你自己的 D1,PBKDF2 哈希)。之后用密码登录,session 是 HS256 JWT(签名 key 就是 `JWT_SECRET`)。

本地开发 `npm run dev`,打开 <http://localhost:5173>。

### 备份你的数据

```bash
npx wrangler d1 export mindbase --remote --output backup-$(date +%Y%m%d).sql
```

整份数据库就是一个 SQL 文件,导出来想干嘛干嘛。

---

## 技术栈

| 层 | 用了什么 |
|---|---|
| 运行时 | Cloudflare Workers(边缘 fetch handler) |
| 存储 | D1(SQLite)+ R2(图片)|
| 鉴权 | PBKDF2 哈希密码,HS256 JWT cookie,180 天过期 |
| 前端 | Vue 3 + Vite + Tailwind CSS v4 + `@cloudflare/vite-plugin` |
| AI | OpenAI 兼容 Chat Completions 接口(任意 base url),流式 + 工具调用 |
| 标准 | OpenAPI 3.1(外部 AI 接入)· Anthropic Skills(技能包格式) |

后端 `api → service → repository` 三层。所有配置在 `wrangler.jsonc`(gitignore),private 值不进 bundle。

---

## 项目结构

```
mindbase/
  mindbase.sql              单一事实源,所有表的 DDL
  migrations/               schema 演进的增量 SQL
  server/
    api/                    HTTP 路由,只做参数校验 + 转发
    service/                业务流程编排 + 鉴权
      prompt/               助理系统提示词组装器(环境 / 模型 / 记忆)
    repository/             D1 SQL
    domain/auth/            JWT + PBKDF2 + API token
    ai/                     LLM 调用 + 工具循环
    llm/                    多 provider 适配(OpenAI 兼容 + 自定义)
  src/
    views/                  每个模块一个顶层 .vue
    components/             共享组件(emoji picker / 封面 / popover / 编辑器…)
    lib/, api/, composables/, router/
  skills/mindbase/          打成 zip 给外部 AI 装的 SKILL.md
```

---

## License

[MIT](./LICENSE) —— 拿去改、拿去用,觉得有用 ⭐ 一下。

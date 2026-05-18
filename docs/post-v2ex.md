# MindBase —— 开源的记忆中心，同步你与 AI 的上下文

GitHub: https://github.com/realuckyang/mindbase
官网: https://mindbase.me

---

MindBase 是一个开源的记忆中心——同步你与 AI 的上下文。

🤖 **AI 互通** — 内置可查询数据的 agent，兼容大多数模型与市面上的各种 coding plan。同时提供 OpenAPI、MCP、Skill 三种方式打通你与 code agent 的互通——你的 code agent 在工作中能了解你的上下文，记录做过什么，积累经验，更新项目状态，记住你的偏好等。

🌱 **记忆有形状** — 记忆不是一条条抽象的数据，而是有自己形状、自己交互、自己功能的应用。内置 12 个应用，另有 40+ 免费模板可选，你还可以让 AI 快速开发属于你的记忆应用。

☁️ **数据在你手里** — 快速部署在 Cloudflare 上，底层依托 Workers、D1、R2，免费额度足够日常使用。D1 内建 30 天时间点恢复，兜住 AI 误操作，让你更放心地让 AI 读写你的数据。

---

## 截图

<table>
  <tr>
    <td width="33%"><img src="https://github.com/realuckyang/mindbase/raw/main/docs/screenshots/notes.png" alt="笔记" /></td>
    <td width="33%"><img src="https://github.com/realuckyang/mindbase/raw/main/docs/screenshots/llms.png" alt="大模型" /></td>
    <td width="33%"><img src="https://github.com/realuckyang/mindbase/raw/main/docs/screenshots/footprints.png" alt="足迹" /></td>
  </tr>
</table>

<table>
  <tr>
    <td width="33%"><img src="https://github.com/realuckyang/mindbase/raw/main/docs/screenshots/chat-sql-query.png" alt="对话" /></td>
    <td width="33%"><img src="https://github.com/realuckyang/mindbase/raw/main/docs/screenshots/collab-skill.png" alt="协作" /></td>
    <td width="33%"><img src="https://github.com/realuckyang/mindbase/raw/main/docs/screenshots/prompts.png" alt="指令集" /></td>
  </tr>
</table>

---

## 应用

预置 12 个：主页 · 待办 · 笔记 · 记账 · 项目 · 个人档 · 大模型 · 指令集 · API · 邮箱 · 域名 · 足迹

另有 40+ 免费模板可在 [mindbase.me](https://mindbase.me) 下载安装。模板里没有的，在「设置 → 新建应用」写下需求，自动拼出完整指令，交给 Claude Code 或 Codex 跑 `npm run deploy` 即可上线。

---

## 部署

Cloudflare 账号 + Node 22+：

```bash
git clone https://github.com/realuckyang/mindbase
cd mindbase && npm install
npx wrangler d1 create mindbase
npx wrangler r2 bucket create mindbase
cp wrangler.example.jsonc wrangler.jsonc
npx wrangler d1 execute mindbase --remote --file=schema.sql --yes
npm run deploy
```

也可以把 README 丢给 Claude Code / Codex 一句话部署。

---

MIT 开源，欢迎试用和反馈。

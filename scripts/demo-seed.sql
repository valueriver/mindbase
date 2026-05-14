-- MindBase 演示数据。本地试玩 / 截图用。
-- 应用方式:wrangler d1 execute mindbase --local --file=scripts/demo-seed.sql
-- 前置:已经跑过 mindbase.sql 建好表。

-- ============ 笔记本 ============
INSERT INTO notebooks (id, parent_id, name, icon, cover, sort_order, created_at, updated_at) VALUES
  ('nb_journal',  NULL,         '日志',     '🗓️',  'preset:3', 1, datetime('now','-20 days'), datetime('now','-1 day')),
  ('nb_project',  NULL,         '项目',     '🚀',  NULL,       2, datetime('now','-18 days'), datetime('now','-2 days')),
  ('nb_learning', NULL,         '学习',     '📖',  'preset:5', 3, datetime('now','-15 days'), datetime('now','-3 days')),
  ('nb_resource', NULL,         '资源',     '🗂',  NULL,       4, datetime('now','-10 days'), datetime('now','-5 days')),
  ('nb_p_mb',     'nb_project', 'MindBase', NULL, NULL,        1, datetime('now','-17 days'), datetime('now','-2 days')),
  ('nb_p_ag',     'nb_project', 'AGENT',    NULL, NULL,        2, datetime('now','-12 days'), datetime('now','-4 days'));

-- ============ 笔记 ============
INSERT INTO notes (id, notebook_id, title, content, icon, sort_order, created_at, updated_at) VALUES
  ('n_home', NULL, 'MindBase 是什么',
   '<h1>愿景</h1><div>把数据握在自己手里 —— 笔记 / 想法 / 待办 / 记账 / 给 AI 的长期记忆,全部塞在一份 SQLite 里。</div><div><br></div><div>跑在 Cloudflare Workers,部署一次,自有自管。</div><h2>它不是什么</h2><div>不是另一个 Notion 克隆,不是云笔记 SaaS。它是一个<strong>给一个人用</strong>的工具。</div>',
   '🧠', 1, datetime('now','-19 days'), datetime('now','-3 hours')),

  ('n_diary_today', 'nb_journal', '今天 · 2026-05-14',
   '<h2>早晨</h2><div>把记账模块上线了,UI 跟其它模块保持一致。</div><h2>下午</h2><div>问助理"上个月在外卖花了多少",一秒给答案 —— 这种感觉太爽了。</div><h2>晚上</h2><div>把 readme 重写,顺便写一篇关于 MindBase 设计哲学的文章。</div>',
   '☀️', 1, datetime('now'), datetime('now')),

  ('n_diary_2', 'nb_journal', '昨天 · 2026-05-13',
   '<div>开始把硬编码的系统提示词迁到 DB,以后用户可以自己改。</div><div>顺手把 messages 表里从来没用的 memo / usage 列也清了 —— 早期没想清楚就加上的字段。</div>',
   '🌧', 2, datetime('now','-1 day'), datetime('now','-1 day')),

  ('n_mb_arch', 'nb_p_mb', '架构纸面化',
   '<h1>三层</h1><div><strong>Worker</strong> —— fetch handler,/api/* 路由分发</div><div><strong>D1</strong> —— 一份 SQLite,所有表共用,不分库</div><div><strong>R2</strong> —— 图片附件</div><h1>不用的</h1><div>没有向量数据库、没有 embedding、没有 RAG。</div><div>助理直接 SQL,因为数据就长这样 —— 表清晰、量小,SQL 就是最自然的查询语言。</div>',
   '🏗', 1, datetime('now','-14 days'), datetime('now','-2 days')),

  ('n_mb_three_tier', 'nb_p_mb', '记忆的三档可见性',
   '<h2>动机</h2><div>用户写下的"长期记忆"不一定都要给 AI 看到。有些只是给自己留底。</div><h2>三档</h2><div><strong>count</strong> —— 助理只知道"有 N 条记忆",看不到任何内容</div><div><strong>summary</strong> —— 标题 + 描述可见,正文隐藏</div><div><strong>full</strong> —— 全部注入</div><h2>例子</h2><div>"我的口味偏好"用 full;"我的项目清单"用 summary;身份证 / 工资单用 count。</div>',
   '🪜', 2, datetime('now','-3 days'), datetime('now','-3 days')),

  ('n_ag_skill', 'nb_p_ag', 'Anthropic Skills 是什么',
   '<div>SKILL.md 是一段教 AI 用某个工具的固化指令,带 YAML frontmatter。</div><div>任何支持的 runtime (Claude Code / Cursor / Cline ...) 把 mindbase/ 目录放进它的 skills 路径就行。</div><h2>跟 token 的关系</h2><div>token 解决"能不能进";SKILL 解决"进来之后怎么干"。两者配套。</div>',
   '🎒', 1, datetime('now','-9 days'), datetime('now','-4 days')),

  ('n_learn_d1', 'nb_learning', 'D1 vs 普通 SQLite',
   '<div>D1 是 Cloudflare 边缘 SQLite,异步 prepare/bind/all 接口。</div><div>每条 statement 一次,不能带末尾分号;事务有特定写法 (batch)。</div><div>容量限制 10GB,对个人数据足够用一辈子。</div>',
   '🐘', 1, datetime('now','-13 days'), datetime('now','-5 days')),

  ('n_learn_vue', 'nb_learning', 'Vue 反应性的一个坑',
   '<div>ref([]) 是惰性代理 —— push 进去的裸对象,后续通过"保留的裸引用"改属性<strong>不会触发渲染</strong>。</div><div>修复:创建对象时用 reactive(...) 包,持有的就是 proxy。</div><div>这个坑害我以为是网络流式渲染卡顿,绕了一圈才发现。</div>',
   '🪲', 2, datetime('now','-10 days'), datetime('now','-10 days'));

-- ============ 想法 ============
INSERT INTO memos (id, content, created_at, updated_at) VALUES
  ('m01', '今晚目标:文档全部刷新一遍。', datetime('now','-3 hours'), datetime('now','-3 hours')),
  ('m02', '其实"个人知识库"这词太重了。说"私有数据库"可能更准确。', datetime('now','-1 hour'), datetime('now','-1 hour'));

-- ============ 待办 ============
INSERT INTO todos (id, title, done, sort_order, created_at, updated_at) VALUES
  ('t01', '记账模块上线',                  1, 1, datetime('now','-5 days'),     datetime('now','-2 days')),
  ('t02', '系统提示词从代码迁到 DB',       1, 2, datetime('now','-8 days'),     datetime('now','-7 days')),
  ('t03', '记忆模块三档可见性',           1, 3, datetime('now','-7 days'),     datetime('now','-3 days')),
  ('t04', 'README 全面刷新',              0, 4, datetime('now','-1 day'),      datetime('now','-1 day')),
  ('t05', '写一篇 mindbase 介绍长文',     0, 5, datetime('now','-1 day'),      datetime('now','-1 day')),
  ('t06', '研究 inbox 平台能力的最简实现', 0, 6, datetime('now','-2 days'),     datetime('now','-2 days')),
  ('t07', '生产 D1 备份脚本化',           0, 7, datetime('now','-3 hours'),    datetime('now','-3 hours')),
  ('t08', '想个简洁的 logo',              0, 8, datetime('now','-1 day'),      datetime('now','-1 day'));

-- ============ 记账(本月,2026-05) ============
INSERT INTO ledger (id, type, amount, category, note, happened_at, created_at, updated_at) VALUES
  -- 收入
  ('linc01', 'income',  1500000, '工资',   '5 月工资',     '2026-05-10', datetime('now','-4 days'),  datetime('now','-4 days')),
  ('linc02', 'income',    50000, '理财',   '基金分红',     '2026-05-08', datetime('now','-6 days'),  datetime('now','-6 days')),
  -- 餐饮
  ('lex01', 'expense',  2800, '餐饮',   '楼下面馆',      '2026-05-14', datetime('now','-2 hours'), datetime('now','-2 hours')),
  ('lex02', 'expense',  4500, '餐饮',   '同事聚餐 AA',   '2026-05-13', datetime('now','-1 day'),   datetime('now','-1 day')),
  ('lex03', 'expense',  1800, '餐饮',   '便利店午饭',    '2026-05-12', datetime('now','-2 days'),  datetime('now','-2 days')),
  ('lex04', 'expense',  5600, '餐饮',   '外卖',          '2026-05-11', datetime('now','-3 days'),  datetime('now','-3 days')),
  ('lex05', 'expense',  3500, '餐饮',   '日料定食',      '2026-05-09', datetime('now','-5 days'),  datetime('now','-5 days')),
  ('lex06', 'expense',  2200, '餐饮',   '早餐三件套',    '2026-05-07', datetime('now','-7 days'),  datetime('now','-7 days')),
  -- 交通
  ('lex07', 'expense',  1500, '交通',   '地铁充值',      '2026-05-06', datetime('now','-8 days'),  datetime('now','-8 days')),
  ('lex08', 'expense',  3800, '交通',   '打车回家',      '2026-05-13', datetime('now','-1 day'),   datetime('now','-1 day')),
  -- 购物
  ('lex09', 'expense', 28900, '购物',   '机械键盘',      '2026-05-05', datetime('now','-9 days'),  datetime('now','-9 days')),
  ('lex10', 'expense',  7900, '购物',   '咖啡豆 1kg',    '2026-05-04', datetime('now','-10 days'), datetime('now','-10 days')),
  ('lex11', 'expense', 12000, '购物',   '袜子两双 + 衬衫', '2026-05-12', datetime('now','-2 days'), datetime('now','-2 days')),
  -- 订阅
  ('lex12', 'expense', 12800, '订阅',   'Claude Max',    '2026-05-01', datetime('now','-13 days'), datetime('now','-13 days')),
  ('lex13', 'expense',  6800, '订阅',   '云服务器',      '2026-05-01', datetime('now','-13 days'), datetime('now','-13 days')),
  -- 娱乐
  ('lex14', 'expense',  4500, '娱乐',   '电影 + 爆米花', '2026-05-10', datetime('now','-4 days'),  datetime('now','-4 days')),
  ('lex15', 'expense',  1980, '娱乐',   '游戏 DLC',      '2026-05-07', datetime('now','-7 days'),  datetime('now','-7 days')),
  -- 医疗
  ('lex16', 'expense',  9800, '医疗',   '感冒药 + 维生素', '2026-05-08', datetime('now','-6 days'), datetime('now','-6 days')),
  -- 房租 / 水电
  ('lex17', 'expense', 380000, '房租',  '5 月房租',      '2026-05-01', datetime('now','-13 days'), datetime('now','-13 days')),
  ('lex18', 'expense',  9500, '水电',   '4 月水电',      '2026-05-03', datetime('now','-11 days'), datetime('now','-11 days'));

-- ============ 记忆(三档都覆盖) ============
INSERT INTO memories (title, description, content, visibility, created_at) VALUES
  ('我用 VS Code,不用 Vim', '编辑器偏好',
   '我日常代码在 VS Code 写,Vim 只在远程服务器临时改文件用。建议代码片段时按 VS Code 风格(不要给 Vim 命令)。',
   'full', datetime('now','-15 days')),

  ('我是后端工程师', '职业背景 + 技术栈',
   '主要做 Node.js / TypeScript,有 8 年经验。Cloudflare Workers / D1 / R2 都熟悉。前端能写但不专精,UI 细节经常需要你给方案。',
   'full', datetime('now','-12 days')),

  ('回答要直接,不要兜圈子', '沟通风格',
   '别用"可能"、"也许"、"如果你愿意的话"开头。觉得对就直接说;觉得不对就说为什么不对。',
   'full', datetime('now','-10 days')),

  ('我维护几个开源仓库', '项目清单(只露摘要)',
   '我维护 mindbase、meem、AGENT 这几个仓库,涉及个人知识库 / 本地 AI / agent 工具方向。具体细节按需问我或查 GitHub。',
   'summary', datetime('now','-8 days')),

  ('身份证 / 工资 / 家庭信息', '敏感信息',
   '私人敏感数据。具体内容不放正文里,需要时我会贴。',
   'count', datetime('now','-5 days'));

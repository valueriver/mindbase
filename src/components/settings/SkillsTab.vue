<template>
  <section class="mt-6">
    <section class="rounded-md border border-nt-divider p-4">
      <h2 class="text-sm font-medium text-nt">📦 MindBase 技能包</h2>
      <p class="mt-1 text-xs leading-relaxed text-nt-muted">
        一个 <code class="rounded bg-nt-hover px-1 py-0.5 font-mono">SKILL.md</code> 教 AI 用 MindBase 的 API。
        任何支持
        <a href="https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills" target="_blank" rel="noopener" class="underline hover:text-nt">Anthropic Skills 格式</a>
        的运行时都能装,装好后这个 AI 就长期"会用"MindBase,不用每次重新粘说明。
      </p>

      <div class="mt-3 rounded-md bg-nt-hover/60 px-3 py-2.5 text-xs leading-relaxed text-nt-muted">
        <div class="font-medium text-nt">安装位置</div>
        <ul class="mt-1 space-y-0.5">
          <li>· Claude Code:<code class="ml-1 rounded bg-white px-1 py-0.5 font-mono text-[11px]">~/.claude/skills/mindbase/</code></li>
          <li>· 其它支持 Skills 的工具(Claude Desktop / Cursor 扩展 / Cline / 自建 agent 框架等):把整个 <code class="mx-0.5 rounded bg-white px-1 py-0.5 font-mono text-[11px]">mindbase/</code> 目录放进它自己的 skills 路径,具体路径查工具文档</li>
        </ul>
      </div>

      <a
        href="/skills/mindbase.zip"
        download="mindbase-skill.zip"
        class="mt-4 inline-flex items-center gap-2 rounded-md bg-nt px-4 py-2 text-sm text-white hover:bg-black"
      >⬇ 下载 mindbase-skill.zip</a>

      <p class="mt-3 text-[11px] leading-relaxed text-nt-soft">
        装好之后,回「协作」标签页复制快捷消息粘进 AI —— 它会读到 token 和 SKILL.md,直接接管。
      </p>
    </section>
  </section>
</template>

<script setup>
</script>

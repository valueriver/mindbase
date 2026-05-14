<template>
  <section class="mt-6 space-y-4">
    <div class="flex items-center gap-3">
      <img src="/favicon.svg" alt="" class="h-12 w-12" />
      <div>
        <h2 class="text-lg font-semibold text-nt">MindBase</h2>
        <p class="text-xs text-nt-soft">你的私有个人知识库</p>
      </div>
    </div>

    <p class="text-sm leading-relaxed text-nt-muted">
      MindBase 是一个开源的个人知识库工具,设计目标是单人单机自部署。
      基于 Cloudflare Workers + D1 + R2,部署成本接近零。
      数据完全握在自己手里,助理通过 sql_query 工具直接读写本地数据库,无需任何向量化或第三方服务。
    </p>

    <div class="rounded-md border border-nt-divider p-4">
      <div class="text-xs text-nt-soft">项目地址</div>
      <a
        href="https://github.com/realuckyang/mindbase"
        target="_blank"
        rel="noopener"
        class="mt-1 inline-flex items-center gap-1 text-sm font-medium text-nt-accent hover:underline break-all"
      >
        github.com/realuckyang/mindbase
        <span class="text-xs">↗</span>
      </a>
    </div>

    <p class="text-xs text-nt-soft">
      MIT License · 欢迎 issue / PR / star
    </p>
  </section>
</template>

<script setup>
</script>

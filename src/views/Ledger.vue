<template>
  <div class="min-h-screen">
    <main class="mx-auto w-full max-w-3xl px-4 pt-6 pb-20 md:px-12 md:pt-10">
      <div class="flex items-end justify-between gap-4">
        <div>
          <h1 class="text-3xl md:text-[40px] font-bold leading-tight tracking-tight text-nt">记账</h1>
          <p class="mt-1 text-sm text-nt-soft">个人收支流水。问助理"上个月外卖花了多少",它能直接查。</p>
        </div>
        <router-link
          :to="{ name: 'ledger-new' }"
          class="shrink-0 rounded-md bg-nt px-3 py-1.5 text-sm text-white hover:bg-nt-strong"
        >＋ 记一笔</router-link>
      </div>

      <!-- 月份选择 + 三块统计 -->
      <div class="mt-6 flex items-center gap-3 text-sm">
        <input
          v-model="month"
          type="month"
          class="rounded border border-nt-divider bg-white px-2 py-1 text-sm text-nt outline-none focus:border-nt-accent"
        />
        <span class="text-xs text-nt-soft">月度统计</span>
      </div>

      <div class="mt-3 grid grid-cols-3 gap-3 text-center">
        <div class="rounded-md border border-nt-divider bg-white px-3 py-3">
          <div class="text-[11px] text-nt-soft">支出</div>
          <div class="mt-0.5 text-lg font-semibold tabular-nums text-nt-danger">¥ {{ fmt(stats.expense) }}</div>
        </div>
        <div class="rounded-md border border-nt-divider bg-white px-3 py-3">
          <div class="text-[11px] text-nt-soft">收入</div>
          <div class="mt-0.5 text-lg font-semibold tabular-nums text-emerald-700">¥ {{ fmt(stats.income) }}</div>
        </div>
        <div class="rounded-md border border-nt-divider bg-white px-3 py-3">
          <div class="text-[11px] text-nt-soft">结余</div>
          <div class="mt-0.5 text-lg font-semibold tabular-nums" :class="stats.balance >= 0 ? 'text-nt' : 'text-nt-danger'">
            {{ stats.balance >= 0 ? '+' : '−' }}¥ {{ fmt(Math.abs(stats.balance)) }}
          </div>
        </div>
      </div>

      <!-- 列表 -->
      <div v-if="error" class="mt-6 rounded border border-nt-danger/30 bg-nt-danger/5 px-3 py-2 text-sm text-nt-danger">{{ error }}</div>

      <div v-if="loading && !items.length" class="mt-10 text-center text-sm text-nt-soft">加载中…</div>

      <div v-else-if="!items.length" class="mt-10 text-center text-sm text-nt-soft">
        本月还没有记录 —— 点右上角「记一笔」加一条。
      </div>

      <div v-else class="mt-6 space-y-5">
        <section v-for="group in groupedItems" :key="group.date">
          <div class="mb-2 flex items-baseline justify-between text-xs text-nt-soft">
            <span>{{ group.date }}</span>
            <span class="tabular-nums">
              <span v-if="group.income" class="text-emerald-700">+¥{{ fmt(group.income) }}</span>
              <span v-if="group.income && group.expense" class="text-nt-hint mx-1">·</span>
              <span v-if="group.expense" class="text-nt-danger">−¥{{ fmt(group.expense) }}</span>
            </span>
          </div>
          <ul class="divide-y divide-nt-divider rounded-md border border-nt-divider bg-white">
            <li
              v-for="it in group.items"
              :key="it.id"
              class="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-nt-hover"
              @click="open(it.id)"
            >
              <span class="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full text-base"
                :class="it.type === 'expense' ? 'bg-nt-danger/10 text-nt-danger' : 'bg-emerald-50 text-emerald-700'"
              >{{ it.type === 'expense' ? '−' : '+' }}</span>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1.5">
                  <span class="truncate text-sm font-medium text-nt">{{ it.category || '未分类' }}</span>
                </div>
                <div v-if="it.note" class="mt-0.5 truncate text-xs text-nt-soft">{{ it.note }}</div>
              </div>
              <span class="shrink-0 text-base font-semibold tabular-nums"
                :class="it.type === 'expense' ? 'text-nt-danger' : 'text-emerald-700'"
              >¥ {{ fmt(it.amount) }}</span>
            </li>
          </ul>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { apiLedger } from '@/api/client'

const router = useRouter()

const now = new Date()
const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

const month   = ref(currentMonth)
const items   = ref([])
const stats   = ref({ expense: 0, income: 0, balance: 0 })
const loading = ref(true)
const error   = ref('')

const fmt = (cents) => (Number(cents || 0) / 100).toFixed(2)

const open = (id) => router.push({ name: 'ledger-edit', params: { id } })

const groupedItems = computed(() => {
  const map = new Map()
  for (const it of items.value) {
    const d = it.happened_at
    if (!map.has(d)) map.set(d, { date: d, items: [], expense: 0, income: 0 })
    const g = map.get(d)
    g.items.push(it)
    if (it.type === 'expense') g.expense += it.amount
    else                       g.income  += it.amount
  }
  return [...map.values()].sort((a, b) => a.date < b.date ? 1 : -1)
})

const refresh = async () => {
  loading.value = true
  error.value = ''
  try {
    const [listRes, statsRes] = await Promise.all([
      apiLedger.list({ month: month.value }),
      apiLedger.stats(month.value),
    ])
    items.value = listRes.items || []
    stats.value = { expense: statsRes.expense, income: statsRes.income, balance: statsRes.balance }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

watch(month, refresh)
onMounted(refresh)
</script>

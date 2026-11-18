<script setup lang="ts">
import { 
  Droplet, 
  Truck, 
  Archive, 
  ArrowUpRight, 
  ArrowDownLeft, 
  TrendingUp 
} from '@lucide/vue'
import { formatLiter, formatRupiah } from '../services/storage'

const props = defineProps<{
  totalLitersCollected: number
  totalLitersSold: number
  currentStockLiters: number
  totalPaidToTenants: number
  totalPendingToTenants: number
  totalRevenueFromVendors: number
  netProfit: number
}>()
</script>

<template>
  <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-3">
    <!-- Card 1: Terkumpul -->
    <div class="bg-white border border-slate-200/90 rounded-lg p-3 sm:p-3.5 transition-colors hover:border-slate-300">
      <div class="flex items-center justify-between text-slate-500 mb-1">
        <span class="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-slate-500 truncate">Terkumpul</span>
        <Droplet class="w-3.5 h-3.5 text-amber-600 shrink-0" />
      </div>
      <p class="text-base sm:text-xl font-bold text-slate-900 tracking-tight">{{ formatLiter(totalLitersCollected) }}</p>
      <p class="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">Dari 6 tenant</p>
    </div>

    <!-- Card 2: Terjual -->
    <div class="bg-white border border-slate-200/90 rounded-lg p-3 sm:p-3.5 transition-colors hover:border-slate-300">
      <div class="flex items-center justify-between text-slate-500 mb-1">
        <span class="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-slate-500 truncate">Terjual</span>
        <Truck class="w-3.5 h-3.5 text-blue-600 shrink-0" />
      </div>
      <p class="text-base sm:text-xl font-bold text-slate-900 tracking-tight">{{ formatLiter(totalLitersSold) }}</p>
      <p class="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">@ Rp 10.500/L</p>
    </div>

    <!-- Card 3: Sisa Stok -->
    <div class="bg-white border border-slate-200/90 rounded-lg p-3 sm:p-3.5 transition-colors hover:border-slate-300">
      <div class="flex items-center justify-between text-slate-500 mb-1">
        <span class="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-slate-500 truncate">Stok Saat Ini</span>
        <Archive class="w-3.5 h-3.5 text-emerald-600 shrink-0" />
      </div>
      <p 
        class="text-base sm:text-xl font-bold tracking-tight truncate"
        :class="currentStockLiters < 0 ? 'text-rose-600' : 'text-slate-900'"
      >
        {{ formatLiter(currentStockLiters) }}
      </p>
      <p class="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">Sisa di jerigen</p>
    </div>

    <!-- Card 4: Biaya ke Tenant -->
    <div class="bg-white border border-slate-200/90 rounded-lg p-3 sm:p-3.5 transition-colors hover:border-slate-300">
      <div class="flex items-center justify-between text-slate-500 mb-1">
        <span class="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-slate-500 truncate">Biaya Tenant</span>
        <ArrowUpRight class="w-3.5 h-3.5 text-rose-500 shrink-0" />
      </div>
      <p class="text-base sm:text-xl font-bold text-slate-900 tracking-tight truncate">
        {{ formatRupiah(totalPaidToTenants + totalPendingToTenants) }}
      </p>
      <div class="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-1">
        <span class="text-emerald-700 font-medium">Lunas: {{ formatRupiah(totalPaidToTenants) }}</span>
        <span v-if="totalPendingToTenants > 0" class="text-amber-700 font-medium">· Tempo: {{ formatRupiah(totalPendingToTenants) }}</span>
      </div>
    </div>

    <!-- Card 5: Pendapatan Vendor -->
    <div class="bg-white border border-slate-200/90 rounded-lg p-3 sm:p-3.5 transition-colors hover:border-slate-300">
      <div class="flex items-center justify-between text-slate-500 mb-1">
        <span class="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-slate-500 truncate">Pendapatan</span>
        <ArrowDownLeft class="w-3.5 h-3.5 text-emerald-600 shrink-0" />
      </div>
      <p class="text-base sm:text-xl font-bold text-emerald-700 tracking-tight truncate">
        {{ formatRupiah(totalRevenueFromVendors) }}
      </p>
      <p class="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">Total dari vendor</p>
    </div>

    <!-- Card 6: Margin Pengelola -->
    <div class="bg-white border border-slate-200/90 rounded-lg p-3 sm:p-3.5 transition-colors hover:border-slate-300">
      <div class="flex items-center justify-between text-slate-500 mb-1">
        <span class="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-slate-500 truncate">Margin</span>
        <TrendingUp class="w-3.5 h-3.5 text-blue-600 shrink-0" />
      </div>
      <p 
        class="text-base sm:text-xl font-bold tracking-tight truncate"
        :class="netProfit >= 0 ? 'text-blue-700' : 'text-rose-600'"
      >
        {{ formatRupiah(netProfit) }}
      </p>
      <p class="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">Laba bersih</p>
    </div>
  </div>
</template>

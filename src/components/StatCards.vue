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
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
    <!-- Card 1: Terkumpul -->
    <div class="bg-white border border-slate-200/90 rounded-lg p-3.5 transition-colors hover:border-slate-300">
      <div class="flex items-center justify-between text-slate-500 mb-1.5">
        <span class="text-[11px] font-medium uppercase tracking-wider text-slate-500">Terkumpul</span>
        <Droplet class="w-3.5 h-3.5 text-amber-600" />
      </div>
      <p class="text-xl font-bold text-slate-900 tracking-tight">{{ formatLiter(totalLitersCollected) }}</p>
      <p class="text-[11px] text-slate-500 mt-1">Setoran dari 6 tenant</p>
    </div>

    <!-- Card 2: Terjual -->
    <div class="bg-white border border-slate-200/90 rounded-lg p-3.5 transition-colors hover:border-slate-300">
      <div class="flex items-center justify-between text-slate-500 mb-1.5">
        <span class="text-[11px] font-medium uppercase tracking-wider text-slate-500">Terjual</span>
        <Truck class="w-3.5 h-3.5 text-blue-600" />
      </div>
      <p class="text-xl font-bold text-slate-900 tracking-tight">{{ formatLiter(totalLitersSold) }}</p>
      <p class="text-[11px] text-slate-500 mt-1">Harga Rp 10.500/L</p>
    </div>

    <!-- Card 3: Sisa Stok -->
    <div class="bg-white border border-slate-200/90 rounded-lg p-3.5 transition-colors hover:border-slate-300">
      <div class="flex items-center justify-between text-slate-500 mb-1.5">
        <span class="text-[11px] font-medium uppercase tracking-wider text-slate-500">Stok Saat Ini</span>
        <Archive class="w-3.5 h-3.5 text-emerald-600" />
      </div>
      <p 
        class="text-xl font-bold tracking-tight"
        :class="currentStockLiters < 0 ? 'text-rose-600' : 'text-slate-900'"
      >
        {{ formatLiter(currentStockLiters) }}
      </p>
      <p class="text-[11px] text-slate-500 mt-1">Di jerigen penampungan</p>
    </div>

    <!-- Card 4: Biaya ke Tenant -->
    <div class="bg-white border border-slate-200/90 rounded-lg p-3.5 transition-colors hover:border-slate-300">
      <div class="flex items-center justify-between text-slate-500 mb-1.5">
        <span class="text-[11px] font-medium uppercase tracking-wider text-slate-500">Biaya Tenant</span>
        <ArrowUpRight class="w-3.5 h-3.5 text-rose-500" />
      </div>
      <p class="text-xl font-bold text-slate-900 tracking-tight">
        {{ formatRupiah(totalPaidToTenants + totalPendingToTenants) }}
      </p>
      <div class="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
        <span class="text-emerald-700 font-medium">Lunas: {{ formatRupiah(totalPaidToTenants) }}</span>
        <span v-if="totalPendingToTenants > 0" class="text-amber-700 font-medium">· Tempo: {{ formatRupiah(totalPendingToTenants) }}</span>
      </div>
    </div>

    <!-- Card 5: Pendapatan Vendor -->
    <div class="bg-white border border-slate-200/90 rounded-lg p-3.5 transition-colors hover:border-slate-300">
      <div class="flex items-center justify-between text-slate-500 mb-1.5">
        <span class="text-[11px] font-medium uppercase tracking-wider text-slate-500">Pendapatan</span>
        <ArrowDownLeft class="w-3.5 h-3.5 text-emerald-600" />
      </div>
      <p class="text-xl font-bold text-emerald-700 tracking-tight">
        {{ formatRupiah(totalRevenueFromVendors) }}
      </p>
      <p class="text-[11px] text-slate-500 mt-1">Total tagihan ke vendor</p>
    </div>

    <!-- Card 6: Margin Pengelola -->
    <div class="bg-white border border-slate-200/90 rounded-lg p-3.5 transition-colors hover:border-slate-300">
      <div class="flex items-center justify-between text-slate-500 mb-1.5">
        <span class="text-[11px] font-medium uppercase tracking-wider text-slate-500">Margin</span>
        <TrendingUp class="w-3.5 h-3.5 text-blue-600" />
      </div>
      <p 
        class="text-xl font-bold tracking-tight"
        :class="netProfit >= 0 ? 'text-blue-700' : 'text-rose-600'"
      >
        {{ formatRupiah(netProfit) }}
      </p>
      <p class="text-[11px] text-slate-500 mt-1">Pendapatan − biaya tenant</p>
    </div>
  </div>
</template>

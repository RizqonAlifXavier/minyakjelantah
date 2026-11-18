<script setup lang="ts">
import { ref, computed } from 'vue'
import { Store, Search, Plus, Download, Edit3, MapPin, Phone, Calendar } from '@lucide/vue'
import type { Tenant, TenantStat } from '../types'
import { formatLiter, formatRupiah, exportToCSV } from '../services/storage'

const props = defineProps<{
  tenantStats: TenantStat[]
}>()

const emit = defineEmits<{
  (e: 'add-deposit-for-tenant', tenant: Tenant): void
  (e: 'edit-tenant', tenant: Tenant): void
  (e: 'add-new-tenant'): void
}>()

const searchQuery = ref('')

const filteredStats = computed(() => {
  if (!searchQuery.value.trim()) return props.tenantStats
  const q = searchQuery.value.toLowerCase()
  return props.tenantStats.filter(s => 
    s.tenant.name.toLowerCase().includes(q) ||
    s.tenant.code.toLowerCase().includes(q) ||
    s.tenant.location.toLowerCase().includes(q)
  )
})

const maxLiters = computed(() => {
  const liters = props.tenantStats.map(s => s.totalLiters)
  return Math.max(...liters, 1)
})

const totalGrandLiters = computed(() => {
  const sum = props.tenantStats.reduce((acc, s) => acc + s.totalLiters, 0)
  return Math.round(sum * 100) / 100
})

const totalGrandPaid = computed(() => {
  return props.tenantStats.reduce((sum, s) => sum + s.totalPaid, 0)
})

const totalGrandPending = computed(() => {
  return props.tenantStats.reduce((sum, s) => sum + s.totalPending, 0)
})

function handleExport() {
  const rows = [
    ['REKAPITULASI MINYAK JELANTAH PER TENANT'],
    ['Tanggal Export:', new Date().toLocaleString('id-ID')],
    [],
    ['Kode', 'Nama Tenant', 'Lokasi', 'No Telp', 'Total Liter (L)', 'Harga Beli (Rp/L)', 'Sudah Dibayar (Rp)', 'Belum Dibayar (Rp)', 'Total Hak (Rp)', 'Setoran Terakhir', 'Jumlah Transaksi'],
    ...props.tenantStats.map(s => [
      s.tenant.code,
      s.tenant.name,
      s.tenant.location,
      s.tenant.phone,
      s.totalLiters,
      s.tenant.defaultRatePerLiter === 0 ? 'Tidak Dibayar (0)' : s.tenant.defaultRatePerLiter,
      s.totalPaid,
      s.totalPending,
      s.totalPaid + s.totalPending,
      s.lastDepositDate || '-',
      s.totalTransactions
    ]),
    [],
    ['TOTAL', '', '', '', totalGrandLiters.value, '', totalGrandPaid.value, totalGrandPending.value, totalGrandPaid.value + totalGrandPending.value]
  ]
  exportToCSV('Rekap_Tenant_Minyak_Jelantah', rows)
}
</script>

<template>
  <div class="bg-white border border-slate-200/90 rounded-lg overflow-hidden shadow-2xs">
    <!-- Header Card (Emerald Theme) -->
    <div class="p-3 sm:px-4 sm:py-3 bg-emerald-50/80 border-b border-emerald-200/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div>
        <div class="flex items-center gap-2">
          <div class="p-1.5 rounded-md bg-emerald-100 text-emerald-800 shrink-0">
            <Store class="w-4 h-4" />
          </div>
          <h2 class="text-xs sm:text-sm font-semibold text-emerald-950">Rekapitulasi per Tenant</h2>
          <span class="text-[10px] sm:text-[11px] font-medium text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
            {{ tenantStats.length }} Tenant
          </span>
        </div>
        <p class="text-[11px] sm:text-xs text-emerald-800/80 mt-1">Volume terkumpul dan status pembayaran ke masing-masing tenant</p>
      </div>

      <div class="flex flex-wrap items-center gap-2 w-full md:w-auto">
        <div class="relative flex-1 min-w-[130px] md:w-44 md:flex-none">
          <Search class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input 
            v-model="searchQuery"
            type="text"
            placeholder="Cari tenant..." 
            class="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-emerald-200 rounded-md focus:outline-none focus:border-emerald-500 transition-colors text-slate-800"
          />
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
          <button 
            @click="handleExport"
            class="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 bg-white border border-emerald-200/90 rounded-md text-emerald-900 text-xs hover:bg-emerald-100/50 cursor-pointer font-medium transition-colors"
          >
            <Download class="w-3.5 h-3.5 text-emerald-700" />
            <span class="hidden sm:inline">Export CSV</span>
            <span class="sm:hidden">CSV</span>
          </button>

          <button 
            @click="emit('add-new-tenant')"
            class="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium cursor-pointer transition-colors shadow-xs"
          >
            <Plus class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Tambah Tenant</span>
            <span class="sm:hidden">Tambah</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Table with responsive horizontal scroll -->
    <div class="overflow-x-auto touch-pan-x">
      <table class="w-full text-left text-xs min-w-[680px]">
        <thead class="bg-emerald-50/30 border-b border-emerald-100/80">
          <tr class="text-emerald-950/70 font-semibold text-[10px] sm:text-[11px] uppercase tracking-wider">
            <th class="py-2.5 px-3 sm:px-4">Tenant</th>
            <th class="py-2.5 px-3 sm:px-4 min-w-[150px]">Volume Terkumpul</th>
            <th class="py-2.5 px-3 sm:px-4">Harga Beli</th>
            <th class="py-2.5 px-3 sm:px-4">Sudah Dibayar</th>
            <th class="py-2.5 px-3 sm:px-4">Belum Dibayar</th>
            <th class="py-2.5 px-3 sm:px-4">Total Hak Tenant</th>
            <th class="py-2.5 px-3 sm:px-4">Setoran Terakhir</th>
            <th class="py-2.5 px-3 sm:px-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 text-slate-700">
          <tr 
            v-for="stat in filteredStats" 
            :key="stat.tenant.id"
            class="hover:bg-slate-50/70 transition-colors"
          >
            <!-- Tenant info -->
            <td class="py-2.5 sm:py-3 px-3 sm:px-4">
              <div class="font-semibold text-slate-900 flex items-center gap-1.5">
                {{ stat.tenant.name }}
                <span class="font-mono text-[10px] text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                  {{ stat.tenant.code }}
                </span>
              </div>
              <div class="text-slate-400 flex items-center gap-2 sm:gap-3 mt-0.5 text-[10px] sm:text-[11px]">
                <span class="flex items-center gap-1">
                  <MapPin class="w-3 h-3 text-slate-400" /> {{ stat.tenant.location }}
                </span>
                <span v-if="stat.tenant.phone" class="flex items-center gap-1">
                  <Phone class="w-3 h-3 text-slate-400" /> {{ stat.tenant.phone }}
                </span>
              </div>
            </td>

            <!-- Liters with progress bar -->
            <td class="py-2.5 sm:py-3 px-3 sm:px-4">
              <div class="flex items-center justify-between">
                <span class="font-semibold text-slate-900">{{ formatLiter(stat.totalLiters) }}</span>
                <span class="text-slate-400 text-[10px] sm:text-[11px]">({{ stat.totalTransactions }}x)</span>
              </div>
              <div class="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div 
                  class="bg-emerald-600 h-full rounded-full transition-all duration-300"
                  :style="{ width: `${Math.min(100, Math.round((stat.totalLiters / maxLiters) * 100))}%` }"
                ></div>
              </div>
            </td>

            <!-- Rate -->
            <td class="py-2.5 sm:py-3 px-3 sm:px-4 whitespace-nowrap">
              <span 
                v-if="stat.tenant.defaultRatePerLiter === 0" 
                class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                <span>Tidak Dibayar</span>
              </span>
              <span v-else class="text-slate-800 font-medium">
                {{ formatRupiah(stat.tenant.defaultRatePerLiter) }}<span class="text-slate-400 font-normal">/L</span>
              </span>
            </td>

            <!-- Paid -->
            <td class="py-2.5 sm:py-3 px-3 sm:px-4 text-emerald-700 font-medium whitespace-nowrap">
              <span v-if="stat.tenant.defaultRatePerLiter === 0 && stat.totalPaid === 0" class="text-slate-400 font-normal">
                Rp 0
              </span>
              <span v-else>
                {{ formatRupiah(stat.totalPaid) }}
              </span>
            </td>

            <!-- Pending -->
            <td class="py-2.5 sm:py-3 px-3 sm:px-4 whitespace-nowrap">
              <span v-if="stat.totalPending > 0" class="text-amber-700 font-medium">{{ formatRupiah(stat.totalPending) }}</span>
              <span v-else class="text-slate-400">—</span>
            </td>

            <!-- Total -->
            <td class="py-2.5 sm:py-3 px-3 sm:px-4 font-bold text-slate-900 whitespace-nowrap">
              <span v-if="stat.tenant.defaultRatePerLiter === 0 && (stat.totalPaid + stat.totalPending) === 0" class="text-slate-400 font-normal">
                Rp 0
              </span>
              <span v-else>
                {{ formatRupiah(stat.totalPaid + stat.totalPending) }}
              </span>
            </td>

            <!-- Last date -->
            <td class="py-2.5 sm:py-3 px-3 sm:px-4 text-slate-500 whitespace-nowrap">
              <span v-if="stat.lastDepositDate" class="flex items-center gap-1 text-[10px] sm:text-[11px]">
                <Calendar class="w-3 h-3 text-slate-400" /> {{ stat.lastDepositDate }}
              </span>
              <span v-else class="text-slate-400 text-[10px] sm:text-[11px]">Belum ada</span>
            </td>

            <!-- Actions -->
            <td class="py-2.5 sm:py-3 px-3 sm:px-4 text-right whitespace-nowrap">
              <div class="flex items-center justify-end gap-1 sm:gap-1.5">
                <button 
                  @click="emit('add-deposit-for-tenant', stat.tenant)"
                  class="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-200 font-medium text-xs transition-colors cursor-pointer"
                >
                  <Plus class="w-3 h-3" />
                  <span>Setor</span>
                </button>
                <button 
                  @click="emit('edit-tenant', stat.tenant)"
                  class="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Edit tenant"
                >
                  <Edit3 class="w-3.5 h-3.5" />
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="filteredStats.length === 0">
            <td colspan="8" class="text-center py-8 text-slate-400 text-xs">
              Tidak ada data tenant yang cocok.
            </td>
          </tr>
        </tbody>

        <tfoot class="bg-emerald-50/40 border-t border-emerald-200/70 text-xs font-semibold text-slate-800">
          <tr>
            <td class="py-2.5 px-3 sm:px-4">Total ({{ tenantStats.length }} Tenant)</td>
            <td class="py-2.5 px-3 sm:px-4 font-bold text-slate-900">{{ formatLiter(totalGrandLiters) }}</td>
            <td class="py-2.5 px-3 sm:px-4 text-slate-400">—</td>
            <td class="py-2.5 px-3 sm:px-4 text-emerald-700 font-bold whitespace-nowrap">{{ formatRupiah(totalGrandPaid) }}</td>
            <td class="py-2.5 px-3 sm:px-4 text-amber-700 font-bold whitespace-nowrap">{{ formatRupiah(totalGrandPending) }}</td>
            <td class="py-2.5 px-3 sm:px-4 text-slate-900 font-bold whitespace-nowrap">{{ formatRupiah(totalGrandPaid + totalGrandPending) }}</td>
            <td colspan="2" class="py-2.5 px-3 sm:px-4"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

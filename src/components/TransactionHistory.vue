<script setup lang="ts">
import { ref, computed } from 'vue'
import { History, Search, Download, Trash2, Calendar, Plus } from '@lucide/vue'
import type { CollectionRecord, VendorSaleRecord, Tenant } from '../types'
import { formatLiter, formatRupiah, exportToCSV } from '../services/storage'

const props = defineProps<{
  collections: CollectionRecord[]
  vendorSales: VendorSaleRecord[]
  tenants: Tenant[]
}>()

const emit = defineEmits<{
  (e: 'open-deposit'): void
  (e: 'open-vendor-sale'): void
  (e: 'toggle-collection-status', item: CollectionRecord): void
  (e: 'delete-collection', id: string): void
  (e: 'toggle-vendor-sale-status', item: VendorSaleRecord): void
  (e: 'delete-vendor-sale', id: string): void
}>()

const activeTab = ref<'collections' | 'vendor_sales'>('collections')
const searchQuery = ref('')
const statusFilter = ref<'ALL' | 'LUNAS' | 'PENDING'>('ALL')
const selectedTenantFilter = ref<string>('ALL')

const filteredCollections = computed(() => {
  let list = [...props.collections].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  if (selectedTenantFilter.value !== 'ALL') {
    list = list.filter(c => c.tenantId === selectedTenantFilter.value)
  }
  if (statusFilter.value === 'LUNAS') {
    list = list.filter(c => c.paymentStatus === 'LUNAS')
  } else if (statusFilter.value === 'PENDING') {
    list = list.filter(c => c.paymentStatus === 'BELUM LUNAS')
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(c => 
      c.tenantName.toLowerCase().includes(q) ||
      (c.notes && c.notes.toLowerCase().includes(q)) ||
      c.date.includes(q)
    )
  }
  return list
})

const filteredVendorSales = computed(() => {
  let list = [...props.vendorSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  if (statusFilter.value === 'LUNAS') {
    list = list.filter(v => v.paymentStatus === 'LUNAS')
  } else if (statusFilter.value === 'PENDING') {
    list = list.filter(v => v.paymentStatus === 'TEMPO')
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(v => 
      v.vendorName.toLowerCase().includes(q) ||
      (v.notes && v.notes.toLowerCase().includes(q)) ||
      v.date.includes(q)
    )
  }
  return list
})

function exportCollections() {
  const rows = [
    ['RIWAYAT SETORAN MINYAK JELANTAH DARI TENANT'],
    ['Tanggal Export:', new Date().toLocaleString('id-ID')],
    [],
    ['ID', 'Tanggal', 'Nama Tenant', 'Volume (L)', 'Harga/L (Rp)', 'Total Bayar (Rp)', 'Status', 'Catatan'],
    ...props.collections.map(c => [c.id, c.date, c.tenantName, c.liters, c.pricePerLiter, c.totalPayment, c.paymentStatus, c.notes || '-'])
  ]
  exportToCSV('Riwayat_Setoran_Tenant', rows)
}

function exportVendorSales() {
  const rows = [
    ['RIWAYAT PENJUALAN MINYAK JELANTAH KE VENDOR'],
    ['Tanggal Export:', new Date().toLocaleString('id-ID')],
    [],
    ['ID', 'Tanggal', 'Nama Vendor', 'Volume (L)', 'Harga/L (Rp)', 'Total Pendapatan (Rp)', 'Status', 'Catatan'],
    ...props.vendorSales.map(v => [v.id, v.date, v.vendorName, v.liters, v.pricePerLiter, v.totalRevenue, v.paymentStatus, v.notes || '-'])
  ]
  exportToCSV('Riwayat_Penjualan_Vendor', rows)
}
</script>

<template>
  <div class="bg-white border border-slate-200/90 rounded-lg overflow-hidden shadow-2xs">
    <!-- Header Card (Blue Theme) -->
    <div class="px-4 py-3 bg-blue-50/80 border-b border-blue-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <div class="flex items-center gap-2">
          <div class="p-1.5 rounded-md bg-blue-100 text-blue-800">
            <History class="w-4 h-4" />
          </div>
          <h3 class="text-sm font-semibold text-blue-950">Riwayat Mutasi & Transaksi</h3>
        </div>
        <p class="text-xs text-blue-800/80 mt-1">Catatan keluar-masuk minyak dari tenant dan penjualan ke vendor</p>
      </div>

      <div>
        <button
          v-if="activeTab === 'collections'"
          @click="exportCollections"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200/90 rounded-md text-blue-900 text-xs hover:bg-blue-100/50 cursor-pointer font-medium transition-colors"
        >
          <Download class="w-3.5 h-3.5 text-blue-700" />
          <span>Export Setoran</span>
        </button>
        <button
          v-else
          @click="exportVendorSales"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200/90 rounded-md text-blue-900 text-xs hover:bg-blue-100/50 cursor-pointer font-medium transition-colors"
        >
          <Download class="w-3.5 h-3.5 text-blue-700" />
          <span>Export Penjualan</span>
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="border-b border-blue-200/60 px-4 flex gap-6 bg-blue-50/30">
      <button 
        @click="activeTab = 'collections'"
        class="py-2.5 text-xs font-medium border-b-2 cursor-pointer transition-colors flex items-center gap-2"
        :class="activeTab === 'collections' 
          ? 'border-blue-600 text-blue-950 font-semibold' 
          : 'border-transparent text-slate-500 hover:text-slate-800'"
      >
        <span>Setoran dari Tenant</span>
        <span 
          class="px-2 py-0.5 rounded-full text-[10px] font-medium"
          :class="activeTab === 'collections' ? 'bg-blue-100 text-blue-900' : 'bg-slate-200/70 text-slate-600'"
        >
          {{ collections.length }}
        </span>
      </button>
      <button 
        @click="activeTab = 'vendor_sales'"
        class="py-2.5 text-xs font-medium border-b-2 cursor-pointer transition-colors flex items-center gap-2"
        :class="activeTab === 'vendor_sales' 
          ? 'border-blue-600 text-blue-950 font-semibold' 
          : 'border-transparent text-slate-500 hover:text-slate-800'"
      >
        <span>Penjualan ke Vendor</span>
        <span 
          class="px-2 py-0.5 rounded-full text-[10px] font-medium"
          :class="activeTab === 'vendor_sales' ? 'bg-blue-100 text-blue-900' : 'bg-slate-200/70 text-slate-600'"
        >
          {{ vendorSales.length }}
        </span>
      </button>
    </div>

    <!-- Filter Bar -->
    <div class="px-4 py-2.5 bg-slate-50/70 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2.5 text-xs">
      <div class="flex flex-wrap items-center gap-2 flex-1">
        <div class="relative">
          <Search class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input 
            v-model="searchQuery"
            type="text" 
            :placeholder="activeTab === 'collections' ? 'Cari tenant / catatan...' : 'Cari vendor / catatan...'"
            class="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 w-48 text-slate-800"
          />
        </div>

        <select 
          v-if="activeTab === 'collections'"
          v-model="selectedTenantFilter"
          class="border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700 bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="ALL">Semua Tenant</option>
          <option v-for="t in tenants" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>

        <select 
          v-model="statusFilter"
          class="border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700 bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="ALL">Semua Status Bayar</option>
          <option value="LUNAS">Status: Lunas</option>
          <option value="PENDING">Status: Belum Lunas / Tempo</option>
        </select>
      </div>

      <button 
        v-if="activeTab === 'collections'"
        @click="emit('open-deposit')"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium cursor-pointer transition-colors shadow-xs"
      >
        <Plus class="w-3.5 h-3.5" />
        <span>Tambah Setoran</span>
      </button>
      <button 
        v-else
        @click="emit('open-vendor-sale')"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium cursor-pointer transition-colors shadow-xs"
      >
        <Plus class="w-3.5 h-3.5" />
        <span>Tambah Penjualan</span>
      </button>
    </div>

    <!-- Collections Table -->
    <div v-if="activeTab === 'collections'" class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead class="bg-blue-50/20 border-b border-blue-100/70">
          <tr class="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
            <th class="py-2.5 px-4">Tanggal</th>
            <th class="py-2.5 px-4">Tenant</th>
            <th class="py-2.5 px-4">Volume</th>
            <th class="py-2.5 px-4">Harga / L</th>
            <th class="py-2.5 px-4">Total Bayar</th>
            <th class="py-2.5 px-4">Status Bayar</th>
            <th class="py-2.5 px-4">Catatan</th>
            <th class="py-2.5 px-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 text-slate-700">
          <tr 
            v-for="item in filteredCollections" 
            :key="item.id"
            class="hover:bg-slate-50/70 transition-colors"
          >
            <td class="py-2.5 px-4 text-slate-600 whitespace-nowrap">
              <span class="flex items-center gap-1 text-[11px]">
                <Calendar class="w-3 h-3 text-slate-400" /> {{ item.date }}
              </span>
            </td>
            <td class="py-2.5 px-4 font-semibold text-slate-900">{{ item.tenantName }}</td>
            <td class="py-2.5 px-4 font-bold text-slate-900">{{ formatLiter(item.liters) }}</td>
            <td class="py-2.5 px-4 text-slate-600">{{ formatRupiah(item.pricePerLiter) }}</td>
            <td class="py-2.5 px-4 font-bold text-slate-900">{{ formatRupiah(item.totalPayment) }}</td>
            <td class="py-2.5 px-4">
              <button 
                @click="emit('toggle-collection-status', item)"
                class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border cursor-pointer transition-colors"
                :class="item.paymentStatus === 'LUNAS' 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' 
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'"
                :title="item.paymentStatus === 'LUNAS' ? 'Klik untuk ubah ke Belum Lunas' : 'Klik untuk tandai Lunas'"
              >
                <span 
                  class="w-1.5 h-1.5 rounded-full" 
                  :class="item.paymentStatus === 'LUNAS' ? 'bg-emerald-600' : 'bg-amber-600'"
                ></span>
                <span>{{ item.paymentStatus }}</span>
              </button>
            </td>
            <td class="py-2.5 px-4 text-slate-500 max-w-[200px] truncate">{{ item.notes || '—' }}</td>
            <td class="py-2.5 px-4 text-right">
              <button 
                @click="emit('delete-collection', item.id)"
                class="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Hapus"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </td>
          </tr>
          <tr v-if="filteredCollections.length === 0">
            <td colspan="8" class="text-center py-8 text-slate-400">Belum ada riwayat setoran yang cocok.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Vendor Sales Table -->
    <div v-if="activeTab === 'vendor_sales'" class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead class="bg-blue-50/20 border-b border-blue-100/70">
          <tr class="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
            <th class="py-2.5 px-4">Tanggal</th>
            <th class="py-2.5 px-4">Vendor / Pembeli</th>
            <th class="py-2.5 px-4">Volume Terjual</th>
            <th class="py-2.5 px-4">Harga Jual / L</th>
            <th class="py-2.5 px-4">Total Pendapatan</th>
            <th class="py-2.5 px-4">Status Bayar</th>
            <th class="py-2.5 px-4">Catatan</th>
            <th class="py-2.5 px-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 text-slate-700">
          <tr 
            v-for="item in filteredVendorSales" 
            :key="item.id"
            class="hover:bg-slate-50/70 transition-colors"
          >
            <td class="py-2.5 px-4 text-slate-600 whitespace-nowrap">
              <span class="flex items-center gap-1 text-[11px]">
                <Calendar class="w-3 h-3 text-slate-400" /> {{ item.date }}
              </span>
            </td>
            <td class="py-2.5 px-4 font-semibold text-slate-900">{{ item.vendorName }}</td>
            <td class="py-2.5 px-4 font-bold text-slate-900">{{ formatLiter(item.liters) }}</td>
            <td class="py-2.5 px-4 text-slate-600">{{ formatRupiah(item.pricePerLiter) }}</td>
            <td class="py-2.5 px-4 font-bold text-emerald-700">{{ formatRupiah(item.totalRevenue) }}</td>
            <td class="py-2.5 px-4">
              <button 
                @click="emit('toggle-vendor-sale-status', item)"
                class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border cursor-pointer transition-colors"
                :class="item.paymentStatus === 'LUNAS' 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' 
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'"
                :title="item.paymentStatus === 'LUNAS' ? 'Klik untuk ubah ke Tempo' : 'Klik untuk tandai Lunas'"
              >
                <span 
                  class="w-1.5 h-1.5 rounded-full" 
                  :class="item.paymentStatus === 'LUNAS' ? 'bg-emerald-600' : 'bg-amber-600'"
                ></span>
                <span>{{ item.paymentStatus }}</span>
              </button>
            </td>
            <td class="py-2.5 px-4 text-slate-500 max-w-[200px] truncate">{{ item.notes || '—' }}</td>
            <td class="py-2.5 px-4 text-right">
              <button 
                @click="emit('delete-vendor-sale', item.id)"
                class="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Hapus"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </td>
          </tr>
          <tr v-if="filteredVendorSales.length === 0">
            <td colspan="8" class="text-center py-8 text-slate-400">Belum ada riwayat penjualan ke vendor.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

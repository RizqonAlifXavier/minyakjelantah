<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { CheckCircle2, AlertCircle, Info } from '@lucide/vue'

import type { Tenant, CollectionRecord, VendorSaleRecord } from './types'
import { 
  loadTenants, 
  saveTenants, 
  loadCollections, 
  saveCollections, 
  loadVendorSales, 
  saveVendorSales, 
  calculateTenantStats,
  formatLiter
} from './services/storage'
import { syncAllToGoogleSheet, fetchGoogleSheetData } from './services/googleSheets'
import { GOOGLE_SHEETS_CONFIG } from './config/googleSheets'

import Navbar from './components/Navbar.vue'
import StatCards from './components/StatCards.vue'
import TenantSummaryTable from './components/TenantSummaryTable.vue'
import TransactionHistory from './components/TransactionHistory.vue'
import DepositModal from './components/DepositModal.vue'
import VendorSaleModal from './components/VendorSaleModal.vue'
import TenantModal from './components/TenantModal.vue'

const tenants = ref<Tenant[]>([])
const collections = ref<CollectionRecord[]>([])
const vendorSales = ref<VendorSaleRecord[]>([])

const isSyncing = ref(false)
const toastMessage = ref<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

const isDepositModalOpen = ref(false)
const isVendorSaleModalOpen = ref(false)
const isTenantModalOpen = ref(false)
const preselectedTenantId = ref<string>('')
const editingTenant = ref<Tenant | null>(null)

onMounted(async () => {
  // Muat data lokal yang tersimpan
  tenants.value = loadTenants()
  collections.value = loadCollections()
  vendorSales.value = loadVendorSales()

  // Ambil data resmi terbaru langsung dari Google Sheet
  if (GOOGLE_SHEETS_CONFIG.scriptUrl) {
    await pullFromGoogleSheetSilent()
  }
})

function showToast(text: string, type: 'success' | 'error' | 'info' = 'success') {
  toastMessage.value = { text, type }
  setTimeout(() => { toastMessage.value = null }, 4000)
}

const totalLitersCollected = computed(() => {
  const sum = collections.value.reduce((acc, c) => acc + (Number(c.liters) || 0), 0)
  return Math.round(sum * 100) / 100
})

const totalLitersSold = computed(() => {
  const sum = vendorSales.value.reduce((acc, v) => acc + (Number(v.liters) || 0), 0)
  return Math.round(sum * 100) / 100
})

const currentStockLiters = computed(() => {
  return Math.round((totalLitersCollected.value - totalLitersSold.value) * 100) / 100
})

const totalPaidToTenants = computed(() => {
  return collections.value
    .filter(c => c.paymentStatus === 'LUNAS')
    .reduce((sum, c) => sum + (Number(c.totalPayment) || 0), 0)
})

const totalPendingToTenants = computed(() => {
  return collections.value
    .filter(c => c.paymentStatus === 'BELUM LUNAS')
    .reduce((sum, c) => sum + (Number(c.totalPayment) || 0), 0)
})

const totalRevenueFromVendors = computed(() => {
  return vendorSales.value.reduce((sum, v) => sum + (Number(v.totalRevenue) || 0), 0)
})

const netProfit = computed(() => {
  const totalCost = totalPaidToTenants.value + totalPendingToTenants.value
  return totalRevenueFromVendors.value - totalCost
})

const tenantStats = computed(() => {
  return calculateTenantStats(tenants.value, collections.value)
})

async function autoSyncIfEnabled() {
  if (GOOGLE_SHEETS_CONFIG.autoSync && GOOGLE_SHEETS_CONFIG.scriptUrl) {
    await pushToGoogleSheetSilent()
  }
}

async function pushToGoogleSheetSilent() {
  if (!GOOGLE_SHEETS_CONFIG.scriptUrl) return
  isSyncing.value = true
  try {
    const res = await syncAllToGoogleSheet(GOOGLE_SHEETS_CONFIG.scriptUrl, {
      tenants: tenants.value,
      collections: collections.value,
      vendorSales: vendorSales.value
    })
    if (res.success) {
      console.log('[Google Sheets Backend] Data berhasil disinkronkan ke Google Sheet')
    } else {
      console.warn('[Google Sheets Backend] Gagal sinkronisasi:', res.message)
    }
  } catch (err) {
    console.error('[Google Sheets Backend] Error syncing:', err)
  } finally {
    isSyncing.value = false
  }
}

async function pullFromGoogleSheetSilent() {
  if (!GOOGLE_SHEETS_CONFIG.scriptUrl) return
  isSyncing.value = true
  try {
    const res = await fetchGoogleSheetData(GOOGLE_SHEETS_CONFIG.scriptUrl)
    if (res.status === 'success' && res.data) {
      if (Array.isArray(res.data.tenants) && res.data.tenants.length > 0) {
        tenants.value = res.data.tenants
        saveTenants(tenants.value)
      }
      if (Array.isArray(res.data.collections)) {
        collections.value = res.data.collections
        saveCollections(collections.value)
      }
      if (Array.isArray(res.data.vendorSales)) {
        vendorSales.value = res.data.vendorSales
        saveVendorSales(vendorSales.value)
      }
      console.log('[Google Sheets Backend] Data berhasil dimuat dari Google Sheet')
    }
  } catch (err) {
    console.warn('[Google Sheets Backend] Belum dapat memuat data dari Google Sheet:', err)
  } finally {
    isSyncing.value = false
  }
}

function handleSaveDeposit(record: CollectionRecord) {
  collections.value.unshift(record)
  saveCollections(collections.value)
  showToast(`Setoran ${formatLiter(record.liters)} dari ${record.tenantName} berhasil dicatat!`, 'success')
  autoSyncIfEnabled()
}

function handleAddDepositForTenant(tenant: Tenant) {
  preselectedTenantId.value = tenant.id
  isDepositModalOpen.value = true
}

function handleToggleCollectionStatus(item: CollectionRecord) {
  item.paymentStatus = item.paymentStatus === 'LUNAS' ? 'BELUM LUNAS' : 'LUNAS'
  saveCollections(collections.value)
  showToast(`Status diubah menjadi ${item.paymentStatus}`, 'info')
  autoSyncIfEnabled()
}

function handleDeleteCollection(id: string) {
  if (confirm('Yakin ingin menghapus catatan setoran ini?')) {
    collections.value = collections.value.filter(c => c.id !== id)
    saveCollections(collections.value)
    showToast('Catatan setoran dihapus', 'info')
    autoSyncIfEnabled()
  }
}

function handleSaveVendorSale(record: VendorSaleRecord) {
  vendorSales.value.unshift(record)
  saveVendorSales(vendorSales.value)
  showToast(`Penjualan ${formatLiter(record.liters)} ke ${record.vendorName} berhasil dicatat!`, 'success')
  autoSyncIfEnabled()
}

function handleToggleVendorSaleStatus(item: VendorSaleRecord) {
  item.paymentStatus = item.paymentStatus === 'LUNAS' ? 'TEMPO' : 'LUNAS'
  saveVendorSales(vendorSales.value)
  showToast(`Status pembayaran vendor diubah menjadi ${item.paymentStatus}`, 'info')
  autoSyncIfEnabled()
}

function handleDeleteVendorSale(id: string) {
  if (confirm('Yakin ingin menghapus catatan penjualan ini?')) {
    vendorSales.value = vendorSales.value.filter(v => v.id !== id)
    saveVendorSales(vendorSales.value)
    showToast('Catatan penjualan dihapus', 'info')
    autoSyncIfEnabled()
  }
}

function handleSaveTenant(tenant: Tenant) {
  const index = tenants.value.findIndex(t => t.id === tenant.id)
  if (index >= 0) {
    tenants.value[index] = tenant
    showToast(`Data tenant ${tenant.name} berhasil diperbarui`, 'success')
  } else {
    tenants.value.push(tenant)
    showToast(`Tenant ${tenant.name} berhasil ditambahkan!`, 'success')
  }
  saveTenants(tenants.value)
  autoSyncIfEnabled()
}

function handleEditTenant(tenant: Tenant) {
  editingTenant.value = tenant
  isTenantModalOpen.value = true
}

function handleAddNewTenant() {
  editingTenant.value = null
  isTenantModalOpen.value = true
}
</script>

<template>
  <div class="min-h-screen bg-slate-50/60 flex flex-col font-sans">
    <Navbar 
      :stockLiters="currentStockLiters"
      @open-deposit="isDepositModalOpen = true; preselectedTenantId = ''"
      @open-vendor-sale="isVendorSaleModalOpen = true"
    />

    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
      <!-- Info Bar -->
      <div class="bg-white border border-slate-200/90 border-l-4 border-l-emerald-600 rounded-lg px-4 py-3 text-xs">
        <div class="flex flex-wrap items-center gap-2 text-slate-700">
          <span class="font-semibold text-slate-900">Ketentuan Harga:</span>
          <span class="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-semibold text-[11px]">
            Beli: Rp 8.000/L
          </span>
          <span class="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded font-medium text-[11px] inline-flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            <span>Solaria: Tidak Dibayar (Rp 0/L)</span>
          </span>
          <span class="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded font-semibold text-[11px]">
            Jual Vendor: Rp 10.500/L
          </span>
          <span class="text-slate-400 hidden lg:inline">· 6 Tenant: Bakmie Now, Agam, Tomlex, Biranda, Streetsushi, Solaria</span>
        </div>
      </div>

      <!-- Stat Cards -->
      <StatCards 
        :totalLitersCollected="totalLitersCollected"
        :totalLitersSold="totalLitersSold"
        :currentStockLiters="currentStockLiters"
        :totalPaidToTenants="totalPaidToTenants"
        :totalPendingToTenants="totalPendingToTenants"
        :totalRevenueFromVendors="totalRevenueFromVendors"
        :netProfit="netProfit"
      />

      <!-- Tenant Table -->
      <TenantSummaryTable 
        :tenantStats="tenantStats"
        @add-deposit-for-tenant="handleAddDepositForTenant"
        @edit-tenant="handleEditTenant"
        @add-new-tenant="handleAddNewTenant"
      />

      <!-- Transaction History -->
      <TransactionHistory 
        :collections="collections"
        :vendorSales="vendorSales"
        :tenants="tenants"
        @open-deposit="isDepositModalOpen = true; preselectedTenantId = ''"
        @open-vendor-sale="isVendorSaleModalOpen = true"
        @toggle-collection-status="handleToggleCollectionStatus"
        @delete-collection="handleDeleteCollection"
        @toggle-vendor-sale-status="handleToggleVendorSaleStatus"
        @delete-vendor-sale="handleDeleteVendorSale"
      />
    </main>

    <!-- Footer -->
    <footer class="border-t border-slate-200 py-4 text-center text-xs text-slate-400 bg-white mt-6">
      JelantahTrack — Sistem Pengelolaan Minyak Jelantah
    </footer>

    <!-- Modals -->
    <DepositModal 
      :isOpen="isDepositModalOpen"
      :tenants="tenants"
      :preselectedTenantId="preselectedTenantId"
      @close="isDepositModalOpen = false"
      @save="handleSaveDeposit"
    />

    <VendorSaleModal 
      :isOpen="isVendorSaleModalOpen"
      :currentStockLiters="currentStockLiters"
      @close="isVendorSaleModalOpen = false"
      @save="handleSaveVendorSale"
    />

    <TenantModal 
      :isOpen="isTenantModalOpen"
      :editData="editingTenant"
      :existingCount="tenants.length"
      @close="isTenantModalOpen = false"
      @save="handleSaveTenant"
    />

    <!-- Toast -->
    <div 
      v-if="toastMessage" 
      class="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-md border text-xs font-medium shadow-md transition-all"
      :class="{
        'bg-white border-emerald-400 text-emerald-900': toastMessage.type === 'success',
        'bg-white border-rose-400 text-rose-900': toastMessage.type === 'error',
        'bg-white border-slate-300 text-slate-800': toastMessage.type === 'info',
      }"
    >
      <CheckCircle2 v-if="toastMessage.type === 'success'" class="w-4 h-4 text-emerald-600" />
      <AlertCircle v-else-if="toastMessage.type === 'error'" class="w-4 h-4 text-rose-600" />
      <Info v-else class="w-4 h-4 text-slate-500" />
      <span>{{ toastMessage.text }}</span>
    </div>
  </div>
</template>

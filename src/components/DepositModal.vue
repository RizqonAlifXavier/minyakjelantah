<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { X } from '@lucide/vue'
import type { Tenant, CollectionRecord } from '../types'
import { formatRupiah } from '../services/storage'

const props = defineProps<{
  isOpen: boolean
  tenants: Tenant[]
  preselectedTenantId?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', record: CollectionRecord): void
}>()

const todayStr: string = new Date().toISOString().split('T')[0] || ''

const selectedTenantId = ref('')
const date = ref(todayStr)
const liters = ref<number | string>('')
const pricePerLiter = ref<number | ''>('')
const paymentStatus = ref<'LUNAS' | 'BELUM LUNAS'>('LUNAS')
const notes = ref('')

const selectedTenant = computed(() => {
  return props.tenants.find(t => t.id === selectedTenantId.value)
})

watch(() => props.isOpen, (open) => {
  if (open) {
    date.value = new Date().toISOString().split('T')[0] || ''
    if (props.preselectedTenantId) {
      selectedTenantId.value = props.preselectedTenantId
    } else if (props.tenants.length > 0 && !selectedTenantId.value && props.tenants[0]) {
      selectedTenantId.value = props.tenants[0].id
    }
    updatePriceFromTenant()
  }
})

watch(() => props.preselectedTenantId, (newId) => {
  if (newId) {
    selectedTenantId.value = newId
    updatePriceFromTenant()
  }
})

watch(selectedTenantId, () => {
  updatePriceFromTenant()
})

function updatePriceFromTenant() {
  if (selectedTenant.value) {
    pricePerLiter.value = selectedTenant.value.defaultRatePerLiter
  }
}

const parsedLiters = computed(() => {
  if (liters.value === '' || liters.value === null || liters.value === undefined) return 0
  const clean = String(liters.value).replace(',', '.')
  const num = parseFloat(clean)
  return isNaN(num) ? 0 : Math.round(num * 1000) / 1000
})

const calculatedTotal = computed(() => {
  const l = parsedLiters.value
  const p = Number(pricePerLiter.value) || 0
  return Math.round(l * p)
})

function handleSubmit() {
  const currentTenant = selectedTenant.value
  if (!selectedTenantId.value || !currentTenant) {
    alert('Pilih tenant terlebih dahulu')
    return
  }
  const l = parsedLiters.value
  if (!l || l <= 0) {
    alert('Masukkan jumlah liter yang valid (> 0)')
    return
  }
  const p = Number(pricePerLiter.value)
  if (p < 0) {
    alert('Harga per liter tidak boleh negatif')
    return
  }

  const record: CollectionRecord = {
    id: 'SET-' + Date.now().toString(),
    date: date.value || todayStr,
    tenantId: currentTenant.id,
    tenantName: currentTenant.name,
    liters: l,
    pricePerLiter: p,
    totalPayment: calculatedTotal.value,
    paymentStatus: paymentStatus.value,
    notes: notes.value.trim(),
    createdAt: new Date().toISOString()
  }

  emit('save', record)
  liters.value = ''
  notes.value = ''
  emit('close')
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
    <div class="bg-white rounded-lg border border-slate-200 w-full max-w-lg shadow-xl overflow-hidden">
      <!-- Header -->
      <div class="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
        <h3 class="font-semibold text-sm text-slate-900">Catat Setoran Minyak Tenant</h3>
        <button 
          @click="emit('close')"
          class="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="p-5 space-y-4 text-xs">
        <!-- Tenant -->
        <div>
          <label class="block font-medium text-slate-700 mb-1">Tenant *</label>
          <select 
            v-model="selectedTenantId"
            required
            class="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500 bg-white"
          >
            <option disabled value="">— Pilih Tenant —</option>
            <option v-for="t in tenants" :key="t.id" :value="t.id">
              {{ t.name }} ({{ t.code }}) — {{ t.location }}
            </option>
          </select>
          <p v-if="selectedTenant" class="mt-1.5 text-slate-500">
            Tarif Dasar: 
            <span v-if="selectedTenant.defaultRatePerLiter === 0" class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
              <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
              Solaria: Tidak Dibayar (Rp 0/L)
            </span>
            <span v-else class="font-semibold text-slate-800">{{ formatRupiah(selectedTenant.defaultRatePerLiter) }} / L</span>
          </p>
        </div>

        <!-- Tanggal -->
        <div>
          <label class="block font-medium text-slate-700 mb-1">Tanggal Setoran *</label>
          <input 
            v-model="date"
            type="date"
            required
            class="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <!-- Liter & Harga -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-medium text-slate-700 mb-1">Volume (Liter) *</label>
            <div class="relative">
              <input 
                v-model="liters"
                type="number"
                step="any"
                min="0.001"
                placeholder="misal: 25 atau 25.5"
                required
                class="w-full border border-slate-300 rounded-md pl-3 pr-7 py-2 text-slate-800 font-medium focus:outline-none focus:border-emerald-500"
              />
              <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium">L</span>
            </div>
          </div>

          <div>
            <label class="block font-medium text-slate-700 mb-1">Harga per Liter (Rp) *</label>
            <input 
              v-model.number="pricePerLiter"
              type="number"
              step="100"
              min="0"
              placeholder="8000"
              required
              class="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <!-- Total Kalkulasi -->
        <div class="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-md px-4 py-2.5">
          <div>
            <span class="text-slate-600 block">Total Hak Pembayaran Tenant</span>
            <span class="text-[11px] text-slate-400">{{ parsedLiters }} L × {{ formatRupiah(Number(pricePerLiter) || 0) }}</span>
          </div>
          <span class="font-bold text-sm text-slate-900">{{ formatRupiah(calculatedTotal) }}</span>
        </div>

        <!-- Status Pembayaran -->
        <div>
          <label class="block font-medium text-slate-700 mb-1.5">Status Pembayaran ke Tenant *</label>
          <div class="flex gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" value="LUNAS" v-model="paymentStatus" class="accent-emerald-600" />
              <span :class="paymentStatus === 'LUNAS' ? 'font-semibold text-emerald-700' : 'text-slate-600'">Lunas (Langsung Dibayar)</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" value="BELUM LUNAS" v-model="paymentStatus" class="accent-amber-600" />
              <span :class="paymentStatus === 'BELUM LUNAS' ? 'font-semibold text-amber-700' : 'text-slate-600'">Belum Lunas (Tempo)</span>
            </label>
          </div>
        </div>

        <!-- Catatan -->
        <div>
          <label class="block font-medium text-slate-700 mb-1">Catatan Tambahan (opsional)</label>
          <input 
            v-model="notes"
            type="text"
            placeholder="Contoh: 2 jerigen kuning, minyak jernih"
            class="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <!-- Buttons -->
        <div class="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
          <button 
            type="button"
            @click="emit('close')"
            class="px-4 py-2 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer font-medium transition-colors"
          >
            Batal
          </button>
          <button 
            type="submit"
            class="px-5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium cursor-pointer transition-colors shadow-xs"
          >
            Simpan Setoran
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

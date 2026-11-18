<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { X, AlertCircle } from '@lucide/vue'
import type { VendorSaleRecord } from '../types'
import { formatLiter, formatRupiah } from '../services/storage'

const props = defineProps<{
  isOpen: boolean
  currentStockLiters: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', record: VendorSaleRecord): void
}>()

const todayStr: string = new Date().toISOString().split('T')[0] || ''

const vendorName = ref('')
const date = ref(todayStr)
const liters = ref<number | string>('')
const pricePerLiter = ref<number | ''>(10500)
const paymentStatus = ref<'LUNAS' | 'TEMPO'>('LUNAS')
const notes = ref('')

watch(() => props.isOpen, (open) => {
  if (open) {
    date.value = new Date().toISOString().split('T')[0] || ''
  }
})

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
  if (!vendorName.value.trim()) {
    alert('Masukkan nama vendor pembeli')
    return
  }
  const l = parsedLiters.value
  if (!l || l <= 0) {
    alert('Masukkan jumlah liter yang valid (> 0)')
    return
  }
  const p = Number(pricePerLiter.value)
  if (!p || p <= 0) {
    alert('Masukkan harga jual per liter yang valid')
    return
  }

  const record: VendorSaleRecord = {
    id: 'VND-' + Date.now().toString(),
    date: date.value ? date.value : todayStr,
    vendorName: vendorName.value.trim(),
    liters: l,
    pricePerLiter: p,
    totalRevenue: calculatedTotal.value,
    paymentStatus: paymentStatus.value,
    notes: notes.value.trim(),
    createdAt: new Date().toISOString()
  }

  emit('save', record)
  vendorName.value = ''
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
        <h3 class="font-semibold text-sm text-slate-900">Catat Penjualan ke Vendor</h3>
        <button 
          @click="emit('close')"
          class="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Stock notice -->
      <div class="px-5 py-2.5 bg-blue-50/60 border-b border-blue-100 flex items-center justify-between text-xs text-blue-900">
        <span>Stok minyak terkumpul saat ini:</span>
        <span class="font-bold text-blue-900">{{ formatLiter(currentStockLiters) }}</span>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="p-5 space-y-4 text-xs">
        <!-- Vendor Name -->
        <div>
          <label class="block font-medium text-slate-700 mb-1">Nama Vendor / Pembeli *</label>
          <input 
            v-model="vendorName"
            type="text"
            required
            placeholder="Contoh: PT Bioenergi Nusantara"
            class="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
          />
        </div>

        <!-- Tanggal -->
        <div>
          <label class="block font-medium text-slate-700 mb-1">Tanggal Penjualan *</label>
          <input 
            v-model="date"
            type="date"
            required
            class="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
          />
        </div>

        <!-- Liter & Harga -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-medium text-slate-700 mb-1">Volume Terjual (Liter) *</label>
            <div class="relative">
              <input 
                v-model="liters"
                type="number"
                step="any"
                min="0.001"
                placeholder="misal: 100 atau 125.5"
                required
                class="w-full border border-slate-300 rounded-md pl-3 pr-7 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
              />
              <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium">L</span>
            </div>
            <p v-if="parsedLiters > currentStockLiters" class="text-amber-600 mt-1 flex items-center gap-1 text-[11px]">
              <AlertCircle class="w-3 h-3" /> Melebihi stok saat ini ({{ formatLiter(currentStockLiters) }})
            </p>
          </div>

          <div>
            <label class="block font-medium text-slate-700 mb-1">Harga Jual per Liter (Rp) *</label>
            <input 
              v-model.number="pricePerLiter"
              type="number"
              step="100"
              min="0"
              placeholder="10500"
              required
              class="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <!-- Total Kalkulasi -->
        <div class="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-md px-4 py-2.5">
          <div>
            <span class="text-slate-600 block">Total Pendapatan dari Vendor</span>
            <span class="text-[11px] text-slate-400">{{ parsedLiters }} L × {{ formatRupiah(Number(pricePerLiter) || 0) }}</span>
          </div>
          <span class="font-bold text-sm text-emerald-700">{{ formatRupiah(calculatedTotal) }}</span>
        </div>

        <!-- Status Pembayaran -->
        <div>
          <label class="block font-medium text-slate-700 mb-1.5">Status Pembayaran dari Vendor *</label>
          <div class="flex gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" value="LUNAS" v-model="paymentStatus" class="accent-emerald-600" />
              <span :class="paymentStatus === 'LUNAS' ? 'font-semibold text-emerald-700' : 'text-slate-600'">Lunas (Sudah Diterima)</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" value="TEMPO" v-model="paymentStatus" class="accent-amber-600" />
              <span :class="paymentStatus === 'TEMPO' ? 'font-semibold text-amber-700' : 'text-slate-600'">Tempo (Piutang)</span>
            </label>
          </div>
        </div>

        <!-- Catatan -->
        <div>
          <label class="block font-medium text-slate-700 mb-1">Catatan Tambahan (opsional)</label>
          <input 
            v-model="notes"
            type="text"
            placeholder="Contoh: No Truk B 1234 CD"
            class="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
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
            class="px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium cursor-pointer transition-colors shadow-xs"
          >
            Simpan Penjualan
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

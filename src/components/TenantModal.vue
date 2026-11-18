<script setup lang="ts">
import { ref, watch } from 'vue'
import { X } from '@lucide/vue'
import type { Tenant } from '../types'

const props = defineProps<{
  isOpen: boolean
  editData?: Tenant | null
  existingCount: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', tenant: Tenant): void
}>()

const name = ref('')
const code = ref('')
const phone = ref('')
const location = ref('')
const defaultRatePerLiter = ref<number>(8000)
const notes = ref('')

watch(() => props.isOpen, (open) => {
  if (open) {
    if (props.editData) {
      name.value = props.editData.name
      code.value = props.editData.code
      phone.value = props.editData.phone
      location.value = props.editData.location
      defaultRatePerLiter.value = props.editData.defaultRatePerLiter
      notes.value = props.editData.notes || ''
    } else {
      name.value = ''
      code.value = 'TNT-' + String(props.existingCount + 1).padStart(2, '0')
      phone.value = ''
      location.value = ''
      defaultRatePerLiter.value = 8000
      notes.value = ''
    }
  }
})

function handleSubmit() {
  if (!name.value.trim()) {
    alert('Nama tenant wajib diisi')
    return
  }
  if (!location.value.trim()) {
    alert('Lokasi / unit tenant wajib diisi')
    return
  }

  const tenant: Tenant = {
    id: props.editData ? props.editData.id : 'TNT-' + Date.now().toString(),
    name: name.value.trim(),
    code: code.value.trim() || 'TNT',
    phone: phone.value.trim(),
    location: location.value.trim(),
    defaultRatePerLiter: Number(defaultRatePerLiter.value) || 6000,
    notes: notes.value.trim()
  }

  emit('save', tenant)
  emit('close')
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
    <div class="bg-white rounded-lg border border-slate-200 w-full max-w-md shadow-xl overflow-hidden">
      <!-- Header -->
      <div class="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
        <h3 class="font-semibold text-sm text-slate-900">
          {{ editData ? 'Edit Data Tenant' : 'Tambah Tenant Baru' }}
        </h3>
        <button 
          @click="emit('close')"
          class="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="p-5 space-y-4 text-xs">
        <div>
          <label class="block font-medium text-slate-700 mb-1">Nama Tenant *</label>
          <input 
            v-model="name"
            type="text"
            required
            placeholder="Contoh: Ayam Bakar Mas Mono"
            class="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:border-slate-500"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-medium text-slate-700 mb-1">Kode Tenant</label>
            <input 
              v-model="code"
              type="text"
              placeholder="TNT-06"
              class="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:border-slate-500 font-mono"
            />
          </div>
          <div>
            <label class="block font-medium text-slate-700 mb-1">No. WhatsApp / Telp</label>
            <input 
              v-model="phone"
              type="text"
              placeholder="0812-xxxx-xxxx"
              class="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:border-slate-500"
            />
          </div>
        </div>

        <div>
          <label class="block font-medium text-slate-700 mb-1">Lokasi Kios / Unit *</label>
          <input 
            v-model="location"
            type="text"
            required
            placeholder="Contoh: Foodcourt Lantai 2 No. 15"
            class="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:border-slate-500"
          />
        </div>

        <div>
          <label class="block font-medium text-slate-700 mb-1">Tarif Beli per Liter (Rp) *</label>
          <input 
            v-model.number="defaultRatePerLiter"
            type="number"
            step="100"
            min="0"
            required
            placeholder="8000"
            class="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:border-slate-500 font-semibold"
          />
          <p class="text-slate-400 mt-1">Isi 0 jika tenant ini tidak dibayar (seperti Solaria)</p>
        </div>

        <div>
          <label class="block font-medium text-slate-700 mb-1">Catatan</label>
          <input 
            v-model="notes"
            type="text"
            placeholder="misal: jadwal ambil tiap hari Jumat"
            class="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:border-slate-500"
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
            class="px-5 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-medium cursor-pointer transition-colors shadow-xs"
          >
            Simpan Tenant
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

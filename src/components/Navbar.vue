<script setup lang="ts">
import { Plus, Truck } from '@lucide/vue'

defineProps<{
  stockLiters?: number
}>()

const emit = defineEmits<{
  (e: 'open-deposit'): void
  (e: 'open-vendor-sale'): void
}>()
</script>

<template>
  <header class="bg-white border-b border-gray-200 sticky top-0 z-30">
    <div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-14 gap-2">
        <!-- Logo & Title -->
        <div class="flex items-center gap-2 sm:gap-3 min-w-0">
          <img src="/logo.png" alt="J TOWN Logo" class="h-7 sm:h-8 w-auto object-contain shrink-0" />
          <div class="h-4 w-px bg-gray-200 hidden sm:block shrink-0"></div>
          <div class="flex items-center gap-1.5 truncate">
            <span class="font-semibold text-xs sm:text-sm text-gray-900 truncate">JelantahTrack</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button 
            @click="emit('open-vendor-sale')"
            class="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 border border-slate-300 rounded-md bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-xs font-medium cursor-pointer transition-colors shadow-2xs"
            title="Catat Penjualan ke Vendor"
          >
            <Truck class="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span class="hidden sm:inline">Jual ke Vendor</span>
            <span class="sm:hidden">Jual</span>
          </button>

          <button 
            @click="emit('open-deposit')"
            class="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-medium cursor-pointer transition-colors shadow-xs"
            title="Catat Setoran Tenant"
          >
            <Plus class="w-3.5 h-3.5 shrink-0" />
            <span class="hidden sm:inline">Catat Setoran</span>
            <span class="sm:hidden">Setor</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

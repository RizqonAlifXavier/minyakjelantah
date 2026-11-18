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
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-14">
        <!-- Logo & Title -->
        <div class="flex items-center gap-3">
          <img src="/logo.png" alt="J TOWN Logo" class="h-8 w-auto object-contain" />
          <div class="h-4 w-px bg-gray-200 hidden sm:block"></div>
          <div class="flex items-center gap-1.5">
            <span class="font-semibold text-sm text-gray-900">JelantahTrack</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2">
          <button 
            @click="emit('open-vendor-sale')"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium cursor-pointer"
          >
            <Truck class="w-3.5 h-3.5" />
            <span>Jual ke Vendor</span>
          </button>

          <button 
            @click="emit('open-deposit')"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-green-600 hover:bg-green-700 text-white text-xs font-medium cursor-pointer"
          >
            <Plus class="w-4 h-4" />
            <span>Catat Setoran</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

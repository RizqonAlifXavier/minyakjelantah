<script setup lang="ts">
import { ref } from 'vue'
import { 
  X, 
  FileSpreadsheet, 
  ExternalLink, 
  Copy, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  UploadCloud, 
  DownloadCloud,
  ChevronDown,
  ChevronUp,
  HelpCircle
} from '@lucide/vue'
import type { GoogleSheetsConfig } from '../types'
import { pingGoogleSheet } from '../services/googleSheets'

const props = defineProps<{
  isOpen: boolean
  config: GoogleSheetsConfig
  isSyncing: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update-config', config: GoogleSheetsConfig): void
  (e: 'push-to-sheet'): void
  (e: 'pull-from-sheet'): void
}>()

const scriptUrlInput = ref(props.config.scriptUrl || '')
const sheetUrlInput = ref(props.config.sheetUrl || '')
const autoSync = ref(props.config.autoSync ?? true)

const isTesting = ref(false)
const testResult = ref<{ success: boolean; message: string } | null>(null)
const isCopied = ref(false)
const showScriptPreview = ref(false)

const gasScriptCode = `/**
 * GOOGLE APPS SCRIPT UNTUK BACKEND DASHBOARD MINYAK JELANTAH
 * Pasang di Google Sheets -> Ekstensi -> Apps Script
 */
function doGet(e) {
  return handleRequest(e, 'GET');
}

function doPost(e) {
  return handleRequest(e, 'POST');
}

function handleRequest(e, method) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheets(ss);

  try {
    let action = 'read';
    let payload = {};

    if (method === 'GET' && e && e.parameter) {
      action = e.parameter.action || 'read';
    } else if (method === 'POST' && e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
        action = payload.action || 'sync_all';
      } catch (err) {
        action = 'error';
      }
    }

    if (action === 'ping') {
      return jsonResponse({ status: 'success', message: 'Google Sheets API Aktif & Terhubung!', time: new Date() });
    }

    if (action === 'sync_all') {
      if (payload.tenants) saveTenants(ss, payload.tenants);
      if (payload.collections) saveCollections(ss, payload.collections);
      if (payload.vendorSales) saveVendorSales(ss, payload.vendorSales);

      return jsonResponse({
        status: 'success',
        message: 'Data berhasil disinkronkan ke Google Sheet',
        updatedAt: new Date().toISOString()
      });
    }

    const tenants = readTenants(ss);
    const collections = readCollections(ss);
    const vendorSales = readVendorSales(ss);

    return jsonResponse({
      status: 'success',
      data: { tenants, collections, vendorSales },
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    return jsonResponse({ status: 'error', message: error.toString() });
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function ensureSheets(ss) {
  const sheets = [
    { name: 'Tenants', headers: ['ID', 'Nama Tenant', 'Kode Kios', 'No Telepon', 'Lokasi', 'Harga Beli Default (Rp/L)', 'Catatan'] },
    { name: 'Setoran_Tenant', headers: ['ID', 'Tanggal', 'ID Tenant', 'Nama Tenant', 'Jumlah (Liter)', 'Harga per Liter (Rp)', 'Total Bayar (Rp)', 'Status Bayar', 'Catatan'] },
    { name: 'Penjualan_Vendor', headers: ['ID', 'Tanggal', 'Nama Vendor', 'Jumlah (Liter)', 'Harga per Liter (Rp)', 'Total Pendapatan (Rp)', 'Status Bayar', 'Catatan'] }
  ];

  sheets.forEach(cfg => {
    let sheet = ss.getSheetByName(cfg.name);
    if (!sheet) {
      sheet = ss.insertSheet(cfg.name);
      sheet.appendRow(cfg.headers);
      sheet.getRange(1, 1, 1, cfg.headers.length).setFontWeight('bold').setBackground('#10b981').setFontColor('#ffffff');
    }
  });

  const defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('Lembar1');
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch (e) {}
  }
}

function readTenants(ss) {
  const sheet = ss.getSheetByName('Tenants');
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  const result = [];
  for (let i = 1; i < values.length; i++) {
    const r = values[i];
    if (!r[0]) continue;
    result.push({ id: String(r[0]), name: String(r[1]||''), code: String(r[2]||''), phone: String(r[3]||''), location: String(r[4]||''), defaultRatePerLiter: Number(r[5])||0, notes: String(r[6]||'') });
  }
  return result;
}

function readCollections(ss) {
  const sheet = ss.getSheetByName('Setoran_Tenant');
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  const result = [];
  for (let i = 1; i < values.length; i++) {
    const r = values[i];
    if (!r[0]) continue;
    let d = r[1];
    let dateStr = d instanceof Date ? Utilities.formatDate(d, Session.getScriptTimeZone()||'Asia/Jakarta', 'yyyy-MM-dd') : String(d||'');
    result.push({ id: String(r[0]), date: dateStr, tenantId: String(r[2]||''), tenantName: String(r[3]||''), liters: Number(r[4])||0, pricePerLiter: Number(r[5])||0, totalPayment: Number(r[6])||0, paymentStatus: String(r[7]||'').toUpperCase().includes('LUNAS') && !String(r[7]).toUpperCase().includes('BELUM') ? 'LUNAS' : 'BELUM LUNAS', notes: String(r[8]||'') });
  }
  return result;
}

function readVendorSales(ss) {
  const sheet = ss.getSheetByName('Penjualan_Vendor');
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  const result = [];
  for (let i = 1; i < values.length; i++) {
    const r = values[i];
    if (!r[0]) continue;
    let d = r[1];
    let dateStr = d instanceof Date ? Utilities.formatDate(d, Session.getScriptTimeZone()||'Asia/Jakarta', 'yyyy-MM-dd') : String(d||'');
    result.push({ id: String(r[0]), date: dateStr, vendorName: String(r[2]||''), liters: Number(r[3])||0, pricePerLiter: Number(r[4])||0, totalRevenue: Number(r[5])||0, paymentStatus: String(r[6]||'').toUpperCase() === 'TEMPO' ? 'TEMPO' : 'LUNAS', notes: String(r[7]||'') });
  }
  return result;
}

function saveTenants(ss, list) {
  const sheet = ss.getSheetByName('Tenants');
  sheet.clearContents();
  sheet.appendRow(['ID', 'Nama Tenant', 'Kode Kios', 'No Telepon', 'Lokasi', 'Harga Beli Default (Rp/L)', 'Catatan']);
  sheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#10b981').setFontColor('#ffffff');
  if (list && list.length > 0) {
    const rows = list.map(t => [t.id, t.name, t.code, t.phone, t.location, t.defaultRatePerLiter, t.notes || '']);
    sheet.getRange(2, 1, rows.length, 7).setValues(rows);
  }
}

function saveCollections(ss, list) {
  const sheet = ss.getSheetByName('Setoran_Tenant');
  sheet.clearContents();
  sheet.appendRow(['ID', 'Tanggal', 'ID Tenant', 'Nama Tenant', 'Jumlah (Liter)', 'Harga per Liter (Rp)', 'Total Bayar (Rp)', 'Status Bayar', 'Catatan']);
  sheet.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#0284c7').setFontColor('#ffffff');
  if (list && list.length > 0) {
    const rows = list.map(c => [c.id, c.date, c.tenantId, c.tenantName, c.liters, c.pricePerLiter, c.totalPayment, c.paymentStatus, c.notes || '']);
    sheet.getRange(2, 1, rows.length, 9).setValues(rows);
  }
}

function saveVendorSales(ss, list) {
  const sheet = ss.getSheetByName('Penjualan_Vendor');
  sheet.clearContents();
  sheet.appendRow(['ID', 'Tanggal', 'Nama Vendor', 'Jumlah (Liter)', 'Harga per Liter (Rp)', 'Total Pendapatan (Rp)', 'Status Bayar', 'Catatan']);
  sheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#7c3aed').setFontColor('#ffffff');
  if (list && list.length > 0) {
    const rows = list.map(v => [v.id, v.date, v.vendorName, v.liters, v.pricePerLiter, v.totalRevenue, v.paymentStatus, v.notes || '']);
    sheet.getRange(2, 1, rows.length, 8).setValues(rows);
  }
}`

function copyScript() {
  navigator.clipboard.writeText(gasScriptCode)
  isCopied.value = true
  setTimeout(() => {
    isCopied.value = false
  }, 2500)
}

async function handleTestConnection() {
  if (!scriptUrlInput.value.trim()) {
    testResult.value = { success: false, message: 'Masukkan URL Google Apps Script terlebih dahulu!' }
    return
  }
  isTesting.value = true
  testResult.value = null
  const res = await pingGoogleSheet(scriptUrlInput.value.trim())
  testResult.value = res
  isTesting.value = false

  if (res.success) {
    emit('update-config', {
      scriptUrl: scriptUrlInput.value.trim(),
      sheetUrl: sheetUrlInput.value.trim(),
      autoSync: autoSync.value,
      isConnected: true,
      lastSyncedAt: new Date().toISOString()
    })
  }
}

function handleSaveConfig() {
  emit('update-config', {
    scriptUrl: scriptUrlInput.value.trim(),
    sheetUrl: sheetUrlInput.value.trim(),
    autoSync: autoSync.value,
    isConnected: testResult.value?.success || props.config.isConnected || false,
    lastSyncedAt: props.config.lastSyncedAt
  })
  emit('close')
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
    <div class="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
      <!-- Modal Header -->
      <div class="p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
        <div class="flex items-center gap-2.5">
          <div class="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <FileSpreadsheet class="w-6 h-6" />
          </div>
          <div>
            <h3 class="font-bold text-slate-900 text-base flex items-center gap-2">
              <span>Integrasi Google Sheets</span>
              <span v-if="config.isConnected && config.scriptUrl" class="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-300">
                Terhubung
              </span>
            </h3>
            <p class="text-xs text-slate-500">Simpan otomatis data tenant, setoran, dan penjualan ke Google Spreadsheet</p>
          </div>
        </div>
        <button 
          @click="emit('close')"
          class="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Scrollable Content -->
      <div class="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 flex-1">
        <!-- Setup Guide Cards -->
        <div class="bg-slate-50 border border-slate-200/90 rounded-xl p-4">
          <h4 class="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 mb-3">
            <HelpCircle class="w-4 h-4 text-emerald-600" />
            Langkah Cepat Menghubungkan Google Sheet (2 Menit)
          </h4>
          <ol class="space-y-2.5 text-xs text-slate-600 list-decimal list-inside pl-1">
            <li>
              Buka Google Sheets baru di browser: 
              <a href="https://sheets.new" target="_blank" class="inline-flex items-center gap-1 text-emerald-600 font-bold hover:underline ml-1">
                sheets.new <ExternalLink class="w-3 h-3" />
              </a>
            </li>
            <li>Klik menu <span class="font-bold text-slate-800">Ekstensi</span> (Extensions) &rarr; <span class="font-bold text-slate-800">Apps Script</span>.</li>
            <li>Hapus semua isi editor, lalu klik tombol hijau di bawah untuk <span class="font-bold text-slate-800">Salin Kode Script</span> dan paste ke editor.</li>
            <li>Klik tombol biru <span class="font-bold text-slate-800">Terapkan (Deploy)</span> &rarr; <span class="font-bold text-slate-800">Penerapan baru (New deployment)</span>.</li>
            <li>
              Pilih jenis: <span class="font-bold text-slate-800">Aplikasi web</span> (Web app) | Siapa yang memiliki akses: 
              <span class="font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">"Siapa saja" (Anyone)</span>.
            </li>
            <li>Klik Deploy & beri otorisasi akun Google. Salin URL Aplikasi Web berakhiran <code class="bg-slate-200 px-1 rounded text-slate-800 font-mono">/exec</code> lalu tempelkan ke form di bawah!</li>
          </ol>

          <!-- Copy Script Button -->
          <div class="mt-4 flex flex-wrap items-center gap-2">
            <button 
              @click="copyScript"
              class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all cursor-pointer shadow-xs"
            >
              <Check v-if="isCopied" class="w-4 h-4" />
              <Copy v-else class="w-4 h-4" />
              <span>{{ isCopied ? 'Kode Berhasil Disalin!' : 'Salin Kode Google Apps Script' }}</span>
            </button>

            <button 
              @click="showScriptPreview = !showScriptPreview"
              class="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium transition-colors cursor-pointer"
            >
              <span>Lihat Kode</span>
              <ChevronDown v-if="!showScriptPreview" class="w-3.5 h-3.5" />
              <ChevronUp v-else class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Script preview snippet -->
          <div v-if="showScriptPreview" class="mt-3">
            <div class="bg-slate-900 text-slate-200 rounded-lg p-3 font-mono text-[11px] max-h-48 overflow-y-auto border border-slate-800">
              <pre>{{ gasScriptCode }}</pre>
            </div>
            <p class="text-[11px] text-slate-500 mt-1">File juga tersedia di folder project: <code class="bg-slate-100 px-1 rounded">google-apps-script.js</code></p>
          </div>
        </div>

        <!-- Connection Settings Form -->
        <div class="space-y-4">
          <div>
            <label class="block font-semibold text-slate-800 mb-1">
              URL Aplikasi Web Google Apps Script (Web App URL) *
            </label>
            <input 
              v-model="scriptUrlInput"
              type="url"
              placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
              class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-hidden"
            />
            <p class="text-[11px] text-slate-500 mt-1">
              URL yang didapatkan saat Anda memilih "Terapkan sebagai Aplikasi Web".
            </p>
          </div>

          <div>
            <label class="block font-semibold text-slate-800 mb-1">
              Tautan Google Sheet Anda (Opsional)
            </label>
            <div class="flex gap-2">
              <input 
                v-model="sheetUrlInput"
                type="url"
                placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                class="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-hidden"
              />
              <a 
                v-if="sheetUrlInput"
                :href="sheetUrlInput" 
                target="_blank"
                class="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                title="Buka di tab baru"
              >
                <ExternalLink class="w-4 h-4" />
              </a>
            </div>
          </div>

          <!-- Test Connection & Ping Result -->
          <div class="flex items-center gap-3 pt-1">
            <button 
              @click="handleTestConnection"
              :disabled="isTesting || !scriptUrlInput"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-semibold transition-colors cursor-pointer"
            >
              <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isTesting }" />
              <span>{{ isTesting ? 'Menguji Koneksi...' : 'Uji Koneksi Google Sheet' }}</span>
            </button>

            <!-- Test status feedback -->
            <div v-if="testResult" class="flex items-center gap-1.5 text-xs font-semibold" :class="testResult.success ? 'text-emerald-700' : 'text-rose-600'">
              <CheckCircle2 v-if="testResult.success" class="w-4 h-4 text-emerald-600" />
              <AlertCircle v-else class="w-4 h-4 text-rose-600" />
              <span>{{ testResult.message }}</span>
            </div>
          </div>

          <!-- Sync Action Buttons -->
          <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <span class="font-bold text-slate-800 block text-xs">Sinkronisasi Data Manual</span>
              <span class="text-[11px] text-slate-500">Kirim data lokal ke Google Sheet atau unduh data dari Google Sheet</span>
            </div>

            <div class="flex items-center gap-2">
              <button 
                @click="emit('push-to-sheet')"
                :disabled="!scriptUrlInput || isSyncing"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold transition-colors cursor-pointer"
                title="Kirim semua data saat ini ke Google Sheet"
              >
                <UploadCloud class="w-3.5 h-3.5" />
                <span>Upload ke Sheet</span>
              </button>

              <button 
                @click="emit('pull-from-sheet')"
                :disabled="!scriptUrlInput || isSyncing"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-50 text-slate-700 font-semibold transition-colors cursor-pointer"
                title="Ambil data dari Google Sheet dan timpa lokal"
              >
                <DownloadCloud class="w-3.5 h-3.5" />
                <span>Tarik dari Sheet</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
        <label class="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer">
          <input type="checkbox" v-model="autoSync" class="rounded text-emerald-600 focus:ring-emerald-500" />
          <span>Otomatis simpan ke Google Sheet saat input data baru</span>
        </label>

        <div class="flex items-center gap-2">
          <button 
            @click="emit('close')"
            class="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition-colors cursor-pointer text-xs"
          >
            Tutup
          </button>
          <button 
            @click="handleSaveConfig"
            class="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors cursor-pointer text-xs shadow-xs"
          >
            Simpan Pengaturan
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

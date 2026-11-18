/**
 * GOOGLE APPS SCRIPT UNTUK BACKEND DASHBOARD MINYAK JELANTAH
 * 
 * PANDUAN PEMASANGAN (HANYA 2 MENIT):
 * 1. Buat Spreadsheet baru di Google Sheets (https://sheets.new)
 * 2. Klik menu "Ekstensi" (Extensions) -> "Apps Script"
 * 3. Hapus kode default yang ada di editor, lalu COPY SELURUH KODE DI BAWAH INI dan PASTE ke sana.
 * 4. Simpan dengan menekan ikon Disket (Ctrl + S).
 * 5. Klik tombol biru "Terapkan" (Deploy) di kanan atas -> pilih "Penerapan baru" (New deployment).
 * 6. Pada ikon gerigi "Pilih jenis", pilih "Aplikasi web" (Web app).
 * 7. Isi:
 *    - Keterangan: Dashboard Jelantah API
 *    - Jalankan sebagai: Saya (email Anda)
 *    - Siapa yang memiliki akses: "Siapa saja" (Anyone) -> PENTING agar dashboard web bisa mengirim & membaca data!
 * 8. Klik "Terapkan" (Deploy), lalu klik "Beri Akses" (Authorize access) dengan akun Google Anda.
 * 9. Salin "URL Aplikasi Web" (URL berakhiran /exec) dan tempelkan ke Pengaturan Google Sheet di Dashboard!
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
      // Sinkronisasi data menyeluruh dari Dashboard
      if (payload.tenants) {
        saveTenants(ss, payload.tenants);
      }
      if (payload.collections) {
        saveCollections(ss, payload.collections);
      }
      if (payload.vendorSales) {
        saveVendorSales(ss, payload.vendorSales);
      }

      return jsonResponse({
        status: 'success',
        message: 'Data berhasil disinkronkan ke Google Sheet',
        updatedAt: new Date().toISOString()
      });
    }

    // Default: Baca data dari Google Sheet
    const tenants = readTenants(ss);
    const collections = readCollections(ss);
    const vendorSales = readVendorSales(ss);

    return jsonResponse({
      status: 'success',
      data: {
        tenants: tenants,
        collections: collections,
        vendorSales: vendorSales
      },
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    return jsonResponse({
      status: 'error',
      message: error.toString()
    });
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Inisialisasi Sheet dan Header jika belum ada
function ensureSheets(ss) {
  const sheets = [
    {
      name: 'Tenants',
      headers: ['ID', 'Nama Tenant', 'Kode Kios', 'No Telepon', 'Lokasi', 'Harga Beli Default (Rp/L)', 'Catatan']
    },
    {
      name: 'Setoran_Tenant',
      headers: ['ID', 'Tanggal', 'ID Tenant', 'Nama Tenant', 'Jumlah (Liter)', 'Harga per Liter (Rp)', 'Total Bayar (Rp)', 'Status Bayar', 'Catatan']
    },
    {
      name: 'Penjualan_Vendor',
      headers: ['ID', 'Tanggal', 'Nama Vendor', 'Jumlah (Liter)', 'Harga per Liter (Rp)', 'Total Pendapatan (Rp)', 'Status Bayar', 'Catatan']
    }
  ];

  sheets.forEach(cfg => {
    let sheet = ss.getSheetByName(cfg.name);
    if (!sheet) {
      sheet = ss.insertSheet(cfg.name);
      sheet.appendRow(cfg.headers);
      sheet.getRange(1, 1, 1, cfg.headers.length)
        .setFontWeight('bold')
        .setBackground('#10b981')
        .setFontColor('#ffffff');
    }
  });

  // Hapus Sheet1 bawaan kosong jika ada dan sudah ada sheet lain
  const defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('Lembar1');
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch (e) {}
  }
}

// ================= BACA DATA =================
function readTenants(ss) {
  const sheet = ss.getSheetByName('Tenants');
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const result = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row[0]) continue;
    result.push({
      id: String(row[0]),
      name: String(row[1] || ''),
      code: String(row[2] || ''),
      phone: String(row[3] || ''),
      location: String(row[4] || ''),
      defaultRatePerLiter: Number(row[5]) || 0,
      notes: String(row[6] || '')
    });
  }
  return result;
}

function readCollections(ss) {
  const sheet = ss.getSheetByName('Setoran_Tenant');
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const result = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row[0]) continue;
    let d = row[1];
    let dateStr = '';
    if (d instanceof Date) {
      dateStr = Utilities.formatDate(d, Session.getScriptTimeZone() || 'Asia/Jakarta', 'yyyy-MM-dd');
    } else {
      dateStr = String(d || '');
    }

    result.push({
      id: String(row[0]),
      date: dateStr,
      tenantId: String(row[2] || ''),
      tenantName: String(row[3] || ''),
      liters: Number(row[4]) || 0,
      pricePerLiter: Number(row[5]) || 0,
      totalPayment: Number(row[6]) || 0,
      paymentStatus: String(row[7] || 'BELUM LUNAS').toUpperCase().includes('LUNAS') && !String(row[7]).toUpperCase().includes('BELUM') ? 'LUNAS' : 'BELUM LUNAS',
      notes: String(row[8] || '')
    });
  }
  return result;
}

function readVendorSales(ss) {
  const sheet = ss.getSheetByName('Penjualan_Vendor');
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const result = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row[0]) continue;
    let d = row[1];
    let dateStr = '';
    if (d instanceof Date) {
      dateStr = Utilities.formatDate(d, Session.getScriptTimeZone() || 'Asia/Jakarta', 'yyyy-MM-dd');
    } else {
      dateStr = String(d || '');
    }

    result.push({
      id: String(row[0]),
      date: dateStr,
      vendorName: String(row[2] || ''),
      liters: Number(row[3]) || 0,
      pricePerLiter: Number(row[4]) || 0,
      totalRevenue: Number(row[5]) || 0,
      paymentStatus: String(row[6] || 'LUNAS').toUpperCase() === 'TEMPO' ? 'TEMPO' : 'LUNAS',
      notes: String(row[7] || '')
    });
  }
  return result;
}

// ================= SIMPAN / TULIS DATA =================
function saveTenants(ss, list) {
  const sheet = ss.getSheetByName('Tenants');
  sheet.clearContents();
  sheet.appendRow(['ID', 'Nama Tenant', 'Kode Kios', 'No Telepon', 'Lokasi', 'Harga Beli Default (Rp/L)', 'Catatan']);
  sheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#10b981').setFontColor('#ffffff');

  if (list && list.length > 0) {
    const rows = list.map(t => [
      t.id,
      t.name,
      t.code,
      t.phone,
      t.location,
      t.defaultRatePerLiter,
      t.notes || ''
    ]);
    sheet.getRange(2, 1, rows.length, 7).setValues(rows);
  }
}

function saveCollections(ss, list) {
  const sheet = ss.getSheetByName('Setoran_Tenant');
  sheet.clearContents();
  sheet.appendRow(['ID', 'Tanggal', 'ID Tenant', 'Nama Tenant', 'Jumlah (Liter)', 'Harga per Liter (Rp)', 'Total Bayar (Rp)', 'Status Bayar', 'Catatan']);
  sheet.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#0284c7').setFontColor('#ffffff');

  if (list && list.length > 0) {
    const rows = list.map(c => [
      c.id,
      c.date,
      c.tenantId,
      c.tenantName,
      c.liters,
      c.pricePerLiter,
      c.totalPayment,
      c.paymentStatus,
      c.notes || ''
    ]);
    sheet.getRange(2, 1, rows.length, 9).setValues(rows);
  }
}

function saveVendorSales(ss, list) {
  const sheet = ss.getSheetByName('Penjualan_Vendor');
  sheet.clearContents();
  sheet.appendRow(['ID', 'Tanggal', 'Nama Vendor', 'Jumlah (Liter)', 'Harga per Liter (Rp)', 'Total Pendapatan (Rp)', 'Status Bayar', 'Catatan']);
  sheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#7c3aed').setFontColor('#ffffff');

  if (list && list.length > 0) {
    const rows = list.map(v => [
      v.id,
      v.date,
      v.vendorName,
      v.liters,
      v.pricePerLiter,
      v.totalRevenue,
      v.paymentStatus,
      v.notes || ''
    ]);
    sheet.getRange(2, 1, rows.length, 8).setValues(rows);
  }
}

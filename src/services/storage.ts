import type { Tenant, CollectionRecord, VendorSaleRecord, GoogleSheetsConfig, TenantStat } from '../types'

const STORAGE_KEYS = {
  TENANTS: 'jelantah_tenants_v3',
  COLLECTIONS: 'jelantah_collections_v3',
  VENDOR_SALES: 'jelantah_vendor_sales_v3',
  CONFIG: 'jelantah_gsheet_config_v3',
}

export const INITIAL_TENANTS: Tenant[] = [
  {
    id: 'TNT-001',
    name: 'Bakmie Now',
    code: 'BN-01',
    phone: '0812-1100-2201',
    location: 'Jtown Lantai 1',
    defaultRatePerLiter: 8000,
    notes: 'Tarif beli Rp 8.000 / Liter'
  },
  {
    id: 'TNT-002',
    name: 'Agam',
    code: 'AG-02',
    phone: '0813-2200-3302',
    location: 'Jtown Lantai dasar',
    defaultRatePerLiter: 8000,
    notes: 'Tarif beli Rp 8.000 / Liter'
  },
  {
    id: 'TNT-003',
    name: 'Tomlex',
    code: 'TX-03',
    phone: '0857-3300-4403',
    location: 'Jtown Lantai 2',
    defaultRatePerLiter: 8000,
    notes: 'Tarif beli Rp 8.000 / Liter'
  },
  {
    id: 'TNT-004',
    name: 'Biranda',
    code: 'BR-04',
    phone: '0821-4400-5504',
    location: 'Jtown Lantai 1',
    defaultRatePerLiter: 8000,
    notes: 'Tarif beli Rp 8.000 / Liter'
  },
  {
    id: 'TNT-005',
    name: 'Streetsushi',
    code: 'SS-05',
    phone: '0878-5500-6605',
    location: 'Jtown Lantai 1',
    defaultRatePerLiter: 8000,
    notes: 'Tarif beli Rp 8.000 / Liter'
  },
  {
    id: 'TNT-006',
    name: 'Solaria',
    code: 'SL-06',
    phone: '0811-6600-7706',
    location: 'Jtown Lantai Dasar',
    defaultRatePerLiter: 0,
    notes: 'Tidak dibeli (Rp 0 / Liter - Pengambilan Tanpa Biaya)'
  }
]

// Data setoran dan penjualan murni berasal dari inputan pengguna yang tersinkronisasi ke Google Sheet
export const INITIAL_COLLECTIONS: CollectionRecord[] = []
export const INITIAL_VENDOR_SALES: VendorSaleRecord[] = []

export function loadTenants(): Tenant[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TENANTS)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Error reading tenants from localStorage', e)
  }
  saveTenants(INITIAL_TENANTS)
  return INITIAL_TENANTS
}

export function saveTenants(tenants: Tenant[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TENANTS, JSON.stringify(tenants))
  } catch (e) {
    console.error('Error saving tenants', e)
  }
}

export function loadCollections(): CollectionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COLLECTIONS)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Error reading collections from localStorage', e)
  }
  return []
}

export function saveCollections(collections: CollectionRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(collections))
  } catch (e) {
    console.error('Error saving collections', e)
  }
}

export function loadVendorSales(): VendorSaleRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VENDOR_SALES)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Error reading vendor sales from localStorage', e)
  }
  return []
}

export function saveVendorSales(sales: VendorSaleRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.VENDOR_SALES, JSON.stringify(sales))
  } catch (e) {
    console.error('Error saving vendor sales', e)
  }
}

export function loadConfig(): GoogleSheetsConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Error reading config', e)
  }
  return {
    scriptUrl: '',
    sheetUrl: '',
    autoSync: true,
    isConnected: false
  }
}

export function saveConfig(config: GoogleSheetsConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config))
  } catch (e) {
    console.error('Error saving config', e)
  }
}

export function resetToDefaults(): {
  tenants: Tenant[]
  collections: CollectionRecord[]
  vendorSales: VendorSaleRecord[]
} {
  saveTenants(INITIAL_TENANTS)
  saveCollections([])
  saveVendorSales([])
  return {
    tenants: INITIAL_TENANTS,
    collections: [],
    vendorSales: []
  }
}

// Helpers format
export function formatLiter(liters: number | string): string {
  const num = typeof liters === 'string' ? parseFloat(liters) : liters
  if (isNaN(num)) return '0 L'
  const rounded = Math.round(num * 100) / 100
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  }).format(rounded) + ' L'
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  }).format(amount || 0)
}

// Hitung statistik per tenant
export function calculateTenantStats(
  tenants: Tenant[],
  collections: CollectionRecord[]
): TenantStat[] {
  return tenants.map(tenant => {
    const tenantCollections = collections.filter(c => c.tenantId === tenant.id)
    const rawLiters = tenantCollections.reduce((sum, c) => sum + (Number(c.liters) || 0), 0)
    const totalLiters = Math.round(rawLiters * 100) / 100
    
    const totalPaid = tenantCollections
      .filter(c => c.paymentStatus === 'LUNAS')
      .reduce((sum, c) => sum + (Number(c.totalPayment) || 0), 0)

    const totalPending = tenantCollections
      .filter(c => c.paymentStatus === 'BELUM LUNAS')
      .reduce((sum, c) => sum + (Number(c.totalPayment) || 0), 0)

    // Sort untuk tanggal setoran terakhir
    const sorted = [...tenantCollections].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const lastDepositDate: string | null = sorted[0]?.date ? sorted[0].date : null

    return {
      tenant,
      totalLiters,
      totalPaid,
      totalPending,
      totalTransactions: tenantCollections.length,
      lastDepositDate
    }
  })
}

// Export CSV util
export function exportToCSV(filename: string, rows: (string | number)[][]): void {
  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
    rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n')
  
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

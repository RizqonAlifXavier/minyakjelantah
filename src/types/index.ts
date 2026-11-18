export interface Tenant {
  id: string
  name: string
  code: string
  phone: string
  location: string
  defaultRatePerLiter: number
  notes?: string
}

export interface CollectionRecord {
  id: string
  date: string // YYYY-MM-DD
  tenantId: string
  tenantName: string
  liters: number
  pricePerLiter: number
  totalPayment: number
  paymentStatus: 'LUNAS' | 'BELUM LUNAS'
  notes?: string
  createdAt?: string
}

export interface VendorSaleRecord {
  id: string
  date: string // YYYY-MM-DD
  vendorName: string
  liters: number
  pricePerLiter: number
  totalRevenue: number
  paymentStatus: 'LUNAS' | 'TEMPO'
  notes?: string
  createdAt?: string
}

export interface GoogleSheetsConfig {
  scriptUrl: string
  sheetId?: string
  sheetUrl?: string
  autoSync: boolean
  lastSyncedAt?: string
  isConnected?: boolean
}

export interface TenantStat {
  tenant: Tenant
  totalLiters: number
  totalPaid: number
  totalPending: number
  totalTransactions: number
  lastDepositDate: string | null
}

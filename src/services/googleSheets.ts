import type { Tenant, CollectionRecord, VendorSaleRecord } from '../types'

export interface SheetApiResponse {
  status: 'success' | 'error'
  message?: string
  data?: {
    tenants: Tenant[]
    collections: CollectionRecord[]
    vendorSales: VendorSaleRecord[]
  }
  updatedAt?: string
}

export async function pingGoogleSheet(scriptUrl: string): Promise<{ success: boolean; message: string }> {
  try {
    const url = new URL(scriptUrl)
    url.searchParams.set('action', 'ping')
    url.searchParams.set('_t', Date.now().toString())

    const response = await fetch(url.toString(), {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    if (data.status === 'success') {
      return { success: true, message: data.message || 'Berhasil terhubung ke Google Sheet!' }
    } else {
      return { success: false, message: data.message || 'Respon Google Sheet tidak sesuai.' }
    }
  } catch (err: any) {
    console.error('Error pinging Google Sheet:', err)
    return {
      success: false,
      message: err.message || 'Gagal menghubungi Google Sheet. Pastikan URL benar dan izin akses "Anyone" (Siapa saja).'
    }
  }
}

export async function fetchGoogleSheetData(scriptUrl: string): Promise<SheetApiResponse> {
  const url = new URL(scriptUrl)
  url.searchParams.set('action', 'read')
  url.searchParams.set('_t', Date.now().toString())

  const response = await fetch(url.toString(), {
    method: 'GET',
  })

  if (!response.ok) {
    throw new Error(`Gagal memuat data (HTTP ${response.status})`)
  }

  return await response.json()
}

export async function syncAllToGoogleSheet(
  scriptUrl: string,
  payload: {
    tenants: Tenant[]
    collections: CollectionRecord[]
    vendorSales: VendorSaleRecord[]
  }
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'sync_all',
        ...payload
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return {
      success: result.status === 'success',
      message: result.message || 'Sinkronisasi berhasil!'
    }
  } catch (err: any) {
    console.error('Error syncing to Google Sheet:', err)
    return {
      success: false,
      message: err.message || 'Gagal mengirim data ke Google Sheet.'
    }
  }
}

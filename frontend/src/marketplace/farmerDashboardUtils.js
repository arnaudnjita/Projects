export const productStatuses = [
  { label: 'Active', value: 'active' },
  { label: 'Sold out', value: 'sold_out' },
  { label: 'Inactive', value: 'inactive' },
]

export function totalListingCount(counts = {}) {
  return Number(counts.active || 0) + Number(counts.sold_out || 0) + Number(counts.inactive || 0)
}

export function canSetStatus(product, status) {
  if (status === 'active' && Number(product?.quantityAvailable || 0) === 0) {
    return {
      allowed: false,
      reason: 'Add quantity before marking this product active. A zero-quantity product cannot be active.',
    }
  }

  return { allowed: true, reason: '' }
}

export function validateQuantityInput(value) {
  const quantity = Number(value)

  if (!Number.isFinite(quantity) || quantity < 0) {
    return {
      error: 'Quantity must be a valid non-negative number.',
      quantity: null,
    }
  }

  return { error: '', quantity }
}

export function farmerDashboardParamsFromSearchParams(searchParams) {
  return {
    page: Number(searchParams.get('page') || 1),
    pageSize: Number(searchParams.get('pageSize') || 10),
    search: searchParams.get('search') || '',
    sort: searchParams.get('sort') || 'newest',
    status: searchParams.get('status') || '',
  }
}

export function cleanFarmerDashboardParams(values) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null && value !== '' && !(key === 'page' && Number(value) === 1)) {
      params.set(key, String(value))
    }
  }

  return params
}

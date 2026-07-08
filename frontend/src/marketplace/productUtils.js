import { getApiOrigin } from '../api/apiConfig.js'

export const marketplaceSortOptions = [
  { label: 'Newest', value: 'newest' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'Price low to high', value: 'price_asc' },
  { label: 'Price high to low', value: 'price_desc' },
]

export function formatXafPrice(value) {
  return `${new Intl.NumberFormat('en-CM', {
    maximumFractionDigits: 0,
  }).format(Number(value || 0))} XAF`
}

export function publicAssetUrl(path) {
  if (!path) {
    return null
  }

  if (/^https?:\/\//i.test(path) || path.startsWith('data:')) {
    return path
  }

  return `${getApiOrigin()}${path.startsWith('/') ? path : `/${path}`}`
}

export function buildWhatsAppHref(product) {
  const digits = product?.farmer?.whatsappDigits
  const message = product?.farmer?.whatsappMessage

  if (!digits) {
    return null
  }

  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ''}`
}

export function marketplaceParamsFromSearchParams(searchParams) {
  return {
    category: searchParams.get('category') || '',
    location: searchParams.get('location') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    minPrice: searchParams.get('minPrice') || '',
    page: Number(searchParams.get('page') || 1),
    pageSize: Number(searchParams.get('pageSize') || 12),
    search: searchParams.get('search') || '',
    sort: searchParams.get('sort') || 'newest',
  }
}

export function cleanMarketplaceParams(values) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null && value !== '' && !(key === 'page' && Number(value) === 1)) {
      params.set(key, String(value))
    }
  }

  return params
}

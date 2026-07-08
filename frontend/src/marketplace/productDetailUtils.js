import { buildWhatsAppHref, publicAssetUrl } from './productUtils.js'

export function normalizePhoneDigits(phone) {
  return String(phone || '').replace(/\D/g, '')
}

export function buildTelHref(phone) {
  const digits = normalizePhoneDigits(phone)
  return digits ? `tel:+${digits}` : null
}

export function getProductImages(product) {
  const images = Array.isArray(product?.images) ? product.images : []

  return images.map((image) => ({
    ...image,
    displayUrl: publicAssetUrl(image.imageUrl),
    thumbnailUrl: publicAssetUrl(image.thumbnailUrl || image.imageUrl),
  }))
}

export function getPrimaryImage(images, selectedIndex = 0) {
  if (images.length === 0) {
    return null
  }

  return images[Math.min(Math.max(selectedIndex, 0), images.length - 1)]
}

export function buildProductWhatsAppHref(product) {
  const fallbackDigits = normalizePhoneDigits(product?.farmer?.whatsappPhone || product?.farmer?.phone)

  if (product?.farmer?.whatsappDigits) {
    return buildWhatsAppHref(product)
  }

  if (!fallbackDigits) {
    return null
  }

  const message = `Hello, I saw your ${product.name} listing on CultivaX. Is it still available?`
  return `https://wa.me/${fallbackDigits}?text=${encodeURIComponent(message)}`
}

export function fireContactClick(productId, recordContactClick) {
  if (!productId || !recordContactClick) {
    return
  }

  void recordContactClick(productId).catch(() => {})
}

export function isNotFoundError(error) {
  return error?.status === 404 || error?.code === 'NOT_FOUND'
}

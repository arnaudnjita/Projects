import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  buildProductWhatsAppHref,
  buildTelHref,
  fireContactClick,
  isNotFoundError,
  normalizePhoneDigits,
} from './productDetailUtils.js'

test('builds correct wa.me URL and encodes product names', () => {
  const href = buildProductWhatsAppHref({
    farmer: { whatsappPhone: '+237 655 66 77 88' },
    name: 'Sweet Pepper & Yam',
  })

  assert.equal(
    href,
    'https://wa.me/237655667788?text=Hello%2C%20I%20saw%20your%20Sweet%20Pepper%20%26%20Yam%20listing%20on%20CultivaX.%20Is%20it%20still%20available%3F',
  )
})

test('formats visible phone values for phone fallback', () => {
  assert.equal(normalizePhoneDigits('+237 655 66 77 88'), '237655667788')
  assert.equal(buildTelHref('+237 655 66 77 88'), 'tel:+237655667788')
})

test('fires contact log without requiring callers to await it', async () => {
  let calledWith = null
  fireContactClick(42, async (productId) => {
    calledWith = productId
  })

  await new Promise((resolve) => setTimeout(resolve, 0))
  assert.equal(calledWith, 42)
})

test('detects 404 product-detail errors', () => {
  assert.equal(isNotFoundError({ status: 404 }), true)
  assert.equal(isNotFoundError({ status: 500 }), false)
})

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { buildWhatsAppHref, cleanMarketplaceParams, formatXafPrice, marketplaceParamsFromSearchParams } from './productUtils.js'

test('formats XAF prices without decimals', () => {
  assert.match(formatXafPrice(1200), /1,200|1\s?200/)
  assert.match(formatXafPrice(1200), /XAF/)
})

test('builds WhatsApp links from trusted product fields', () => {
  const href = buildWhatsAppHref({
    farmer: {
      whatsappDigits: '237655667788',
      whatsappMessage: 'Hello CultivaX',
    },
  })

  assert.equal(href, 'https://wa.me/237655667788?text=Hello%20CultivaX')
})

test('parses and cleans marketplace query parameters', () => {
  const parsed = marketplaceParamsFromSearchParams(new URLSearchParams('search=yam&sort=price_asc&page=2'))
  const cleaned = cleanMarketplaceParams({ ...parsed, location: '', page: 1 })

  assert.equal(parsed.search, 'yam')
  assert.equal(parsed.page, 2)
  assert.equal(cleaned.get('search'), 'yam')
  assert.equal(cleaned.has('location'), false)
  assert.equal(cleaned.has('page'), false)
})

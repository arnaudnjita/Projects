import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  canSetStatus,
  cleanFarmerDashboardParams,
  farmerDashboardParamsFromSearchParams,
  totalListingCount,
  validateQuantityInput,
} from './farmerDashboardUtils.js'

test('summarizes farmer dashboard counts', () => {
  assert.equal(totalListingCount({ active: 2, inactive: 1, sold_out: 3 }), 6)
})

test('prevents active status for zero quantity products', () => {
  const result = canSetStatus({ quantityAvailable: 0 }, 'active')
  assert.equal(result.allowed, false)
  assert.match(result.reason, /zero-quantity/)
})

test('validates quantity update values', () => {
  assert.equal(validateQuantityInput('4.5').quantity, 4.5)
  assert.equal(validateQuantityInput('-1').error, 'Quantity must be a valid non-negative number.')
})

test('parses and cleans farmer dashboard query params', () => {
  const parsed = farmerDashboardParamsFromSearchParams(new URLSearchParams('status=active&search=yam&page=2'))
  const cleaned = cleanFarmerDashboardParams({ ...parsed, page: 1, status: '' })

  assert.equal(parsed.status, 'active')
  assert.equal(parsed.page, 2)
  assert.equal(cleaned.get('search'), 'yam')
  assert.equal(cleaned.has('status'), false)
})

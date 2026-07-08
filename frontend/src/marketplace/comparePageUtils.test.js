import assert from 'node:assert/strict'
import { test } from 'node:test'

import { comparisonRows, isUnavailableCompareError } from './comparePageUtils.js'

test('detects missing or inactive comparison products', () => {
  assert.equal(isUnavailableCompareError({ code: 'PRODUCTS_UNAVAILABLE' }), true)
  assert.equal(isUnavailableCompareError({ status: 404 }), true)
  assert.equal(isUnavailableCompareError({ status: 422 }), false)
})

test('builds accessible comparison rows', () => {
  const rows = comparisonRows([
    {
      category: { name: 'Tubers' },
      farmer: { accountLocation: 'Molyko', name: 'Farmer One' },
      name: 'Yam',
      quantityAvailable: 3,
      unit: 'basket',
    },
  ])

  assert.equal(rows.find((row) => row.key === 'name').values[0], 'Yam')
  assert.equal(rows.find((row) => row.key === 'location').values[0], 'Molyko')
})

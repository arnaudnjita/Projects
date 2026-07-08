import assert from 'node:assert/strict'
import { test } from 'node:test'

import { canCompare, parseStoredCompareIds, sanitizeCompareIds, toggleCompareId } from './compareStorage.js'

test('adds and removes compare IDs', () => {
  assert.deepEqual(toggleCompareId([], 4), [4])
  assert.deepEqual(toggleCompareId([4], 4), [])
})

test('prevents duplicates and enforces four product limit', () => {
  assert.deepEqual(sanitizeCompareIds([1, 1, 2, 3, 4, 5]), [1, 2, 3, 4])
  assert.deepEqual(toggleCompareId([1, 2, 3, 4], 5), [1, 2, 3, 4])
})

test('restores and recovers localStorage values safely', () => {
  assert.deepEqual(parseStoredCompareIds('[3,2,2,"bad",1]'), [3, 2, 1])
  assert.deepEqual(parseStoredCompareIds('{bad json'), [])
})

test('requires at least two products before comparison', () => {
  assert.equal(canCompare([1]), false)
  assert.equal(canCompare([1, 2]), true)
})

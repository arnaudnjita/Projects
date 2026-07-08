export const compareStorageKey = 'cultivax.compareProductIds'
export const maxCompareProducts = 4
export const compareSelectionEvent = 'cultivax:compare-selection-change'

export function sanitizeCompareIds(value) {
  const ids = Array.isArray(value) ? value : []
  const uniqueIds = []

  for (const id of ids) {
    const numericId = Number(id)

    if (Number.isInteger(numericId) && numericId > 0 && !uniqueIds.includes(numericId)) {
      uniqueIds.push(numericId)
    }

    if (uniqueIds.length === maxCompareProducts) {
      break
    }
  }

  return uniqueIds
}

export function parseStoredCompareIds(rawValue) {
  try {
    return sanitizeCompareIds(JSON.parse(rawValue || '[]'))
  } catch {
    return []
  }
}

export function toggleCompareId(ids, productId) {
  const currentIds = sanitizeCompareIds(ids)
  const numericId = Number(productId)

  if (!Number.isInteger(numericId) || numericId < 1) {
    return currentIds
  }

  if (currentIds.includes(numericId)) {
    return currentIds.filter((id) => id !== numericId)
  }

  if (currentIds.length >= maxCompareProducts) {
    return currentIds
  }

  return [...currentIds, numericId]
}

export function canCompare(ids) {
  return sanitizeCompareIds(ids).length >= 2
}

export function readCompareIds(storage = globalThis.localStorage) {
  if (!storage) {
    return []
  }

  return parseStoredCompareIds(storage.getItem(compareStorageKey))
}

export function writeCompareIds(ids, storage = globalThis.localStorage, win = globalThis.window) {
  const sanitizedIds = sanitizeCompareIds(ids)

  if (storage) {
    storage.setItem(compareStorageKey, JSON.stringify(sanitizedIds))
  }

  if (win?.dispatchEvent) {
    win.dispatchEvent(new CustomEvent(compareSelectionEvent, { detail: sanitizedIds }))
  }

  return sanitizedIds
}

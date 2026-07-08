import { useCallback, useEffect, useMemo, useState } from 'react'

const storageKey = 'cultivax.compareProductIds'
const maxCompareProducts = 4

function readStoredIds() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) || '[]')
    return Array.isArray(parsed) ? parsed.filter(Number.isInteger).slice(0, maxCompareProducts) : []
  } catch {
    return []
  }
}

function writeStoredIds(ids) {
  window.localStorage.setItem(storageKey, JSON.stringify(ids.slice(0, maxCompareProducts)))
}

export function useCompareSelection() {
  const [selectedIds, setSelectedIds] = useState(() => readStoredIds())

  useEffect(() => {
    writeStoredIds(selectedIds)
  }, [selectedIds])

  const toggleProduct = useCallback((productId) => {
    setSelectedIds((current) => {
      if (current.includes(productId)) {
        return current.filter((id) => id !== productId)
      }

      if (current.length >= maxCompareProducts) {
        return current
      }

      return [...current, productId]
    })
  }, [])

  return useMemo(
    () => ({
      isSelected(productId) {
        return selectedIds.includes(productId)
      },
      maxCompareProducts,
      selectedCount: selectedIds.length,
      selectedIds,
      toggleProduct,
    }),
    [selectedIds, toggleProduct],
  )
}

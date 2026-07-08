import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  compareSelectionEvent,
  maxCompareProducts,
  readCompareIds,
  toggleCompareId,
  writeCompareIds,
} from './compareStorage'

export function useCompareSelection() {
  const [selectedIds, setSelectedIds] = useState(() => readCompareIds())

  useEffect(() => {
    function handleSelectionChange(event) {
      setSelectedIds(Array.isArray(event.detail) ? event.detail : readCompareIds())
    }

    window.addEventListener(compareSelectionEvent, handleSelectionChange)
    return () => window.removeEventListener(compareSelectionEvent, handleSelectionChange)
  }, [])

  const toggleProduct = useCallback((productId) => {
    setSelectedIds((current) => {
      const nextIds = toggleCompareId(current, productId)
      writeCompareIds(nextIds)
      return nextIds
    })
  }, [])

  const removeProduct = useCallback((productId) => {
    setSelectedIds((current) => {
      const nextIds = current.filter((id) => id !== Number(productId))
      writeCompareIds(nextIds)
      return nextIds
    })
  }, [])

  const clearSelection = useCallback(() => {
    writeCompareIds([])
    setSelectedIds([])
  }, [])

  return useMemo(
    () => ({
      canCompare: selectedIds.length >= 2,
      clearSelection,
      isSelected(productId) {
        return selectedIds.includes(productId)
      },
      maxCompareProducts,
      removeProduct,
      selectedCount: selectedIds.length,
      selectedIds,
      toggleProduct,
    }),
    [clearSelection, removeProduct, selectedIds, toggleProduct],
  )
}

import { Scale, X } from 'lucide-react'
import { Link } from 'react-router-dom'

import Button from '../components/Button'
import { useCompareSelection } from './useCompareSelection'

function CompareTray() {
  const compare = useCompareSelection()

  if (compare.selectedCount === 0) {
    return null
  }

  return (
    <aside className="compare-tray" aria-label="Product comparison selection">
      <div>
        <p className="compare-tray__title">
          <Scale size={18} aria-hidden="true" />
          {compare.selectedCount} of {compare.maxCompareProducts} selected
        </p>
        <p>Select at least two products to compare.</p>
      </div>
      <div className="compare-tray__actions">
        {compare.canCompare ? (
          <Button as={Link} to="/compare" variant="secondary">
            Compare
          </Button>
        ) : (
          <Button disabled variant="secondary">
            Compare
          </Button>
        )}
        <button className="icon-button" type="button" onClick={compare.clearSelection} aria-label="Clear comparison selection">
          <X size={18} />
        </button>
      </div>
    </aside>
  )
}

export default CompareTray

import { ChevronLeft, ChevronRight } from 'lucide-react'

function Pagination({ onNext, onPrevious, page = 1, pageCount = 1 }) {
  return (
    <nav aria-label="Pagination" className="pagination">
      <button aria-label="Previous page" className="icon-button" disabled={page <= 1} onClick={onPrevious} type="button">
        <ChevronLeft size={20} />
      </button>
      <span>
        Page {page} of {pageCount}
      </span>
      <button aria-label="Next page" className="icon-button" disabled={page >= pageCount} onClick={onNext} type="button">
        <ChevronRight size={20} />
      </button>
    </nav>
  )
}

export default Pagination

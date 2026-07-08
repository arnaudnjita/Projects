import { Leaf } from 'lucide-react'

function BrandMark() {
  return (
    <span className="brand-mark" aria-label="CultivaX">
      <span className="brand-mark__leaf" aria-hidden="true">
        <Leaf size={22} strokeWidth={2.4} />
      </span>
      <span className="brand-mark__text">CultivaX</span>
    </span>
  )
}

export default BrandMark

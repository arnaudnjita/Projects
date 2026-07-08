import { EmptyState, ErrorState, Skeleton } from '../components/Feedback'
import ProductCard from './ProductCard'

function ProductGrid({ compare, error, isLoading, onRetry, products = [] }) {
  if (isLoading) {
    return (
      <div className="product-grid" aria-label="Loading products">
        {Array.from({ length: 6 }, (_, index) => (
          <div className="product-card product-card--skeleton" key={index}>
            <Skeleton lines={4} />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return <ErrorState title="Products could not load" message={error.message} onRetry={onRetry} />
  }

  if (products.length === 0) {
    return <EmptyState title="No products found" message="Try changing your search or filters." />
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard compare={compare} key={product.productId} product={product} />
      ))}
    </div>
  )
}

export default ProductGrid

import { useQuery } from '@tanstack/react-query'
import { MessageCircle, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'

import { recordContactClick } from '../api/contactClickApi'
import * as productsApi from '../api/productsApi'
import { queryKeys } from '../api/queryKeys'
import Button from '../components/Button'
import { Badge, EmptyState, ErrorState, Skeleton } from '../components/Feedback'
import {
  comparisonRows,
  isUnavailableCompareError,
} from '../marketplace/comparePageUtils'
import { fireContactClick } from '../marketplace/productDetailUtils'
import { buildWhatsAppHref, formatXafPrice, publicAssetUrl } from '../marketplace/productUtils'
import { useCompareSelection } from '../marketplace/useCompareSelection'
import PageTitle from './PageTitle'

function ComparePage() {
  const compare = useCompareSelection()
  const compareQuery = useQuery({
    enabled: compare.canCompare,
    queryFn: ({ signal }) => productsApi.compareProducts(compare.selectedIds, { signal }),
    queryKey: queryKeys.products.compare(compare.selectedIds),
  })
  const products = compareQuery.data?.products || []

  if (!compare.canCompare) {
    return (
      <>
        <PageTitle title="Compare Products" description="Compare two to four CultivaX listings side by side." />
        <EmptyState
          title="Choose at least two products"
          message="Use the Compare control on product cards to select two to four listings."
          action={
            <Button as={Link} to="/marketplace">
              Browse products
            </Button>
          }
        />
      </>
    )
  }

  if (compareQuery.isLoading) {
    return (
      <section className="comparison-page" aria-label="Loading comparison">
        <Skeleton lines={6} />
      </section>
    )
  }

  if (compareQuery.error) {
    if (isUnavailableCompareError(compareQuery.error)) {
      return (
        <ErrorState
          title="Some products are no longer available"
          message="A selected product may have been deleted or made inactive. Remove it from your comparison and try again."
          onRetry={() => compareQuery.refetch()}
        />
      )
    }

    return <ErrorState title="Comparison could not load" message={compareQuery.error.message} onRetry={() => compareQuery.refetch()} />
  }

  return (
    <>
      <PageTitle title="Compare Products" description="Compare selected CultivaX products side by side." />
      <div className="comparison-page">
        <div className="section-heading">
          <div>
            <Badge tone="accent">Product comparison</Badge>
            <h1>Compare listings</h1>
            <p>Compare product details without assuming prices are equivalent across different units.</p>
          </div>
          <Button onClick={compare.clearSelection} variant="ghost">
            <Trash2 size={17} aria-hidden="true" />
            Clear all
          </Button>
        </div>

        <p className="comparison-scroll-hint">Scroll sideways on smaller screens to view all selected products.</p>

        <div className="comparison-table-wrap">
          <table className="comparison-table">
            <caption>Comparison for selected CultivaX listings</caption>
            <thead>
              <tr>
                <th scope="col">Field</th>
                {products.map((product) => (
                  <th key={product.productId} scope="col">
                    <div className="comparison-table__product-heading">
                      <span>{product.name}</span>
                      <button
                        className="icon-button"
                        type="button"
                        onClick={() => compare.removeProduct(product.productId)}
                        aria-label={`Remove ${product.name} from comparison`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonRows(products).map((row) => (
                <tr key={row.key}>
                  <th scope="row">{row.label}</th>
                  {products.map((product, index) => (
                    <td key={product.productId}>{renderComparisonCell(row, product, index)}</td>
                  ))}
                </tr>
              ))}
              <tr>
                <th scope="row">Contact</th>
                {products.map((product) => (
                  <td key={product.productId}>
                    <ContactLink product={product} />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function renderComparisonCell(row, product, index) {
  if (row.type === 'image') {
    return (
      <Link to={`/products/${product.productId}`} aria-label={`View ${product.name}`}>
        <img
          alt={product.name}
          className="comparison-table__image"
          height="120"
          loading="lazy"
          src={publicAssetUrl(product.thumbnailUrl) || placeholderImage}
          width="160"
        />
      </Link>
    )
  }

  if (row.type === 'price') {
    return `${formatXafPrice(product.price)} / ${product.unit}`
  }

  if (row.type === 'date') {
    return formatDate(product.createdAt)
  }

  return row.values[index]
}

function ContactLink({ product }) {
  const href = buildWhatsAppHref(product)

  if (!href) {
    return 'No WhatsApp number'
  }

  return (
    <Button
      as="a"
      href={href}
      onClick={() => fireContactClick(product.productId, recordContactClick)}
      rel="noopener noreferrer"
      target="_blank"
      variant="secondary"
    >
      <MessageCircle size={17} aria-hidden="true" />
      WhatsApp
    </Button>
  )
}

function formatDate(value) {
  if (!value) {
    return 'Recently'
  }

  return new Intl.DateTimeFormat('en-CM', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

const placeholderImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 360'%3E%3Crect width='640' height='360' fill='%23eef2ec'/%3E%3Cpath d='M214 227c52-92 138-126 250-102-17 100-93 151-202 127-19-4-34-12-48-25z' fill='%23123F2D'/%3E%3Ccircle cx='232' cy='154' r='52' fill='%23F28C28'/%3E%3C/svg%3E"

export default ComparePage

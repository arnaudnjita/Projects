import { MessageCircle, Scale } from 'lucide-react'
import { Link } from 'react-router-dom'

import { recordContactClick } from '../api/contactClickApi'
import Button from '../components/Button'
import { Badge, Card } from '../components/Feedback'
import ResponsiveImage from '../components/ResponsiveImage'
import { buildWhatsAppHref, formatXafPrice, publicAssetUrl } from './productUtils'

function ProductCard({ compare, product }) {
  const detailPath = `/products/${product.productId}`
  const whatsappHref = buildWhatsAppHref(product)
  const imageUrl = publicAssetUrl(product.thumbnailUrl)
  const selected = compare?.isSelected(product.productId) || false
  const compareDisabled = !selected && compare?.selectedCount >= compare?.maxCompareProducts

  function handleContactClick() {
    void recordContactClick(product.productId).catch(() => {})
  }

  return (
    <Card className="product-card">
      <Link className="product-card__media-link" to={detailPath} aria-label={`View ${product.name}`}>
        <ResponsiveImage
          alt={product.name}
          className="product-card__image"
          height="180"
          src={imageUrl || placeholderImage}
          width="320"
        />
      </Link>

      <div className="product-card__body">
        <div className="product-card__meta">
          <Badge tone="neutral">{product.category?.name || 'Produce'}</Badge>
          <span>{product.status === 'sold_out' ? 'Sold out' : 'Active'}</span>
        </div>

        <Link className="product-card__title" to={detailPath}>
          {product.name}
        </Link>

        <p className="product-card__price">
          {formatXafPrice(product.price)} <span>/ {product.unit}</span>
        </p>
        <p className="product-card__detail">
          {Number(product.quantityAvailable).toLocaleString()} {product.unit} available
        </p>
        <p className="product-card__detail">{product.farmer?.farmLocation || product.farmer?.accountLocation}</p>
      </div>

      <div className="product-card__actions">
        <label className={`compare-toggle ${compareDisabled ? 'compare-toggle--disabled' : ''}`}>
          <input
            checked={selected}
            disabled={compareDisabled}
            type="checkbox"
            onChange={() => compare?.toggleProduct(product.productId)}
          />
          <Scale size={16} aria-hidden="true" />
          <span>Compare</span>
        </label>

        {whatsappHref ? (
          <Button
            aria-label={`Contact farmer about ${product.name} on WhatsApp`}
            as="a"
            href={whatsappHref}
            onClick={handleContactClick}
            rel="noopener noreferrer"
            target="_blank"
            variant="secondary"
          >
            <MessageCircle size={17} aria-hidden="true" />
            WhatsApp
          </Button>
        ) : null}
      </div>
    </Card>
  )
}

const placeholderImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 360'%3E%3Crect width='640' height='360' fill='%23eef2ec'/%3E%3Cpath d='M214 227c52-92 138-126 250-102-17 100-93 151-202 127-19-4-34-12-48-25z' fill='%23123F2D'/%3E%3Ccircle cx='232' cy='154' r='52' fill='%23F28C28'/%3E%3C/svg%3E"

export default ProductCard

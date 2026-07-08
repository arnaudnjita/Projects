import { useQuery } from '@tanstack/react-query'
import { CalendarDays, MapPin, MessageCircle, Phone, Scale } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { recordContactClick } from '../api/contactClickApi'
import * as productsApi from '../api/productsApi'
import { queryKeys } from '../api/queryKeys'
import Button from '../components/Button'
import { Badge, Card, ErrorState, Skeleton } from '../components/Feedback'
import ResponsiveImage from '../components/ResponsiveImage'
import {
  buildProductWhatsAppHref,
  buildTelHref,
  fireContactClick,
  getPrimaryImage,
  getProductImages,
  isNotFoundError,
} from '../marketplace/productDetailUtils'
import { formatXafPrice, publicAssetUrl } from '../marketplace/productUtils'
import { useCompareSelection } from '../marketplace/useCompareSelection'
import PageTitle from './PageTitle'

function ProductDetailPage() {
  const { productId } = useParams()
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const compare = useCompareSelection()
  const productQuery = useQuery({
    queryFn: ({ signal }) => productsApi.getProduct(productId, { signal }),
    queryKey: queryKeys.products.detail(productId),
  })

  if (productQuery.isLoading) {
    return <ProductDetailSkeleton />
  }

  if (productQuery.error) {
    if (isNotFoundError(productQuery.error)) {
      return (
        <>
          <PageTitle title="Product not found" description="This CultivaX product is not publicly available." />
          <ErrorState title="Product not found" message="This listing is not available publicly." />
        </>
      )
    }

    return (
      <ErrorState
        title="Product could not load"
        message={productQuery.error.message}
        onRetry={() => productQuery.refetch()}
      />
    )
  }

  const product = productQuery.data?.product
  const images = getProductImages(product)
  const primaryImage = getPrimaryImage(images, selectedImageIndex)
  const whatsappHref = buildProductWhatsAppHref(product)
  const telHref = buildTelHref(product?.farmer?.phone)
  const isSoldOut = product?.status === 'sold_out'
  const isSelected = compare.isSelected(product.productId)
  const compareDisabled = !isSelected && compare.selectedCount >= compare.maxCompareProducts

  return (
    <>
      <PageTitle title={product.name} description={`View ${product.name} on CultivaX.`} />
      <div className="product-detail">
        <section className="gallery-panel" aria-label={`${product.name} photos`}>
          <div className="gallery-panel__main">
            <ResponsiveImage
              alt={product.name}
              className="gallery-panel__image"
              height="540"
              src={primaryImage?.displayUrl || placeholderImage}
              width="720"
            />
          </div>
          {images.length > 1 ? (
            <div className="gallery-thumbs" aria-label="Choose product image">
              {images.map((image, index) => (
                <button
                  aria-label={`Show image ${index + 1} of ${images.length}`}
                  aria-pressed={index === selectedImageIndex}
                  className={`gallery-thumb ${index === selectedImageIndex ? 'gallery-thumb--active' : ''}`}
                  key={image.productImageId || image.imageUrl}
                  onClick={() => setSelectedImageIndex(index)}
                  type="button"
                >
                  <img
                    alt=""
                    height="72"
                    loading={index === 0 ? 'eager' : 'lazy'}
                    src={image.thumbnailUrl || image.displayUrl}
                    width="96"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <section className="product-detail__content" aria-labelledby="product-title">
          <div className="product-detail__heading">
            <div>
              <Badge tone={isSoldOut ? 'danger' : 'accent'}>{isSoldOut ? 'Sold out' : 'Active listing'}</Badge>
              <h1 id="product-title">{product.name}</h1>
            </div>
            <label className={`compare-toggle ${compareDisabled ? 'compare-toggle--disabled' : ''}`}>
              <input
                checked={isSelected}
                disabled={compareDisabled}
                type="checkbox"
                onChange={() => compare.toggleProduct(product.productId)}
              />
              <Scale size={16} aria-hidden="true" />
              <span>{isSelected ? 'Remove from compare' : 'Add to compare'}</span>
            </label>
          </div>

          <div className="detail-facts">
            <span>{product.category?.name}</span>
            <span>
              <CalendarDays size={16} aria-hidden="true" />
              Posted {formatDate(product.createdAt)}
            </span>
          </div>

          <p className="product-detail__price">
            {formatXafPrice(product.price)} <span>/ {product.unit}</span>
          </p>
          <p className="product-detail__quantity">
            {Number(product.quantityAvailable).toLocaleString()} {product.unit} available
          </p>

          {product.description ? (
            <Card className="detail-section">
              <h2>Description</h2>
              <p>{product.description}</p>
            </Card>
          ) : null}

          <Card className="detail-section farmer-panel">
            <div className="farmer-panel__header">
              {product.farmer?.profilePhotoUrl ? (
                <img
                  alt=""
                  className="farmer-panel__photo"
                  height="56"
                  src={publicAssetUrl(product.farmer.profilePhotoUrl)}
                  width="56"
                />
              ) : null}
              <div>
                <h2>{product.farmer?.name}</h2>
                <p>
                  <MapPin size={16} aria-hidden="true" />
                  {product.farmer?.farmLocation || product.farmer?.accountLocation}
                </p>
              </div>
            </div>
            {product.farmer?.specialty ? <p>Specialty: {product.farmer.specialty}</p> : null}
          </Card>

          <Card className="contact-panel">
            <h2>Contact farmer</h2>
            {isSoldOut ? (
              <p className="form-alert">This listing is marked sold out. You can still ask the farmer about future availability.</p>
            ) : null}
            <div className="contact-panel__actions">
              {whatsappHref ? (
                <Button
                  aria-label={`Contact farmer about ${product.name} on WhatsApp`}
                  as="a"
                  href={whatsappHref}
                  onClick={() => fireContactClick(product.productId, recordContactClick)}
                  rel="noopener noreferrer"
                  target="_blank"
                  variant={isSoldOut ? 'ghost' : 'secondary'}
                >
                  <MessageCircle size={17} aria-hidden="true" />
                  {isSoldOut ? 'Ask about availability' : 'Contact on WhatsApp'}
                </Button>
              ) : null}
              {telHref ? (
                <Button as="a" href={telHref} variant="ghost">
                  <Phone size={17} aria-hidden="true" />
                  {product.farmer.phone}
                </Button>
              ) : null}
            </div>
            <p>Do not have WhatsApp? Use the phone link to call from your device.</p>
          </Card>

          <Button as={Link} to="/marketplace" variant="ghost">
            Back to marketplace
          </Button>
        </section>
      </div>
    </>
  )
}

function ProductDetailSkeleton() {
  return (
    <div className="product-detail">
      <div className="gallery-panel product-detail__loading">
        <Skeleton lines={4} />
      </div>
      <div className="product-detail__content product-detail__loading">
        <Skeleton lines={6} />
      </div>
    </div>
  )
}

function formatDate(value) {
  if (!value) {
    return 'recently'
  }

  return new Intl.DateTimeFormat('en-CM', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

const placeholderImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 720 540'%3E%3Crect width='720' height='540' fill='%23eef2ec'/%3E%3Cpath d='M254 342c63-132 183-180 340-145-25 139-129 210-284 176-27-6-41-16-56-31z' fill='%23123F2D'/%3E%3Ccircle cx='262' cy='227' r='75' fill='%23F28C28'/%3E%3C/svg%3E"

export default ProductDetailPage

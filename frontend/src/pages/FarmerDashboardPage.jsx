import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit, Eye, PackagePlus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import * as productsApi from '../api/productsApi'
import { queryKeys } from '../api/queryKeys'
import { useAuth } from '../auth/useAuth'
import Button from '../components/Button'
import { Badge, Card, EmptyState, ErrorState, Skeleton, ToastRegion } from '../components/Feedback'
import { FormField, Select, TextInput } from '../components/FormControls'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import {
  canSetStatus,
  cleanFarmerDashboardParams,
  farmerDashboardParamsFromSearchParams,
  productStatuses,
  totalListingCount,
  validateQuantityInput,
} from '../marketplace/farmerDashboardUtils'
import { formatXafPrice, publicAssetUrl } from '../marketplace/productUtils'
import PageTitle from './PageTitle'

function FarmerDashboardPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => farmerDashboardParamsFromSearchParams(searchParams), [searchParams])
  const paramsKey = searchParams.toString()
  const [draftState, setDraftState] = useState({ key: paramsKey, values: filters })
  const draftFilters = draftState.key === paramsKey ? draftState.values : filters
  const [quantityDialog, setQuantityDialog] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState(null)
  const [quantityValue, setQuantityValue] = useState('')
  const [quantityError, setQuantityError] = useState('')
  const [toasts, setToasts] = useState([])

  const productsQuery = useQuery({
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => productsApi.listFarmerProducts(filters, { signal }),
    queryKey: queryKeys.products.farmerList(filters),
  })

  const invalidateProducts = () => queryClient.invalidateQueries({ queryKey: ['farmer', 'products'] })
  const quantityMutation = useMutation({
    mutationFn: ({ productId, quantityAvailable }) => productsApi.updateFarmerProductQuantity(productId, quantityAvailable),
    onError: (error) => addToast(error.message || 'Quantity could not be updated.', 'error'),
    onSuccess: () => {
      addToast('Quantity updated.')
      setQuantityDialog(null)
      invalidateProducts()
    },
  })
  const statusMutation = useMutation({
    mutationFn: ({ productId, status }) => productsApi.updateFarmerProductStatus(productId, status),
    onError: (error) => addToast(error.message || 'Status could not be updated.', 'error'),
    onSuccess: () => {
      addToast('Status updated.')
      invalidateProducts()
    },
  })
  const deleteMutation = useMutation({
    mutationFn: productsApi.deleteFarmerProduct,
    onError: (error) => addToast(error.message || 'Product could not be deleted.', 'error'),
    onSuccess: () => {
      addToast('Product deleted.')
      setDeleteDialog(null)
      invalidateProducts()
    },
  })

  const data = productsQuery.data || {}
  const products = data.products || []
  const counts = data.counts || { active: 0, inactive: 0, sold_out: 0 }
  const meta = data.meta || { page: filters.page, pageSize: filters.pageSize, total: 0 }
  const pageCount = Math.max(1, Math.ceil((meta.total || 0) / (meta.pageSize || filters.pageSize)))

  function addToast(message, tone = 'success') {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((current) => [...current, { id, message, tone }].slice(-3))
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 3500)
  }

  function updateDraft(field, value) {
    setDraftState((current) => ({
      key: paramsKey,
      values: {
        ...(current.key === paramsKey ? current.values : filters),
        [field]: value,
      },
    }))
  }

  function submitFilters(event) {
    event.preventDefault()
    setSearchParams(cleanFarmerDashboardParams({ ...draftFilters, page: 1 }))
  }

  function setPage(page) {
    setSearchParams(cleanFarmerDashboardParams({ ...filters, page }))
  }

  function openQuantityDialog(product) {
    setQuantityDialog(product)
    setQuantityValue(String(product.quantityAvailable))
    setQuantityError('')
  }

  function submitQuantity() {
    if (quantityMutation.isPending) {
      return
    }

    const result = validateQuantityInput(quantityValue)
    setQuantityError(result.error)

    if (result.error || !quantityDialog) {
      return
    }

    quantityMutation.mutate({ productId: quantityDialog.productId, quantityAvailable: result.quantity })
  }

  function updateStatus(product, status) {
    const statusCheck = canSetStatus(product, status)

    if (!statusCheck.allowed) {
      addToast(statusCheck.reason, 'error')
      return
    }

    statusMutation.mutate({ productId: product.productId, status })
  }

  return (
    <>
      <PageTitle title="Farmer Dashboard" description="Manage your CultivaX produce listings." />
      <div className="dashboard-page">
        <section className="section-heading" aria-labelledby="dashboard-title">
          <div>
            <Badge tone="accent">Farmer dashboard</Badge>
            <h1 id="dashboard-title">Hello, {user?.name || 'Farmer'}</h1>
            <p>Manage your listings. Backend authorization remains the source of truth for every action.</p>
          </div>
          <Button as={Link} to="/farmer/products/new">
            <PackagePlus size={18} aria-hidden="true" />
            Add Product
          </Button>
        </section>

        <section className="summary-grid" aria-label="Listing summary">
          <SummaryCard label="Active" value={counts.active} />
          <SummaryCard label="Sold out" value={counts.sold_out} />
          <SummaryCard label="Inactive" value={counts.inactive} />
          <SummaryCard label="Total" value={totalListingCount(counts)} />
        </section>

        <form className="dashboard-filters" onSubmit={submitFilters}>
          <FormField label="Search listings">
            <TextInput
              value={draftFilters.search}
              placeholder="Product name"
              onChange={(event) => updateDraft('search', event.target.value)}
            />
          </FormField>
          <FormField label="Status">
            <Select value={draftFilters.status} onChange={(event) => updateDraft('status', event.target.value)}>
              <option value="">All statuses</option>
              {productStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Select>
          </FormField>
          <div className="dashboard-filters__actions">
            <Button type="submit">
              <Search size={17} aria-hidden="true" />
              Search
            </Button>
            <Button type="button" variant="ghost" onClick={() => setSearchParams(new URLSearchParams())}>
              Reset
            </Button>
          </div>
        </form>

        <DashboardListings
          deletePending={deleteMutation.isPending}
          error={productsQuery.error}
          isLoading={productsQuery.isLoading}
          onDelete={setDeleteDialog}
          onQuantity={openQuantityDialog}
          onRetry={() => productsQuery.refetch()}
          onStatus={updateStatus}
          products={products}
          statusPending={statusMutation.isPending}
        />

        {products.length > 0 ? (
          <Pagination
            page={meta.page || filters.page}
            pageCount={pageCount}
            onNext={() => setPage(Math.min(pageCount, (meta.page || filters.page) + 1))}
            onPrevious={() => setPage(Math.max(1, (meta.page || filters.page) - 1))}
          />
        ) : null}
      </div>

      <Modal
        confirmLabel={quantityMutation.isPending ? 'Saving...' : 'Save quantity'}
        isOpen={Boolean(quantityDialog)}
        onClose={() => setQuantityDialog(null)}
        onConfirm={submitQuantity}
        title={`Update quantity${quantityDialog ? ` for ${quantityDialog.name}` : ''}`}
      >
        <FormField label="Quantity available" error={quantityError} helperText="Use 0 to mark the product sold out.">
          <TextInput
            inputMode="decimal"
            value={quantityValue}
            onChange={(event) => {
              setQuantityValue(event.target.value)
              setQuantityError('')
            }}
          />
        </FormField>
      </Modal>

      <Modal
        confirmLabel={deleteMutation.isPending ? 'Deleting...' : 'Delete product'}
        isOpen={Boolean(deleteDialog)}
        onClose={() => setDeleteDialog(null)}
        onConfirm={() => {
          if (deleteDialog && !deleteMutation.isPending) {
            deleteMutation.mutate(deleteDialog.productId)
          }
        }}
        title="Delete product"
      >
        <p>
          Delete <strong>{deleteDialog?.name}</strong>? This removes the listing after confirmation.
        </p>
      </Modal>

      <ToastRegion toasts={toasts} />
    </>
  )
}

function SummaryCard({ label, value }) {
  return (
    <Card className="summary-card">
      <span>{label}</span>
      <strong>{Number(value || 0).toLocaleString()}</strong>
    </Card>
  )
}

function DashboardListings({ deletePending, error, isLoading, onDelete, onQuantity, onRetry, onStatus, products, statusPending }) {
  if (isLoading) {
    return (
      <div className="dashboard-list-skeleton">
        <Skeleton lines={5} />
      </div>
    )
  }

  if (error) {
    return <ErrorState title="Listings could not load" message={error.message} onRetry={onRetry} />
  }

  if (products.length === 0) {
    return (
      <EmptyState
        title="No listings yet"
        message="Publish your first produce listing with a photo, price, and quantity."
        action={
          <Button as={Link} to="/farmer/products/new">
            Create first listing
          </Button>
        }
      />
    )
  }

  return (
    <>
      <div className="dashboard-table-wrap">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col">Price</th>
              <th scope="col">Quantity</th>
              <th scope="col">Status</th>
              <th scope="col">Date</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <DashboardTableRow
                deletePending={deletePending}
                key={product.productId}
                onDelete={onDelete}
                onQuantity={onQuantity}
                onStatus={onStatus}
                product={product}
                statusPending={statusPending}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="dashboard-card-list">
        {products.map((product) => (
          <DashboardProductCard
            deletePending={deletePending}
            key={product.productId}
            onDelete={onDelete}
            onQuantity={onQuantity}
            onStatus={onStatus}
            product={product}
            statusPending={statusPending}
          />
        ))}
      </div>
    </>
  )
}

function DashboardTableRow({ deletePending, onDelete, onQuantity, onStatus, product, statusPending }) {
  return (
    <tr>
      <td>
        <ProductIdentity product={product} />
      </td>
      <td>{formatXafPrice(product.price)} / {product.unit}</td>
      <td>{Number(product.quantityAvailable).toLocaleString()} {product.unit}</td>
      <td><StatusSelect disabled={statusPending} onStatus={onStatus} product={product} /></td>
      <td>{formatDate(product.createdAt)}</td>
      <td>
        <DashboardActions deletePending={deletePending} onDelete={onDelete} onQuantity={onQuantity} product={product} />
      </td>
    </tr>
  )
}

function DashboardProductCard({ deletePending, onDelete, onQuantity, onStatus, product, statusPending }) {
  return (
    <Card className="dashboard-product-card">
      <ProductIdentity product={product} />
      <p>{formatXafPrice(product.price)} / {product.unit}</p>
      <p>{Number(product.quantityAvailable).toLocaleString()} {product.unit}</p>
      <p>{formatDate(product.createdAt)}</p>
      <StatusSelect disabled={statusPending} onStatus={onStatus} product={product} />
      <DashboardActions deletePending={deletePending} onDelete={onDelete} onQuantity={onQuantity} product={product} />
    </Card>
  )
}

function ProductIdentity({ product }) {
  const image = product.images?.[0]

  return (
    <div className="dashboard-product-identity">
      <img
        alt=""
        height="56"
        src={publicAssetUrl(image?.thumbnailUrl || image?.imageUrl) || placeholderImage}
        width="72"
      />
      <div>
        <strong>{product.name}</strong>
        <span>{product.category?.name}</span>
      </div>
    </div>
  )
}

function StatusSelect({ disabled, onStatus, product }) {
  const statusCheck = canSetStatus(product, 'active')

  return (
    <div className="dashboard-status-control">
      <Select disabled={disabled} value={product.status} onChange={(event) => onStatus(product, event.target.value)}>
        {productStatuses.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </Select>
      {!statusCheck.allowed ? <small>{statusCheck.reason}</small> : null}
    </div>
  )
}

function DashboardActions({ deletePending, onDelete, onQuantity, product }) {
  const publiclyVisible = product.status === 'active' || product.status === 'sold_out'

  return (
    <div className="dashboard-actions">
      <Button as={Link} to={`/farmer/products/${product.productId}/edit`} variant="ghost">
        <Edit size={16} aria-hidden="true" />
        Edit
      </Button>
      <Button onClick={() => onQuantity(product)} type="button" variant="ghost">
        Quantity
      </Button>
      {publiclyVisible ? (
        <Button as={Link} to={`/products/${product.productId}`} variant="ghost">
          <Eye size={16} aria-hidden="true" />
          View
        </Button>
      ) : null}
      <Button disabled={deletePending} onClick={() => onDelete(product)} type="button" variant="ghost">
        <Trash2 size={16} aria-hidden="true" />
        Delete
      </Button>
    </div>
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

export default FarmerDashboardPage

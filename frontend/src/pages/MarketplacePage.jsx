import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { RotateCcw, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import * as categoriesApi from '../api/categoriesApi'
import * as productsApi from '../api/productsApi'
import { queryKeys } from '../api/queryKeys'
import Button from '../components/Button'
import { Badge } from '../components/Feedback'
import { FormField, Select, TextInput } from '../components/FormControls'
import Pagination from '../components/Pagination'
import ProductGrid from '../marketplace/ProductGrid'
import {
  cleanMarketplaceParams,
  marketplaceParamsFromSearchParams,
  marketplaceSortOptions,
} from '../marketplace/productUtils'
import { useCompareSelection } from '../marketplace/useCompareSelection'
import PageTitle from './PageTitle'

function MarketplacePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => marketplaceParamsFromSearchParams(searchParams), [searchParams])
  const paramsKey = searchParams.toString()
  const [draftState, setDraftState] = useState({ key: paramsKey, values: filters })
  const draftFilters = draftState.key === paramsKey ? draftState.values : filters
  const compare = useCompareSelection()

  const categoriesQuery = useQuery({
    queryFn: ({ signal }) => categoriesApi.listCategories({ signal }),
    queryKey: queryKeys.categories.all,
  })
  const productsQuery = useQuery({
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) =>
      productsApi.listProducts(
        {
          category: filters.category,
          location: filters.location,
          maxPrice: filters.maxPrice,
          minPrice: filters.minPrice,
          page: filters.page,
          pageSize: filters.pageSize,
          search: filters.search,
          sort: filters.sort,
        },
        { signal },
      ),
    queryKey: queryKeys.products.list(filters),
  })

  const products = productsQuery.data?.products || []
  const meta = productsQuery.data?.meta || { page: filters.page, pageSize: filters.pageSize, total: 0 }
  const pageCount = Math.max(1, Math.ceil((meta.total || 0) / (meta.pageSize || filters.pageSize)))

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
    setSearchParams(cleanMarketplaceParams({ ...draftFilters, page: 1 }))
  }

  function resetFilters() {
    setSearchParams(new URLSearchParams())
  }

  function setPage(page) {
    setSearchParams(cleanMarketplaceParams({ ...filters, page }))
  }

  return (
    <>
      <PageTitle title="Marketplace" description="Browse public CultivaX produce listings in Buea." />
      <div className="stack stack--large">
        <section className="marketplace-header" aria-labelledby="marketplace-title">
          <div>
            <Badge tone="accent">Public marketplace</Badge>
            <h1 id="marketplace-title">Browse produce listings</h1>
            <p>Search active farmer listings, compare products, and contact farmers through WhatsApp.</p>
          </div>
        </section>

        <form className="filter-panel" onSubmit={submitFilters}>
          <FormField label="Search products">
            <TextInput
              value={draftFilters.search}
              placeholder="Tomatoes, plantain, pepper"
              onChange={(event) => updateDraft('search', event.target.value)}
            />
          </FormField>

          <FormField label="Category">
            <Select value={draftFilters.category} onChange={(event) => updateDraft('category', event.target.value)}>
              <option value="">All categories</option>
              {(categoriesQuery.data?.categories || []).map((category) => (
                <option key={category.categoryId} value={category.categoryId}>
                  {category.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Location">
            <TextInput
              value={draftFilters.location}
              placeholder="Molyko"
              onChange={(event) => updateDraft('location', event.target.value)}
            />
          </FormField>

          <FormField label="Minimum price">
            <TextInput
              inputMode="decimal"
              value={draftFilters.minPrice}
              onChange={(event) => updateDraft('minPrice', event.target.value)}
            />
          </FormField>

          <FormField label="Maximum price">
            <TextInput
              inputMode="decimal"
              value={draftFilters.maxPrice}
              onChange={(event) => updateDraft('maxPrice', event.target.value)}
            />
          </FormField>

          <FormField label="Sort">
            <Select value={draftFilters.sort} onChange={(event) => updateDraft('sort', event.target.value)}>
              {marketplaceSortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="filter-panel__actions">
            <Button type="submit">
              <Search size={17} aria-hidden="true" />
              Search
            </Button>
            <Button onClick={resetFilters} type="button" variant="ghost">
              <RotateCcw size={17} aria-hidden="true" />
              Reset filters
            </Button>
          </div>
        </form>

        <section className="section-stack" aria-labelledby="results-title">
          <div className="section-heading">
            <div>
              <h2 id="results-title">Marketplace results</h2>
              <p>{meta.total || 0} active listings found</p>
            </div>
            <p>{compare.selectedCount} of {compare.maxCompareProducts} selected to compare</p>
          </div>

          <ProductGrid
            compare={compare}
            error={productsQuery.error}
            isLoading={productsQuery.isLoading}
            onRetry={() => productsQuery.refetch()}
            products={products}
          />

          {products.length > 0 ? (
            <Pagination
              page={meta.page || filters.page}
              pageCount={pageCount}
              onNext={() => setPage(Math.min(pageCount, (meta.page || filters.page) + 1))}
              onPrevious={() => setPage(Math.max(1, (meta.page || filters.page) - 1))}
            />
          ) : null}
        </section>
      </div>
    </>
  )
}

export default MarketplacePage

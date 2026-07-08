import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Leaf, Store } from 'lucide-react'
import { Link } from 'react-router-dom'

import * as productsApi from '../api/productsApi'
import { queryKeys } from '../api/queryKeys'
import { useAuth } from '../auth/useAuth'
import Button from '../components/Button'
import { Badge, Card } from '../components/Feedback'
import ProductGrid from '../marketplace/ProductGrid'
import { useCompareSelection } from '../marketplace/useCompareSelection'
import PageTitle from './PageTitle'

function HomePage() {
  const { user } = useAuth()
  const compare = useCompareSelection()
  const recentQuery = useQuery({
    queryFn: ({ signal }) => productsApi.listRecentProducts({ limit: 4 }, { signal }),
    queryKey: queryKeys.products.recent,
  })
  const listProducePath = user?.role === 'farmer' ? '/farmer/products/new' : '/register'
  const products = recentQuery.data?.products || []

  return (
    <>
      <PageTitle title="Home" description="CultivaX connects Buea farmers and buyers through public produce listings." />
      <div className="stack stack--large">
        <section className="intro-panel" aria-labelledby="home-title">
          <div>
            <Badge tone="accent">Buea agricultural marketplace</Badge>
            <h1 id="home-title">Find fresh produce and reach farmers directly.</h1>
            <p>
              CultivaX helps farmers publish available produce and helps buyers browse listings, compare options, and
              contact farmers through WhatsApp.
            </p>
          </div>
          <div className="intro-panel__actions">
            <Button as={Link} to="/marketplace">
              <Store size={18} aria-hidden="true" />
              Browse Products
            </Button>
            <Button as={Link} to={listProducePath} variant="secondary">
              <Leaf size={18} aria-hidden="true" />
              List Your Produce
            </Button>
          </div>
        </section>

        <section className="feature-strip" aria-label="How CultivaX helps">
          <Card>
            <div className="feature-item">
              <Store size={24} aria-hidden="true" />
              <div>
                <h2>For buyers</h2>
                <p>Search by category, location, and price before contacting a farmer outside the platform.</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="feature-item">
              <ArrowRight size={24} aria-hidden="true" />
              <div>
                <h2>For farmers</h2>
                <p>Publish produce listings with photos, quantity, price, and contact details buyers can use.</p>
              </div>
            </div>
          </Card>
        </section>

        <section className="section-stack" aria-labelledby="recent-title">
          <div className="section-heading">
            <div>
              <Badge tone="neutral">Recently added</Badge>
              <h2 id="recent-title">New listings</h2>
            </div>
            <Button as={Link} to="/marketplace" variant="ghost">
              View all
            </Button>
          </div>
          <ProductGrid
            compare={compare}
            error={recentQuery.error}
            isLoading={recentQuery.isLoading}
            onRetry={() => recentQuery.refetch()}
            products={products}
          />
        </section>
      </div>
    </>
  )
}

export default HomePage

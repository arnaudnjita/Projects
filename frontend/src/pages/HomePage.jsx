import { ArrowRight, Leaf, Store } from 'lucide-react'

import Button from '../components/Button'
import { Badge, Card } from '../components/Feedback'

function HomePage() {
  return (
    <div className="stack stack--large">
      <section className="intro-panel" aria-labelledby="home-title">
        <div>
          <Badge tone="accent">CultivaX MVP</Badge>
          <h1 id="home-title">CultivaX development environment is running</h1>
          <p>
            The application shell, navigation, design tokens, and reusable interface components are ready for the next
            frontend milestones.
          </p>
        </div>
        <div className="intro-panel__actions">
          <Button>
            <Store size={18} aria-hidden="true" />
            Marketplace
          </Button>
          <Button variant="ghost">
            <Leaf size={18} aria-hidden="true" />
            Farmer tools
          </Button>
        </div>
      </section>

      <section className="feature-strip" aria-label="Frontend foundation">
        <Card>
          <div className="feature-item">
            <Store size={24} aria-hidden="true" />
            <div>
              <h2>Marketplace-ready shell</h2>
              <p>Public routes and responsive layout are in place without loading product data yet.</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="feature-item">
            <ArrowRight size={24} aria-hidden="true" />
            <div>
              <h2>Next milestone ready</h2>
              <p>Auth, marketplace, and farmer pages can now reuse the same controls and layout patterns.</p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  )
}

export default HomePage

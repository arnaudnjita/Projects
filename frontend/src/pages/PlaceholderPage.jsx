import { Card } from '../components/Feedback'

function PlaceholderPage({ title }) {
  return (
    <Card>
      <div className="stack">
        <h1>{title}</h1>
        <p>This route is reserved for the next CultivaX frontend milestone.</p>
      </div>
    </Card>
  )
}

export default PlaceholderPage

import { Card } from '../components/Feedback'

function PlaceholderPage({ description = 'This route is reserved for a future CultivaX frontend milestone.', title }) {
  return (
    <Card>
      <div className="stack">
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </Card>
  )
}

export default PlaceholderPage

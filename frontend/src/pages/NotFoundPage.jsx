import { Link } from 'react-router-dom'

import Button from '../components/Button'
import { ErrorState } from '../components/Feedback'
import PageTitle from './PageTitle'

function NotFoundPage() {
  return (
    <>
      <PageTitle title="Page not found" description="The requested CultivaX page could not be found." />
      <ErrorState
        title="Page not found"
        message="The page you are looking for does not exist."
        onRetry={null}
      />
      <div className="not-found-action">
        <Button as={Link} to="/marketplace" variant="secondary">
          Back to marketplace
        </Button>
      </div>
    </>
  )
}

export default NotFoundPage

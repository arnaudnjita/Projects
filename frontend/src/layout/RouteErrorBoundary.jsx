import { isRouteErrorResponse, useRouteError } from 'react-router-dom'

import { ErrorState } from '../components/Feedback'

function RouteErrorBoundary() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : 'The page could not be loaded.'

  return (
    <main className="main-container">
      <ErrorState message={message} title="Page unavailable" />
    </main>
  )
}

export default RouteErrorBoundary

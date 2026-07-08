import { Navigate, useLocation } from 'react-router-dom'

import { Spinner } from '../components/Feedback'
import { useAuth } from '../auth/useAuth'

function RouteLoading() {
  return (
    <section className="route-loading" aria-label="Loading session">
      <Spinner label="Checking session" />
    </section>
  )
}

export function GuestOnlyRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return <RouteLoading />
  }

  if (isAuthenticated) {
    return <Navigate replace to={user?.role === 'farmer' ? '/farmer/dashboard' : '/marketplace'} />
  }

  return children
}

export function AuthenticatedRoute({ children }) {
  const location = useLocation()
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <RouteLoading />
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/login" state={{ from: location }} />
  }

  return children
}

export function FarmerOnlyRoute({ children }) {
  const location = useLocation()
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return <RouteLoading />
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/login" state={{ from: location }} />
  }

  if (user?.role !== 'farmer') {
    return <Navigate replace to="/unauthorized" />
  }

  return children
}

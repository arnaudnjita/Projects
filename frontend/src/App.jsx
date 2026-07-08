import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import { Spinner } from './components/Feedback'
import PublicLayout from './layout/PublicLayout'
import RouteErrorBoundary from './layout/RouteErrorBoundary'
import { FarmerOnlyRoute, GuestOnlyRoute } from './routes/RouteGuards'
import './App.css'

const HomePage = lazy(() => import('./pages/HomePage'))
const RoutePlaceholderPage = lazy(() => import('./pages/RoutePlaceholderPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

const pageDescriptions = {
  compare: 'Compare selected CultivaX products side by side.',
  dashboard: 'Farmer dashboard placeholder for managing CultivaX listings.',
  editProduct: 'Edit a CultivaX product listing.',
  forgotPassword: 'Request a CultivaX password reset link.',
  login: 'Log in to CultivaX with phone or email.',
  marketplace: 'Browse public CultivaX produce listings.',
  newProduct: 'Create a new CultivaX product listing.',
  productDetail: 'View public CultivaX product details.',
  profile: 'Manage the farmer profile shown to buyers.',
  register: 'Create a farmer or buyer account for CultivaX.',
  resetPassword: 'Set a new CultivaX account password.',
  unauthorized: 'You do not have permission to access this CultivaX page.',
}

const developmentRoutes = import.meta.env.DEV
  ? [
      {
        lazy: async () => {
          const module = await import('./pages/ShellPreviewPage')
          return { Component: module.default }
        },
        path: 'dev/components',
      },
    ]
  : []

function LazyRoute({ children }) {
  return (
    <Suspense fallback={<Spinner label="Loading page" />}>
      {children}
    </Suspense>
  )
}

function placeholder(title, description) {
  return (
    <LazyRoute>
      <RoutePlaceholderPage title={title} description={description} />
    </LazyRoute>
  )
}

function guestPlaceholder(title, description) {
  return (
    <GuestOnlyRoute>
      {placeholder(title, description)}
    </GuestOnlyRoute>
  )
}

function farmerPlaceholder(title, description) {
  return (
    <FarmerOnlyRoute>
      {placeholder(title, description)}
    </FarmerOnlyRoute>
  )
}

const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: (
          <LazyRoute>
            <HomePage />
          </LazyRoute>
        ),
        index: true,
      },
      {
        element: placeholder('Marketplace', pageDescriptions.marketplace),
        path: 'marketplace',
      },
      {
        element: placeholder('Product Detail', pageDescriptions.productDetail),
        path: 'products/:productId',
      },
      {
        element: placeholder('Compare Products', pageDescriptions.compare),
        path: 'compare',
      },
      {
        element: guestPlaceholder('Login', pageDescriptions.login),
        path: 'login',
      },
      {
        element: guestPlaceholder('Register', pageDescriptions.register),
        path: 'register',
      },
      {
        element: guestPlaceholder('Forgot Password', pageDescriptions.forgotPassword),
        path: 'forgot-password',
      },
      {
        element: guestPlaceholder('Reset Password', pageDescriptions.resetPassword),
        path: 'reset-password',
      },
      {
        element: farmerPlaceholder('Farmer Dashboard', pageDescriptions.dashboard),
        path: 'farmer/dashboard',
      },
      {
        element: farmerPlaceholder('Farmer Profile', pageDescriptions.profile),
        path: 'farmer/profile',
      },
      {
        element: farmerPlaceholder('New Product', pageDescriptions.newProduct),
        path: 'farmer/products/new',
      },
      {
        element: farmerPlaceholder('Edit Product', pageDescriptions.editProduct),
        path: 'farmer/products/:productId/edit',
      },
      {
        element: placeholder('Unauthorized', pageDescriptions.unauthorized),
        path: 'unauthorized',
      },
      ...developmentRoutes,
      {
        element: (
          <LazyRoute>
            <NotFoundPage />
          </LazyRoute>
        ),
        path: '*',
      },
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App

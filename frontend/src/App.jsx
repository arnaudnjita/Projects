import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import { Spinner } from './components/Feedback'
import PublicLayout from './layout/PublicLayout'
import RouteErrorBoundary from './layout/RouteErrorBoundary'
import { FarmerOnlyRoute, GuestOnlyRoute } from './routes/RouteGuards'
import './App.css'

const HomePage = lazy(() => import('./pages/HomePage'))
const ComparePage = lazy(() => import('./pages/ComparePage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const MarketplacePage = lazy(() => import('./pages/MarketplacePage'))
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'))
const RoutePlaceholderPage = lazy(() => import('./pages/RoutePlaceholderPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))

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

function guestPage(children) {
  return (
    <GuestOnlyRoute>
      <LazyRoute>{children}</LazyRoute>
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
        element: (
          <LazyRoute>
            <MarketplacePage />
          </LazyRoute>
        ),
        path: 'marketplace',
      },
      {
        element: (
          <LazyRoute>
            <ProductDetailPage />
          </LazyRoute>
        ),
        path: 'products/:productId',
      },
      {
        element: (
          <LazyRoute>
            <ComparePage />
          </LazyRoute>
        ),
        path: 'compare',
      },
      {
        element: guestPage(<LoginPage />),
        path: 'login',
      },
      {
        element: guestPage(<RegisterPage />),
        path: 'register',
      },
      {
        element: guestPage(<ForgotPasswordPage />),
        path: 'forgot-password',
      },
      {
        element: guestPage(<ResetPasswordPage />),
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

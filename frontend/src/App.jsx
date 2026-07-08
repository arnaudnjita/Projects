import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import PublicLayout from './layout/PublicLayout'
import RouteErrorBoundary from './layout/RouteErrorBoundary'
import PlaceholderPage from './pages/PlaceholderPage'
import ShellPreviewPage from './pages/ShellPreviewPage'
import './App.css'

const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { element: <ShellPreviewPage />, index: true },
      { element: <PlaceholderPage title="Login" />, path: 'login' },
      { element: <PlaceholderPage title="Register" />, path: 'register' },
      { element: <PlaceholderPage title="Farmer Dashboard" />, path: 'farmer/dashboard' },
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App

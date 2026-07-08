# Routes and Pages Plan

CultivaX will use React Router with public routes, authentication routes, farmer-protected routes, and fallback routes.

## React Route Map

| Route | Access | Planned page/component | Purpose |
| --- | --- | --- | --- |
| `/` | Public | `MarketplacePage` | Main public marketplace |
| `/products/:id` | Public | `ProductDetailPage` | Product details, gallery, WhatsApp contact, phone fallback |
| `/compare` | Public | `ComparePage` | Compare up to four products stored in `localStorage` |
| `/login` | Public for signed-out users | `LoginPage` | Login with phone or email plus password |
| `/register` | Public for signed-out users | `RegisterPage` | Farmer or buyer registration |
| `/forgot-password` | Public | `ForgotPasswordPage` | Request email password reset |
| `/reset-password` | Public | `ResetPasswordPage` | Set new password from reset token |
| `/farmer` | Farmer-only | Redirect to `/farmer/dashboard` | Farmer area entry |
| `/farmer/dashboard` | Farmer-only | `FarmerDashboardPage` | Listing counts and active, sold-out, inactive tabs |
| `/farmer/profile` | Farmer-only | `FarmerProfilePage` | Create or edit farmer profile |
| `/farmer/products/new` | Farmer-only | `ProductCreatePage` | Create product with at least one photo |
| `/farmer/products/:id/edit` | Farmer-only | `ProductEditPage` | Edit owned product |
| `/unauthorized` | Public | `UnauthorizedPage` | Explain missing role or access |
| `*` | Public | `NotFoundPage` | Unknown route fallback |

## Public Routes

Public routes require no login and include:

- `/`
- `/products/:id`
- `/compare`
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/unauthorized`
- `*`

Guests can browse marketplace listings, search, filter, sort, view product details, compare products, click WhatsApp links, and use phone fallback. Comparison selections are stored in `localStorage` as numeric product IDs with a maximum of four IDs.

## Authentication Routes

Authentication routes are available to signed-out users:

- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`

If an already authenticated user visits login or registration, the frontend should redirect:

- Farmers go to `/farmer/dashboard`.
- Buyers go to `/`.

Password reset remains public because reset links are opened before authentication.

## Farmer-Protected Routes

Farmer routes require:

1. A valid authenticated session from `/api/auth/me`.
2. User role equal to `farmer`.

Protected routes:

- `/farmer`
- `/farmer/dashboard`
- `/farmer/profile`
- `/farmer/products/new`
- `/farmer/products/:id/edit`

If the user is signed out, redirect to `/login` with a return path. If the user is signed in as a buyer, redirect to `/unauthorized`.

## Not-Found and Unauthorized Behavior

### Not Found

- Unknown frontend route renders `NotFoundPage`.
- Missing public product renders a product not-found state and offers a return link to the marketplace.
- API `404` responses use the shared JSON error shape with `NOT_FOUND`.

### Unauthorized

- Signed-out users attempting farmer pages are redirected to `/login`.
- Signed-in buyers attempting farmer pages are redirected to `/unauthorized`.
- API `401` means no valid session.
- API `403` means authenticated but not allowed, including role mismatch or ownership failure.

## Page-Level UX Notes

- Use large touch targets and plain labels for farmer workflows.
- Keep dashboard actions visible and confirmation explicit for real product deletion.
- Product cards show image, name, price, unit, location, farmer/farm name, status-safe availability, compare action, and contact action.
- Public pages never show private user fields.

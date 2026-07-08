# Requirements Traceability Plan

All requirements are planned only. Nothing is marked as implemented at this documentation milestone.

## Functional Requirements

| ID | Requirement | Planned frontend page/component | Planned API endpoint | Planned database table(s) | Planned test coverage | Status |
| --- | --- | --- | --- | --- | --- | --- |
| FR-01 | Farmer registration | `RegisterPage`, `RoleSelect`, `RegisterForm` | `POST /api/auth/register` | `users`, `farmer_profiles` | Farmer registration creates user and profile; duplicate and validation tests | Backend implemented |
| FR-02 | Buyer registration | `RegisterPage`, `RoleSelect`, `RegisterForm` | `POST /api/auth/register` | `users` | Buyer registration creates no farmer profile; validation tests | Backend implemented |
| FR-03 | Login with phone or email and password | `LoginPage`, `LoginForm` | `POST /api/auth/login` | `users` | Login by email, login by phone, wrong password, JWT cookie tests | Backend implemented |
| FR-04 | Unique phone and email validation | `RegisterForm`, `ProfileForm` | `POST /api/auth/register`, `PUT /api/farmer/profile` | `users` | Duplicate phone and duplicate email field-error tests | Partially implemented: registration backend only |
| FR-05 | Cameroon/international phone validation and E.164 normalization | `RegisterForm`, `ProfileForm` | `POST /api/auth/register`, `PUT /api/farmer/profile` | `users`, `farmer_profiles` | Invalid phone registration and phone utility tests | Partially implemented: auth backend only |
| FR-06 | Secure password hashing and JWT authentication | Auth context/provider | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` | `users` | Hash verification, JWT cookie, auth middleware tests | Planned |
| FR-07 | Password reset through email reset link | `ForgotPasswordPage`, `ResetPasswordPage` | `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` | `users`, `password_reset_tokens` | Generic response, hashed token storage, valid reset, expired/used/invalid token, password mismatch, new password login tests | Backend implemented; frontend pages still planned |
| FR-08 | Role-based protection of farmer routes | `RequireFarmerRoute` | All `/api/farmer/*` endpoints | `users` | Auth middleware role tests, route guard tests | Planned |
| FR-09 | Farmer profile create/edit | `FarmerProfilePage`, `FarmerProfileForm` | `GET /api/farmer/profile`, `PUT /api/farmer/profile` | `farmer_profiles`, `users` | Ownership and validation tests | Planned |
| FR-10 | Product listing creation | `ProductCreatePage`, `ProductForm`, `ImageUploader` | `POST /api/farmer/products` | `products`, `product_images` | Multipart validation, transaction tests | Planned |
| FR-11 | Product listing edit | `ProductEditPage`, `ProductForm` | `PUT /api/farmer/products/:id` | `products`, `product_images` | Ownership, validation, image update tests | Planned |
| FR-12 | Product listing delete | `DashboardProductActions`, confirmation dialog | `DELETE /api/farmer/products/:id` | `products`, `product_images` | Ownership, transaction, image cleanup tests | Planned |
| FR-13 | Quantity update | `QuantityUpdateControl` | `PATCH /api/farmer/products/:id/quantity` | `products` | Ownership and numeric validation tests | Planned |
| FR-14 | Sold-out status | `StatusToggle` | `PATCH /api/farmer/products/:id/status` | `products` | Allowed status transition tests | Planned |
| FR-15 | Inactive status | `StatusToggle` | `PATCH /api/farmer/products/:id/status` | `products` | Dashboard visibility and marketplace exclusion tests | Planned |
| FR-16 | At least one product photo and multiple photos | `ImageUploader`, product gallery | `POST /api/farmer/products`, `PUT /api/farmer/products/:id` | `product_images` | Required image and max image tests | Planned |
| FR-17 | Farmer dashboard with active, sold-out, and inactive listings | `FarmerDashboardPage`, `ListingTabs` | `GET /api/farmer/products?status=...`, `GET /api/farmer/dashboard-summary` | `products`, `product_images` | Status filtering and count tests | Planned |
| FR-18 | Public marketplace accessible without login | `MarketplacePage`, `ProductGrid` | `GET /api/products` | `products`, `product_images`, `farmer_profiles`, `users` | Public access and safe fields tests | Planned |
| FR-19 | Keyword search | `SearchInput` | `GET /api/products?search=...` | `products`, `farmer_profiles` | Parameterized keyword search tests | Planned |
| FR-20 | Category, location, min-price, and max-price filters | `FilterPanel` | `GET /api/products?category=&location=&minPrice=&maxPrice=` | `products`, `farmer_profiles` | Query validation and SQL filter tests | Planned |
| FR-21 | Sort by price or date added | `SortSelect` | `GET /api/products?sort=price_asc\|price_desc\|newest\|oldest` | `products` | Whitelisted sort tests | Planned |
| FR-22 | Product detail page | `ProductDetailPage`, `ProductGallery` | `GET /api/products/:id` | `products`, `product_images`, `farmer_profiles`, `users` | Public detail and not-found tests | Planned |
| FR-23 | Recently added section | `RecentlyAddedSection` | `GET /api/products/recent` | `products`, `product_images` | Limit and newest ordering tests | Planned |
| FR-24 | Product comparison for guests and buyers | `ComparePage`, `CompareButton`, `CompareTray` | `GET /api/products/compare?ids=1,2,3,4` | `products`, `product_images`, `farmer_profiles` | LocalStorage max-four UI tests, API id validation | Planned |
| FR-25 | WhatsApp contact link, tappable phone fallback, and contact-click logging | `ContactFarmerButton`, `PhoneFallback` | `POST /api/products/:id/contact-clicks` | `contact_clicks`, `products`, `users` | Optional-auth logging, nullable buyer ID, URL formatting tests | Planned |

## Non-Functional Requirements

| ID | Requirement | Planned frontend page/component | Planned API endpoint | Planned database table(s) | Planned test coverage | Status |
| --- | --- | --- | --- | --- | --- | --- |
| NFR-01 | Mobile-first responsive design | All pages and layout components | Not applicable | Not applicable | Responsive smoke checks at mobile and desktop widths | Planned |
| NFR-02 | Accessible contrast, labels, and touch targets | Forms, buttons, navigation, product cards | Not applicable | Not applicable | Manual accessibility checklist and form label checks | Planned |
| NFR-03 | Secure handling of credentials and tokens | Auth provider and forms | Auth endpoints | `users`, `password_reset_tokens` | Cookie flags, no hash/token exposure tests | Planned |
| NFR-04 | Consistent JSON API errors | Form error presenters | All endpoints | Not applicable | Error middleware and validation response tests | Planned |
| NFR-05 | Parameterized SQL for dynamic queries | Not applicable | All data-backed endpoints | All tables | Repository tests and code review checklist | Planned |
| NFR-06 | Environment variables for secrets and deployment config | Build/runtime config usage | Backend config module | Not applicable | Config validation tests and `.env.example` review | Planned |
| NFR-07 | Image upload performance and safe processing | `ImageUploader`, product gallery | Product image endpoints | `product_images` | File type, size, sharp processing tests | Planned |
| NFR-08 | Authorization and ownership enforcement | Protected route wrappers | Farmer endpoints | `users`, `farmer_profiles`, `products` | Cross-user access denial tests | Planned |
| NFR-09 | Beginner-readable maintainable code organization | Project-wide components and modules | Project-wide routes/controllers/services/repositories | Project-wide schema | Lint, build, focused integration tests | Planned |

## Explicitly Out of Scope

- Admin pages or admin permissions
- In-platform chat
- Order tables, checkout, order tracking, or payments
- Reviews or ratings
- SMS notifications
- Native mobile applications
- English/French language switching

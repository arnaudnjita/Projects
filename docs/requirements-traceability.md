# Requirements Traceability Plan

Statuses reflect current backend and frontend progress. Backend-only milestones are marked separately from frontend work that remains planned.

## Functional Requirements

| ID | Requirement | Planned frontend page/component | Planned API endpoint | Planned database table(s) | Planned test coverage | Status |
| --- | --- | --- | --- | --- | --- | --- |
| FR-01 | Farmer registration | `RegisterPage`, role selector, registration form | `POST /api/auth/register` | `users`, `farmer_profiles` | Backend farmer registration tests; frontend validation and farmer payload helper tests | Implemented |
| FR-02 | Buyer registration | `RegisterPage`, role selector, registration form | `POST /api/auth/register` | `users` | Backend buyer registration tests; frontend validation and buyer payload helper tests | Implemented |
| FR-03 | Login with phone or email and password | `LoginPage`, auth context, route redirects | `POST /api/auth/login` | `users` | Backend login tests; frontend login validation and redirect helper tests | Implemented |
| FR-04 | Unique phone and email validation | `RegisterPage`, future `FarmerProfilePage` | `POST /api/auth/register`, `PUT /api/farmer/profile` | `users` | Backend duplicate phone/email field-error tests; frontend backend field-error rendering path | Partially implemented: registration UI/backend complete; farmer profile UI pending |
| FR-05 | Cameroon/international phone validation and E.164 normalization | `RegisterPage`, future `FarmerProfilePage` | `POST /api/auth/register`, `PUT /api/farmer/profile` | `users`, `farmer_profiles` | Backend invalid phone and phone utility tests; frontend phone format validation tests | Partially implemented: auth UI/backend complete; farmer profile UI pending |
| FR-06 | Secure password hashing and JWT authentication | Auth context/provider, `LoginPage`, `RegisterPage`, header logout | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` | `users` | Backend hash/JWT/cookie tests; frontend auth state, no-localStorage design, logout route behavior via build/lint | Implemented |
| FR-07 | Password reset through email reset link | `ForgotPasswordPage`, `ResetPasswordPage` | `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` | `users`, `password_reset_tokens` | Backend reset-token tests; frontend forgot/reset validation helper tests | Implemented |
| FR-08 | Role-based protection of farmer routes | `FarmerOnlyRoute`, protected farmer pages including `FarmerProfilePage` | All farmer-only endpoints, including `GET /api/farmers/me/profile` and `PUT /api/farmers/me/profile` | `users`, `farmer_profiles` | Auth middleware role tests; buyer receives 403 on farmer profile routes; frontend farmer route guard verified by build and guarded route wiring | Frontend and backend implemented |
| FR-09 | Farmer profile create/edit | `FarmerProfilePage`, `FarmerProfileForm`, profile photo picker | `GET /api/farmers/me/profile`, `PUT /api/farmers/me/profile`, `POST /api/farmers/me/profile/photo` | `farmer_profiles`, `users` | Farmer-only profile read/update, buyer 403, photo upload tests; frontend load/update/photo validation/payload helper tests | Frontend and backend implemented |
| FR-10 | Product listing creation | `FarmerProductFormPage`, `ProductForm`, `ImageUploader` at `/farmer/products/new` | `POST /api/farmer/products` | `products`, `product_images` | Backend product creation with one/multiple images, no-image rejection, invalid category tests; frontend validation, image count/type/size, and FormData helper tests | Frontend and backend implemented |
| FR-11 | Product listing edit | `FarmerDashboardPage` edit action, `FarmerProductFormPage`, `ProductForm`, `ImageUploader` at `/farmer/products/:productId/edit` | `PUT /api/farmer/products/:productId` | `products`, `product_images` | Ownership, field edit, add/remove image, image cleanup tests; frontend edit value mapping, retained/deleted/new image FormData, and build/lint checks | Frontend and backend implemented |
| FR-12 | Product listing delete | `FarmerDashboardPage`, `DashboardProductActions`, confirmation dialog; edit form supports removing selected images without deleting the product | `DELETE /api/farmer/products/:productId` | `products`, `product_images` | Ownership, delete, 404 after delete, image cleanup tests; frontend delete confirmation flow and helper tests | Frontend dashboard and backend implemented |
| FR-13 | Quantity update | `FarmerDashboardPage`, quantity update dialog | `PATCH /api/farmer/products/:productId/quantity` | `products` | Quantity-to-zero sold_out and inactive-preserving quantity increase tests; frontend quantity validation and zero-active rule tests | Frontend dashboard and backend implemented |
| FR-14 | Sold-out status | `StatusToggle`, `ProductDetailPage` | `PATCH /api/farmer/products/:id/status`, `PATCH /api/farmer/products/:id/quantity`, `GET /api/products/:id` | `products` | Quantity-to-zero sold_out tests; sold-out public detail visibility tests | Backend implemented |
| FR-15 | Inactive status | `StatusToggle`, `MarketplacePage` | `PATCH /api/farmer/products/:id/status`, `GET /api/products`, `GET /api/products/:id` | `products` | Inactive status update and public 404/exclusion tests | Backend implemented |
| FR-16 | At least one product photo and multiple photos | `ImageUploader`, product gallery | `POST /api/farmer/products`, `PUT /api/farmer/products/:id`, `GET /api/products/:id` | `product_images` | Required image, multiple image, gallery, thumbnail, and cleanup tests | Backend implemented |
| FR-17 | Farmer dashboard with active, sold-out, and inactive listings | `FarmerDashboardPage`, `ListingTabs`; public cards/detail status labels | `GET /api/farmer/products?status=...`, `GET /api/products/:id` | `products`, `product_images` | Status filtering, dashboard count tests, and public sold-out detail UI helper tests | Backend implemented; public status UI implemented; farmer dashboard UI pending |
| FR-18 | Public marketplace accessible without login | `HomePage`, `MarketplacePage`, `ProductGrid`, `ProductDetailPage` | `GET /api/products`, `GET /api/products/recent`, `GET /api/products/:id`, `POST /api/products/:productId/contact-click` | `products`, `product_images`, `farmer_profiles`, `users`, `contact_click_logs` | Public access, safe fields, guest contact-click logging, product card/detail helper tests, and build verification | Frontend and backend implemented |
| FR-19 | Keyword search | `MarketplacePage` search form | `GET /api/products?search=...` | `products`, `farmer_profiles` | Parameterized backend search tests; URL-query frontend filter behavior tests | Frontend and backend implemented |
| FR-20 | Category, location, min-price, and max-price filters | `MarketplacePage` filter panel | `GET /api/products?category=&location=&minPrice=&maxPrice=` | `products`, `farmer_profiles`, `users` | Backend individual/combined filter tests; frontend query cleaning tests | Frontend and backend implemented |
| FR-21 | Sort by price or date added | `MarketplacePage` sort select | `GET /api/products?sort=price_asc\|price_desc\|newest\|oldest` | `products` | Backend whitelisted sort tests; frontend sort option/query behavior tests | Frontend and backend implemented |
| FR-22 | Product detail page | `ProductDetailPage`, `ProductGallery`, compare add/remove control | `GET /api/products/:id` | `products`, `product_images`, `farmer_profiles`, `users` | Public detail, ordered gallery, sold-out visible, inactive 404, WhatsApp URL, phone fallback, and compare-selection helper tests | Frontend and backend implemented |
| FR-23 | Recently added section | `RecentlyAddedSection` | `GET /api/products/recent` | `products`, `product_images` | Limit and newest active listing tests | Backend implemented |
| FR-24 | Product comparison for guests and buyers | `ComparePage`, `CompareButton`, `CompareTray` | `GET /api/products/compare?ids=1,2,3,4` | `products`, `product_images`, `farmer_profiles`, `users` | API id validation, requested ordering, active-only comparison tests; frontend add/remove, duplicate prevention, limit, localStorage recovery, two-product minimum, and missing product helper tests | Frontend and backend implemented |
| FR-25 | WhatsApp contact link, tappable phone fallback, and contact-click logging | `ContactFarmerButton`, `PhoneFallback` | `GET /api/products/:id`, `POST /api/products/:productId/contact-click` | `contact_click_logs`, `products`, `users` | Public safe phone/WhatsApp fields, guest click, buyer click, farmer-as-guest, invalid optional token, missing/inactive product, rate limit, and no order/message table tests | Backend implemented; frontend URL generation planned |

## Non-Functional Requirements

| ID | Requirement | Planned frontend page/component | Planned API endpoint | Planned database table(s) | Planned test coverage | Status |
| --- | --- | --- | --- | --- | --- | --- |
| NFR-01 | Mobile-first responsive design | All pages and layout components | Not applicable | Not applicable | Responsive smoke checks at mobile and desktop widths | Planned |
| NFR-02 | Accessible contrast, labels, and touch targets | Forms, buttons, navigation, product cards, contact controls | Public marketplace and contact-click endpoints supply safe labels/contact data | Not applicable | Backend provides trusted contact fields; frontend accessibility checklist still planned | Partially implemented: backend support only |
| NFR-03 | Secure handling of credentials and tokens | Auth provider and forms | Auth endpoints | `users`, `password_reset_tokens` | Cookie flags, no hash/token exposure tests | Planned |
| NFR-04 | Consistent JSON API errors | Form error presenters | All endpoints | Not applicable | Error middleware and validation response tests | Planned |
| NFR-05 | Parameterized SQL for dynamic queries | Not applicable | All data-backed endpoints | All tables | Repository tests and code review checklist | Planned |
| NFR-06 | Environment variables for secrets and deployment config | Build/runtime config usage | Backend config module | Not applicable | Config validation tests and `.env.example` review | Planned |
| NFR-07 | Image upload performance and safe processing | `ImageUploader`, product gallery | Product image endpoints | `product_images` | File type, size, sharp processing tests | Planned |
| NFR-08 | Authorization and ownership enforcement | Protected route wrappers, public detail/contact controls | Farmer endpoints and optional-auth contact-click endpoint | `users`, `farmer_profiles`, `products`, `contact_click_logs` | Cross-user access denial tests; buyer-only contact attribution; frontend guard, 404, and contact-click helper tests | Backend implemented; frontend route guards and public detail handling implemented |
| NFR-09 | Beginner-readable maintainable code organization | Project-wide components and modules | Project-wide routes/controllers/services/repositories | Project-wide schema | Lint, build, focused integration tests | Planned |

## Explicitly Out of Scope

- Admin pages or admin permissions
- In-platform chat
- Order tables, checkout, order tracking, or payments
- Reviews or ratings
- SMS notifications
- Native mobile applications
- English/French language switching

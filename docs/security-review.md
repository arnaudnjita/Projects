# CultivaX MVP Security Review

Date: 2026-07-08

This review covered SQL injection, authentication, authorization, validation, XSS, CSRF, rate limiting, uploads, information exposure, dependencies, and privacy for the current MVP.

## Fixes Implemented

### CSRF Protection

Finding: The backend relied on CORS and SameSite cookies. CORS headers alone do not stop forged browser requests, and production cross-site deployment may require `SameSite=None`.

Fix:

- Added `GET /api/csrf` to issue a signed, short-lived CSRF token.
- Added `csrfProtection` middleware for unsafe browser-origin methods.
- Added `originGuard` middleware to reject unconfigured browser origins instead of only omitting CORS headers.
- Updated the frontend Axios client to fetch and send `X-CSRF-Token` for `POST`, `PUT`, `PATCH`, and `DELETE`.
- Tokens are kept in memory only, not localStorage.

Tests:

- Missing CSRF token returns `403 CSRF_TOKEN_INVALID`.
- Valid CSRF token allows the request to continue to normal validation.
- Disallowed browser origins return `403 ORIGIN_NOT_ALLOWED`.

### JWT Secret Validation

Finding: Backend startup accepted short JWT secrets.

Fix:

- `JWT_SECRET` must now be at least 32 characters.
- The example placeholder value is rejected.
- Test setup now forces a long test-only secret.

Manual requirement:

- Update `backend/.env` with a unique random `JWT_SECRET` of at least 32 characters before running the backend.

### Mass-Assignment Protection

Finding: Farmer profile rejected unsupported fields, but auth and product validators did not consistently reject unexpected body fields.

Fix:

- Added reusable `rejectUnsupportedFields`.
- Auth endpoints reject unsupported fields such as `isAdmin`.
- Product create/update/status/quantity endpoints reject unsupported fields while preserving supported multipart image-management fields.

Tests:

- Unsupported registration field is rejected.
- Unsupported product field is rejected.

### Header Navigation Privacy

Finding: Farmer Profile was implemented but not linked in Farmer navigation during the integration pass.

Fix:

- Farmer users now see Farmer Dashboard and Farmer Profile.
- Buyers do not see Farmer management links.

## Reviewed Areas

### SQL Injection

Status: No confirmed SQL injection issue found.

- Dynamic values use `connection.execute` parameters.
- Public and farmer sort SQL fragments are selected from allow-lists.
- Product ID lists use generated placeholders for validated numeric IDs.
- `LIMIT` and `OFFSET` are parsed as numbers before interpolation.

Residual requirement:

- Keep future sort/filter SQL fragments allow-listed. Do not concatenate raw query/body values into SQL.

### Authentication

Status: Hardened.

- JWT stored in HttpOnly cookie.
- Cookie is `secure` in production by default.
- Cookie clearing uses matching options.
- Frontend does not store JWT in localStorage.
- JWT secret strength is now validated on startup.

Deployment note:

- Current cookie `SameSite` is `lax` outside production and `none` in production. `SameSite=None` requires HTTPS and CSRF token enforcement for unsafe methods.

### Authorization

Status: Covered by middleware and ownership checks.

- Farmer routes use `requireAuth` and `requireRole('farmer')`.
- Farmer product repository methods scope writes by `farmer_user_id`.
- Cross-farmer product access returns 404 where appropriate.
- Buyers are denied Farmer endpoints.

### Input Validation

Status: Improved.

- Auth, Farmer profile, product, status, quantity, and password reset endpoints validate bodies.
- Product/contact path params are validated.
- Public marketplace query filters are parsed and allow-listed.
- Unsupported fields are rejected for auth/profile/product write paths.
- Phone and email normalization are centralized in backend services.

Residual requirement:

- Add explicit unknown-field rejection to any future write endpoint as it is introduced.

### XSS

Status: No confirmed issue found.

- React renders user-generated content as text.
- No `dangerouslySetInnerHTML` use was found.
- Product descriptions and profile bio are displayed through normal JSX escaping.
- Helmet is enabled.

Residual requirement:

- Keep uploaded files served only from the controlled uploads route. Do not allow user HTML uploads.

### Rate Limiting

Status: Implemented with a proxy caveat.

- Global API limiter exists.
- Auth and forgot/reset password routes use stricter auth limiter.
- Contact-click endpoint uses contact limiter.
- Test-only rate-limit keys are only honored when `NODE_ENV=test`.

Deployment requirement:

- If deploying behind a reverse proxy, configure Express `trust proxy` deliberately and ensure the proxy sets client IP headers correctly. Do not trust spoofable IP headers by default.

### File Uploads

Status: Covered.

- Multer accepts only JPEG, PNG, and WebP MIME types.
- Sharp decodes images, rejects corrupted/renamed files, rotates, resizes, converts to WebP, compresses, strips metadata, and creates thumbnails.
- Upload size and product image count are limited.
- Filenames are collision-resistant.
- Static upload route disables directory listings and sets cache headers.
- Path traversal is blocked by resolved-path checks.
- Product/profile cleanup behavior is tested.

### Information Exposure

Status: Covered.

- Password hashes are not returned.
- Reset token hashes are not returned.
- Production errors do not expose stack traces.
- Duplicate-key and foreign-key database errors are translated to safe messages.
- Request logging redacts passwords, tokens, cookies, and multipart bodies.

### Dependencies

Status: No advisories reported.

- `backend npm audit`: `0 vulnerabilities`.
- `frontend npm audit`: `0 vulnerabilities`.
- No `--force` upgrades were applied.

### Privacy

Status: Aligned with MVP.

- Buyer contact details are not exposed publicly.
- Farmer phone/WhatsApp data is exposed only through marketplace/contact surfaces where required.
- Contact-click logs store product ID, nullable buyer ID, and timestamp. They do not store browser fingerprints, messages, orders, or payments.

## Residual Risks

- Manual browser testing is still required for CSRF-token behavior in Chrome, Edge, Firefox, and Safari.
- A compromised allowed frontend origin can request CSRF tokens; this is why XSS prevention and deployment hardening remain important.
- Production deployment must use HTTPS when `SameSite=None` cookies are enabled.
- Reverse proxy IP handling must be configured before relying on per-IP rate limiting in production.
- Secrets currently in local `.env` must be reviewed manually; this review did not print or modify real secret values.

## Manual Deployment Checklist

- Set a unique `JWT_SECRET` with at least 32 random characters.
- Use HTTPS in production.
- Confirm `FRONTEND_URL` exactly matches the deployed frontend origin.
- Confirm `APP_BASE_URL` points to the deployed frontend for password reset links.
- Set `COOKIE_SECURE=true` in production.
- Confirm cookie `SameSite=None` is appropriate for the frontend/API deployment topology.
- Configure reverse proxy and `trust proxy` intentionally before production traffic.
- Run `npm audit` in both projects before release.
- Run a real browser smoke test for login, refresh, logout, product create/edit/delete, profile update, and WhatsApp contact.

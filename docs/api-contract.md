# API Contract Plan

All API responses use JSON. Authenticated requests send the JWT through a secure HttpOnly cookie. Public APIs return only safe user fields and never expose password hashes, password reset tokens, private configuration, or internal stack traces.

## Common Response Shapes

### Success

```json
{
  "success": true,
  "data": {}
}
```

List endpoints may include pagination metadata:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 0
  }
}
```

### Validation Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check the highlighted fields.",
    "fields": [
      { "field": "phone", "message": "Enter a valid phone number." }
    ]
  }
}
```

### Common Error Responses

| HTTP status | Code | Meaning |
| --- | --- | --- |
| 400 | `BAD_REQUEST` | Malformed request or invalid query combination |
| 401 | `UNAUTHENTICATED` | Missing or invalid session |
| 403 | `FORBIDDEN` | Authenticated user lacks role or ownership |
| 404 | `NOT_FOUND` | Resource does not exist or is not visible to the requester |
| 409 | `CONFLICT` | Unique phone/email conflict or invalid state conflict |
| 413 | `PAYLOAD_TOO_LARGE` | Upload exceeds configured limit |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Upload file type is not allowed |
| 422 | `VALIDATION_ERROR` | Field-level validation failed |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Safe generic server error |

## Auth Endpoints

| Method and URL | Access | Request | Success response |
| --- | --- | --- | --- |
| `POST /api/auth/register` | Public, strict rate limit | Body: `role`, `name`, `phone`, optional `email`, `password`, `passwordConfirmation`, `location` | `201`, sets HttpOnly JWT cookie, returns `{ success: true, data: { user } }` with safe fields only |
| `POST /api/auth/login` | Public, strict rate limit | Body: `identifier` phone or email, `password` | `200`, sets HttpOnly JWT cookie, returns `{ success: true, data: { user } }`; invalid credentials use a generic message |
| `GET /api/auth/me` | Authenticated | Cookie only | `200`, returns `{ success: true, data: { user } }`; missing, expired, or invalid tokens return `401` |
| `POST /api/auth/logout` | Authenticated | Cookie only | `200`, clears matching auth cookie and returns `{ success: true, data: { loggedOut: true } }` |
| `POST /api/auth/forgot-password` | Public, strict rate limit | Body: `email` | `200`, returns the same generic message regardless of account existence; existing email accounts receive a reset link |
| `POST /api/auth/reset-password` | Public, strict rate limit | Body: `token`, `password`, `passwordConfirmation` | `200`, password updated and reset tokens invalidated |

## Farmer Profile Endpoints

| Method and URL | Access | Request | Success response |
| --- | --- | --- | --- |
| `GET /api/farmer/profile` | Farmer-only | Cookie only | Farmer profile with safe user fields |
| `PUT /api/farmer/profile` | Farmer-only | Body: `farmName`, `location`, `bio`, optional `whatsappPhone`, optional `email` | Updated farmer profile |

## Farmer Product Endpoints

| Method and URL | Access | Request | Success response |
| --- | --- | --- | --- |
| `GET /api/farmer/dashboard-summary` | Farmer-only | Cookie only | Counts for `active`, `sold_out`, and `inactive` |
| `GET /api/farmer/products` | Farmer-only | Query: optional `status`, `search`, `sort`, `page`, `pageSize` | Farmer-owned products with images and dashboard counts |
| `POST /api/farmer/products` | Farmer-only | `multipart/form-data`: `name`, `description`, `categoryId`, `price`, `quantityAvailable`, `unit`, optional `status`, `images[]` | `201`, created product; zero quantity defaults to `sold_out` |
| `GET /api/farmer/products/:productId` | Farmer-only | Path `productId` | Farmer-owned product detail |
| `PUT /api/farmer/products/:productId` | Farmer-only | `multipart/form-data`: editable product fields, optional `deleteImageIds` JSON array, optional `imageSortOrders` JSON array, optional new `images[]` | Updated product |
| `PATCH /api/farmer/products/:productId/quantity` | Farmer-only | Body: `quantityAvailable` | Updated product quantity; zero marks `sold_out`, greater than zero preserves current status |
| `PATCH /api/farmer/products/:id/status` | Farmer-only | Body: `status` as `active`, `sold_out`, or `inactive` | Updated product status |
| `DELETE /api/farmer/products/:productId` | Farmer-only | Path `productId`; frontend requires confirmation before calling | `200`, deletion confirmation |

## Public Marketplace Endpoints

| Method and URL | Access | Request | Success response |
| --- | --- | --- | --- |
| `GET /api/products` | Public | Query: optional `search`, `category`/`categoryId`, `location`, `minPrice`, `maxPrice`, `sort` as `newest`, `oldest`, `price_asc`, or `price_desc`, `page`, `pageSize` | Active marketplace products only, with thumbnail, image count, category, farmer name/location, safe public phone, price, unit, quantity, status, and pagination metadata |
| `GET /api/products/recent` | Public | Query: optional `limit`; values outside the safe range fall back to the default | Newest active products using the same safe card shape as marketplace listings |
| `GET /api/products/compare` | Public | Query: `ids`, comma-separated two to four unique numeric active product IDs | Matching active products in the requested order, with fields needed for side-by-side comparison |
| `GET /api/products/:id` | Public | Path `id` | Public product detail with ordered image gallery and safe farmer contact fields; sold-out products remain visible by direct URL, inactive products return `404` |
| `POST /api/products/:productId/contact-click` | Public with optional auth and contact-click rate limit | Path `productId`; no browser metadata body is required | `201`, returns `{ contactClick: { contactClickLogId, logged: true } }`; logs nullable `buyer_user_id` only when a valid logged-in Buyer clicks |

## Field and Safety Notes

- Public farmer fields: `farmerId`, `name`, `accountLocation`, `farmLocation`, `phone`, optional `profilePhotoUrl`, optional `specialty`, `whatsappPhone`, `whatsappDigits`, and `whatsappMessage`.
- Auth safe user fields: `userId`, `name`, `phone`, nullable `email`, `role`, and `location`.
- Private fields never returned: `password_hash`, reset token hashes, internal file paths, SMTP settings, JWT secrets.
- Phone values are stored normalized in E.164.
- WhatsApp URLs are generated by stripping the leading plus and all non-digits before composing `https://wa.me/{digits}?text={encodedMessage}`.
- The backend exposes `whatsappPhone` in normalized E.164 format, `whatsappDigits` for URL generation, and a default message like `Hello, I saw your {productName} listing on CultivaX. Is it still available?`. The frontend should generate the final `wa.me` URL from these trusted fields.
- Optional-auth contact-click policy: a missing, invalid, or expired auth cookie is treated as a guest click and stores `buyer_user_id = NULL`. A logged-in Farmer is also stored as `NULL` so the backend does not mislabel a farmer as a buyer.
- Public product listing, recent, and comparison endpoints return only products with `status = active`; product detail also allows `sold_out` so an already-shared listing can show a clear sold-out state. Inactive products return `404` publicly.
- Contact-click logging is allowed only for active products. It records only product ID, nullable buyer user ID, and timestamp; it does not create orders, messages, purchases, or chat records.
- Password reset is email-only in the MVP. Accounts registered without an email cannot use email reset, and SMS reset is out of scope.
- Product image uploads use field name `images`, require at least one image on create, and allow at most five images per product. Removed image files are deleted only after the database transaction commits.

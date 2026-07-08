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
| `GET /api/farmer/products` | Farmer-only | Query: optional `status`, `page`, `pageSize` | Farmer-owned products with images |
| `POST /api/farmer/products` | Farmer-only | `multipart/form-data`: `name`, `description`, `category`, `price`, `quantity`, `unit`, `location`, `status`, `photos[]` | `201`, created product |
| `GET /api/farmer/products/:id` | Farmer-only | Path `id` | Farmer-owned product detail |
| `PUT /api/farmer/products/:id` | Farmer-only | `multipart/form-data`: editable product fields, existing image IDs to keep, optional new `photos[]` | Updated product |
| `PATCH /api/farmer/products/:id/quantity` | Farmer-only | Body: `quantity` | Updated product quantity |
| `PATCH /api/farmer/products/:id/status` | Farmer-only | Body: `status` as `active`, `sold_out`, or `inactive` | Updated product status |
| `DELETE /api/farmer/products/:id` | Farmer-only | Path `id`; frontend requires confirmation before calling | `200`, deletion confirmation |

## Public Marketplace Endpoints

| Method and URL | Access | Request | Success response |
| --- | --- | --- | --- |
| `GET /api/products` | Public | Query: `search`, `category`, `location`, `minPrice`, `maxPrice`, `sort`, `page`, `pageSize` | Active marketplace products with safe farmer fields |
| `GET /api/products/recent` | Public | Query: optional `limit` | Recently added active products |
| `GET /api/products/compare` | Public | Query: `ids`, comma-separated numeric IDs, max 4 | Matching active products for comparison |
| `GET /api/products/:id` | Public | Path `id` | Active product detail with images and safe farmer contact fields |
| `POST /api/products/:id/contact-clicks` | Optional-auth | Body: `channel` as `whatsapp` or `phone`, optional `source` | `201`, contact click logged |

## Field and Safety Notes

- Public farmer fields: `farmerId`, `farmName`, `location`, `phone`, optional `whatsappPhone`.
- Auth safe user fields: `userId`, `name`, `phone`, nullable `email`, `role`, and `location`.
- Private fields never returned: `password_hash`, reset token hashes, internal file paths, SMTP settings, JWT secrets.
- Phone values are stored normalized in E.164.
- WhatsApp URLs are generated by stripping the leading plus and all non-digits before composing `https://wa.me/{digits}?text={encodedMessage}`.
- Public product endpoints return only products with `status = active` and available public visibility.
- Password reset is email-only in the MVP. Accounts registered without an email cannot use email reset, and SMS reset is out of scope.

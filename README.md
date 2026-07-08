# CultivaX

CultivaX is a web agricultural marketplace MVP for Buea Municipality, Cameroon. This scaffold contains a React/Vite frontend, an Express backend, and planning documentation.

## Project Structure

```text
frontend/  React Vite application
backend/   Express API application
docs/      Architecture and planning documents
```

## Install Dependencies

Install frontend and backend dependencies separately.

```powershell
cd C:\Projects\frontend
npm install
```

```powershell
cd C:\Projects\backend
npm install
```

## Run Locally on Windows 11

Before starting the backend, create a local environment file.

```powershell
cd C:\Projects\backend
Copy-Item .env.example .env
notepad .env
```

Fill in local values for the MySQL and email settings. For a local MySQL 8 database, the database values commonly look like this:

```text
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=cultivax
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
```

Also replace `JWT_SECRET`, `SMTP_USER`, `SMTP_PASS`, and any other placeholder values. Do not commit `.env`.

Open two PowerShell terminals.

Terminal 1:

```powershell
cd C:\Projects\backend
npm run dev
```

Terminal 2:

```powershell
cd C:\Projects\frontend
npm run dev
```

Expected local URLs:

- Frontend: `http://localhost:5173`
- Backend health check: `http://localhost:5000/api/health`

## Useful Commands

Frontend:

```powershell
cd C:\Projects\frontend
npm run lint
npm run build
```

Backend:

```powershell
cd C:\Projects\backend
npm run lint
npm test
```

Database:

```powershell
cd C:\Projects\backend
npm run db:schema
npm run db:seed
```

To intentionally reset all MVP tables in a non-production local database:

```powershell
cd C:\Projects\backend
$env:ALLOW_DB_RESET = "true"
npm run db:reset
Remove-Item Env:\ALLOW_DB_RESET
```

`db:reset` is guarded and refuses to run in production or without `ALLOW_DB_RESET=true`.

## Local Upload Storage

Development and persistent-server uploads are stored under:

```text
backend/uploads/
```

Runtime upload files are ignored by Git. Profile images are uploaded through:

```text
POST /api/farmers/me/profile/photo
```

The request must be authenticated as a farmer and use multipart form data with an `image` field. Accepted image types are JPEG, PNG, and WebP. The backend validates both MIME type and Sharp image decoding, converts accepted files to WebP, and writes a thumbnail next to the main image.

Product image support uses the same storage service through farmer product create/update endpoints. The maximum is five product images per product.

## Product Status Rules

Farmer product creation and updates use these backend rules:

- Creating a product with `quantityAvailable=0` stores the product as `sold_out`.
- Setting quantity to zero later also marks the product `sold_out`.
- Increasing quantity above zero does not automatically reactivate a product that is `inactive`; the farmer must explicitly change status.
- A product cannot be set to `active` while quantity is zero.

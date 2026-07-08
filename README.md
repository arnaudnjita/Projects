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

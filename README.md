# LinkLibrarian

LinkLibrarian is a full-stack web app for registering users, logging in, and saving, editing, filtering, and deleting personal links.

Example comment of change.

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MySQL
- Sessions: express-session + MySQL session store
- Hosting: Railway

## Project Structure

```text
project-root/
  backend/
  frontend/
```

- `backend/` contains the Express server, session handling, and MySQL connection.
- `frontend/` contains the Vite + React client.

## Features

- User registration and login
- Session-based authentication
- Create, read, update, and delete links
- Tag filtering
- Local development support
- Production deployment on Railway

## Local Development

### 1. Start the backend

Open a terminal in the `backend/` folder and run:

```bash
npm install
npm start
```

The backend runs on:

```text
http://localhost:3001
```

You can verify it with:

- `http://localhost:3001/`
- `http://localhost:3001/api/test-db`

### 2. Start the frontend

Open a second terminal in the `frontend/` folder and run:

```bash
npm install
npm run dev
```

The frontend runs on:

```text
http://localhost:5173
```

## Frontend Environment Variables

This project uses Vite environment variables for switching between local and production API URLs. Vite exposes only variables prefixed with `VITE_` to client-side code.

### `frontend/.env.local`

```env
VITE_API_BASE_URL=http://localhost:3001
```

This is used for local development.

### `frontend/.env.production`

```env
VITE_API_BASE_URL=https://linklibrarian-production.up.railway.app
```

This is used for production builds.

### App.jsx usage

In `frontend/src/App.jsx`, the API base URL is read like this:

```js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
```

## Railway Deployment

This app is deployed on Railway as three services:

- MySQL database
- Express backend
- Vite/React frontend

### Railway frontend URL

```text
https://linklibrarian-frontend-production.up.railway.app
```

### Railway backend URL

```text
https://linklibrarian-production.up.railway.app
```

## Railway Frontend Service Setup

The frontend service is configured with:

- Root Directory: `/frontend`
- Public domain target port: `8080`

Railway detects the frontend as a Vite static site, builds it into `dist`, and serves it with Caddy.

## Railway Backend CORS Setup

The backend allows both local development and the Railway-hosted frontend by using an allowlist in `server.js`.

Example:

```js
const allowedOrigins = [
  'http://localhost:5173',
  'https://linklibrarian-frontend-production.up.railway.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

Important:
- Do not add a trailing slash to allowed origins.
- `http://localhost:5173` works, but `http://localhost:5173/` causes CORS errors.

## Railway Frontend Variable

In the Railway frontend service, set:

```text
VITE_API_BASE_URL=https://linklibrarian-production.up.railway.app
```

Because Vite frontend variables are baked into the build, changing this value requires a rebuild/redeploy.

## Notes

- `.env.local` should stay local and should not usually be committed.
- `VITE_` variables are not secret; they are visible in the frontend bundle.
- Database passwords, session secrets, and backend credentials must stay in backend or Railway service variables, not frontend env files.

## Testing Checklist

### Local
- Start local backend
- Start local frontend
- Open `http://localhost:5173`
- Confirm changes affect local MySQL only

### Production
- Open `https://linklibrarian-frontend-production.up.railway.app`
- Register/login successfully
- Confirm CRUD actions affect Railway MySQL

## Troubleshooting

### NetworkError when attempting to fetch resource
Common causes:

- backend is not running locally
- frontend env variable points to the wrong API URL
- Railway frontend variable was changed but the app was not rebuilt
- CORS origin does not exactly match the frontend URL

### CORS errors
Check:
- exact frontend origin
- no trailing slash in CORS allowlist
- `credentials: true` is enabled
- deployed frontend URL is included in `allowedOrigins`

### Localhost frontend not working
Make sure both are running:

- backend at `http://localhost:3001`
- frontend at `http://localhost:5173`

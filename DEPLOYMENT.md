# Deployment

Deploy the backend on Render and the frontend on Vercel.

## 1. Backend on Render

1. Open Render and create a new Web Service.
2. Connect `https://github.com/lembheharsh18/Pramanik-Drishti`.
3. Use these settings:

```text
Name: pramanik-drishti-api
Root Directory: backend
Runtime: Python
Build Command: pip install -r requirements.txt
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

4. Add environment variables:

```text
PYTHON_VERSION=3.11.9
DATABASE_PATH=pramanik.db
ALLOWED_ORIGINS=http://localhost:5173
```

5. Deploy the service.
6. Copy the backend URL, for example:

```text
https://pramanik-drishti-api.onrender.com
```

7. Open `<backend-url>/docs` and confirm Swagger loads.

## 2. Frontend on Vercel

1. Open Vercel and create a new project.
2. Import `https://github.com/lembheharsh18/Pramanik-Drishti`.
3. Use these settings:

```text
Framework Preset: Vite
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

4. Add this environment variable:

```text
VITE_API_BASE_URL=<your Render backend URL>
```

Example:

```text
VITE_API_BASE_URL=https://pramanik-drishti-api.onrender.com
```

5. Deploy the project.
6. Copy the Vercel frontend URL, for example:

```text
https://pramanik-drishti.vercel.app
```

## 3. Update Render CORS

After Vercel gives you the frontend URL, go back to the Render backend service and update:

```text
ALLOWED_ORIGINS=<your Vercel frontend URL>
```

Example:

```text
ALLOWED_ORIGINS=https://pramanik-drishti.vercel.app
```

Redeploy the Render backend after changing this value.

## 4. Verify

1. Open the backend root URL and confirm it returns `status: operational`.
2. Open `<backend-url>/docs` and confirm Swagger loads.
3. Open the Vercel frontend URL.
4. Register a bundle.
5. Copy the returned bundle ID.
6. Verify the same bundle with the same documents.

## Note About Free Render

On Render's free web service, the local SQLite database is ephemeral. The app will work for demos, but registered bundles can disappear after restarts, redeploys, or service sleep/wake cycles. Persistent SQLite storage requires a paid Render disk or moving the backend to a hosted database.

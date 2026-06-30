# Deployment

This repo includes a Render blueprint in `render.yaml` for:

- `pramanik-drishti-api`: FastAPI backend
- `pramanik-drishti-web`: Vite/React frontend

The frontend receives the backend host through `VITE_API_BASE_URL`, and the backend receives the frontend host through `ALLOWED_ORIGINS`. The app accepts either full URLs or Render hostnames.

## 1. Commit and push

```powershell
git status
git add .
git commit -m "Prepare Render deployment"
git push origin main
```

Local `.env`, SQLite database, and Python cache files are ignored by `.gitignore`.

## 2. Create the Render blueprint

1. Open Render.
2. Create a new Blueprint.
3. Connect `https://github.com/lembheharsh18/Pramanik-Drishti`.
4. Select the repo root as the blueprint source.
5. Apply the services from `render.yaml`.

## 3. Deploy values

The blueprint sets these automatically:

Backend:

```text
PYTHON_VERSION=3.11.9
DATABASE_PATH=/var/data/pramanik.db
ALLOWED_ORIGINS=<frontend Render hostname>
```

Frontend:

```text
VITE_API_BASE_URL=<backend Render hostname>
```

## 4. Verify

After both services finish deploying:

1. Open the backend URL and confirm it returns `status: operational`.
2. Open `<backend-url>/docs` to confirm Swagger loads.
3. Open the frontend URL.
4. Register a bundle, then verify the same documents.

## Notes

The backend uses SQLite. The blueprint mounts a persistent disk at `/var/data` so registered bundles survive restarts and redeploys. If you switch to a free/ephemeral backend service without a disk, demo data can disappear after restarts.

# Safety Monitoring and Hazard Detection Platform

Django + React MVP with:
- Sensor reading ingestion (manual + CSV)
- Rule-based + ML risk prediction
- Alert management
- Incident tracking
- Dashboard analytics by shift and zone

## Quick Setup
1. Create `.env` using `.env.example` as a template.
2. Install backend deps and run migrations.
3. Start backend and frontend.

### Backend
`cd backend`
`pip install -r requirements.txt`
`python manage.py makemigrations sensors hazards incidents`
`python manage.py migrate`
`python manage.py runserver`

### Frontend
`cd frontend`
`npm install`
`npm run dev`

## Demo Steps
1. Open `Add Reading` and submit a high-risk reading.
2. Confirm the risk response includes `alarm`, `risk_score`, and `severity`.
3. Open `Alerts` and verify the new alert appears with rule triggers.
4. Create an incident from the alert ID.
5. Open `Dashboard` and confirm shift/zone counts update.

## Sample SQL Proof (Azure / SSMS)
```sql
SELECT TOP 5 *
FROM sensor_readings
ORDER BY [timestamp] DESC;
```

## ML Training Note
Run training:
`python backend/core/ml/train_model.py`

Typical output (example):
- Logistic Regression accuracy ~0.80
- Random Forest accuracy ~1.00

## Architecture Flow
See `docs/flow.md` for the system flow diagram.

## Deploy (Azure Container Apps + GitHub Actions)

### 1) Create Azure resources
```
az group create -n hazard-rg -l eastus
az acr create -n <acr-name> -g hazard-rg --sku Basic
az containerapp env create -n hazard-env -g hazard-rg -l eastus
```

### 2) Create container apps (first time)
```
az containerapp create -n hazard-backend -g hazard-rg --environment hazard-env \
  --image <acr-name>.azurecr.io/hazard-backend:latest --target-port 8000 --ingress external

az containerapp create -n hazard-frontend -g hazard-rg --environment hazard-env \
  --image <acr-name>.azurecr.io/hazard-frontend:latest --target-port 80 --ingress external
```

### 3) Configure backend environment variables
Set these in the Azure Portal or CLI for the backend container app:
- `DEBUG=False`
- `SECRET_KEY=<your-secret>`
- `ALLOWED_HOSTS=<backend-app-url>`
- `DB_ENGINE=mssql`
- `DB_NAME=<db>`
- `DB_USER=<user>`
- `DB_PASSWORD=<password>`
- `DB_HOST=<server>.database.windows.net`
- `DB_PORT=1433`
- `MODEL_PATH=/app/core/ml/artifacts/hazard_rf.joblib`

### 4) Add GitHub Secrets
Repo ? Settings ? Secrets and variables ? Actions:
- `AZURE_CREDENTIALS` (service principal JSON)
- `ACR_NAME`
- `AZURE_RESOURCE_GROUP`
- `AZURE_CONTAINERAPPS_ENV`
- `AZURE_BACKEND_APP`
- `AZURE_FRONTEND_APP`
- `VITE_API_BASE_URL` (backend URL, e.g. `https://hazard-backend.<region>.azurecontainerapps.io/api/v1`)

Create service principal:
```
az ad sp create-for-rbac \
  --name hazard-sp \
  --role contributor \
  --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/hazard-rg \
  --sdk-auth
```

### 5) Push to main
Push to `main` to build, push, and deploy via GitHub Actions.

### 6) Verify
- Backend health: open `/api/v1/dashboard/summary`
- Frontend loads and hits API

## Deploy (Azure App Service + Static Web Apps)

### Backend (Django) – Azure App Service
1. Create App Service (Linux, Python 3.12) and connect GitHub repo.
2. In App Service ? Configuration ? Application settings, add:
   - `DEBUG=False`
   - `SECRET_KEY=<your-secret>`
   - `ALLOWED_HOSTS=<your-backend-app>.azurewebsites.net`
   - `DB_ENGINE=mssql`
   - `DB_NAME=<db>`
   - `DB_USER=<user>`
   - `DB_PASSWORD=<password>`
   - `DB_HOST=<server>.database.windows.net`
   - `DB_PORT=1433`
   - `MODEL_PATH=/home/site/wwwroot/core/ml/artifacts/hazard_rf.joblib`
3. In App Service ? Configuration ? General settings, set Startup Command:
   - `gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 2`
4. Add GitHub secret `AZURE_BACKEND_PUBLISH_PROFILE` and `AZURE_BACKEND_APP`.
5. Push to `main` to deploy.

### Frontend (React) – Azure Static Web Apps
1. Create Static Web App and connect GitHub repo.
2. Build settings:
   - App location: `frontend`
   - Output location: `dist`
3. Add GitHub secret `AZURE_SWA_TOKEN`.
4. Set app setting `VITE_API_BASE_URL` to backend URL (…/api/v1).
5. Push to `main` to deploy.

# Safety Monitoring and Hazard Detection Platform

A production-style safety monitoring web app that turns sensor data into actionable alerts, incidents, and CAPA workflows so teams can prevent hazards before they escalate.

## Why This Application
Industrial safety teams need a single place to ingest sensor data, detect hazards, and track corrective actions. This project simulates a real plant safety workflow with:
- real-time rule-based alarms
- ML risk scoring
- alert and incident management
- CAPA tracking
- dashboards by zone and shift

## How To Use (Fast Start)
1. Open the **Dashboard** to see current alerts, zones, and system flow.
2. Go to **Add Reading** and submit a sample high-risk reading.
3. Check **Alerts** to confirm the alert appears with rule triggers.
4. Create an **Incident** tied to the alert and assign CAPA status.
5. Upload a CSV in **Upload CSV** for batch ingestion and preview results.
6. Try **AI/CV PPE Check** and **Live IoT Stream** to see simulated production modules.

---

## Screenshots
Add screenshots here for future reference:

**Landing / Dashboard**
![Dashboard](docs/screenshots/dashboard.png)

**Add Sensor Reading**
![Add Reading](docs/screenshots/add-reading.png)

**Upload CSV**
![Upload CSV](docs/screenshots/upload-csv.png)

**Alerts**
![Alerts](docs/screenshots/alerts.png)

**Incidents + CAPA**
![Incidents](docs/screenshots/incidents.png)

**AI/CV PPE Check**
![PPE Check](docs/screenshots/ppe-check.png)

**Live IoT Stream**
![IoT Stream](docs/screenshots/live-stream.png)

**Hazard Report**
![Hazard Report](docs/screenshots/hazard-report.png)

---

## Features (Component-by-Component)

### 1) Dashboard
- Real-time KPIs: active alerts, incidents, resolution rate
- Charts: alerts by shift and zone (scrollable for large datasets)
- System flow cards: jump directly to each module
- Lifecycle and tech sections for stakeholder understanding

### 2) Add Sensor Reading
- Manual sensor input
- Quick Tips panel and collapsible form
- Latest assessment summary for quick review
- Creates alerts automatically when thresholds trigger

### 3) Upload CSV
- Batch upload with validation and error handling
- Deduplication to avoid repeated readings
- CSV bucket preview with alert highlights
- Animated alert rows for rapid triage

### 4) Alerts
- Filter and review alert list
- SLA timer and recommended action
- Audit trail for status changes
- Scrollable table for large volumes

### 5) Incidents + CAPA
- Create incidents tied to alerts
- CAPA status workflow (Open ? In Progress ? Closed)
- Quick Tips + latest incident summary
- Scrollable incident list for scale

### 6) Hazard Reports
- Report hazards and near-misses
- Guided templates for fast entry
- “What happens next” panel for clarity

### 7) AI/CV PPE Check (Simulation)
- Upload media ? run simulated PPE check
- Generates PPE violations (stored + displayed)
- Clickable list with detailed modal activity view

### 8) Live IoT Stream (Simulation)
- Starts a simulator that writes readings every 5 seconds
- Shows live status, event list, and alert highlights

---

## Quick Setup (Local)
1. Create `.env` using `.env.example` as a template.
2. Install backend deps and run migrations.
3. Start backend and frontend.

### Backend
```bash
cd backend
pip install -r requirements.txt
python manage.py makemigrations sensors hazards incidents
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Demo Workflow (Recommended)
1. Add a reading with `gas_level > 250` to trigger an alarm.
2. Open Alerts and verify the rule trigger shows.
3. Create an incident from the alert ID.
4. Update CAPA to Closed and confirm resolution rate changes.
5. Upload CSV with multiple rows and review the bucket preview.

---

## Data Layer (Azure / SSMS Proof)
```sql
SELECT TOP 5 *
FROM sensor_readings
ORDER BY [timestamp] DESC;
```

---

## ML Training Note
```bash
python backend/core/ml/train_model.py
```
Typical output (example):
- Logistic Regression accuracy ~0.80
- Random Forest accuracy ~1.00

---

## Architecture Flow
See `docs/flow.md` for the system flow diagram.

---

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
4. Add GitHub secrets: `AZURE_BACKEND_PUBLISH_PROFILE`, `AZURE_BACKEND_APP`.
5. Push to `main` to deploy.

### Frontend (React) – Azure Static Web Apps
1. Create Static Web App and connect GitHub repo.
2. Build settings:
   - App location: `frontend`
   - Output location: `dist`
3. Add GitHub secret `AZURE_SWA_TOKEN`.
4. Set app setting `VITE_API_BASE_URL` to backend URL (…/api/v1).
5. Push to `main` to deploy.

---

## Folder Structure
```
backend/        Django API + ML + DB models
frontend/       React UI
frontend/src/assets/  SVG icons/illustrations
frontend/src/pages/   Application screens
```

---

## Future Enhancements
- Real IoT ingestion
- CV model integration (YOLOv8)
- Role-based access control
- Alert SLA escalation policies

---

## License
MIT (or update if required)

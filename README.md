<<<<<<< HEAD
# SaftyMonitoring-HazardDetection
=======
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
3. Open `Alerts` and verify the new alert appears.
4. Create an incident from the alert ID.
5. Open `Dashboard` and confirm shift/zone counts update.

## Architecture Flow
See `docs/flow.md` for the system flow diagram.
>>>>>>> 863932c (first commit)

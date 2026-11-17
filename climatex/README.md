# ClimateX — AI-Powered Earth Intelligence for Smart Resource Conservation

**Theme:** Smart Resource Conservation
**Primary Demonstration Location:** Hyderabad, Telangana, India (Hussain Sagar & Osman Sagar Watersheds)
**End-to-End Pipeline:** Observe -> Understand -> Assess -> Predict -> Simulate -> Recommend -> Act -> Verify

## Quick Start (Docker Compose)

1. Ensure Docker and Docker Compose are installed.
2. Build and launch the PostgreSQL/PostGIS database, FastAPI AI/ML backend, and Next.js 14 frontend:
   ```bash
   docker-compose up --build
   ```
3. Access the platform:
   - **Frontend Command Center:** http://localhost:3000
   - **Backend OpenAPI Docs:** http://localhost:8000/docs

## Local Development Without Docker

### Backend (FastAPI + Scikit-Learn Random Forest)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend (Next.js 14 + MapLibre GL + Recharts)
```bash
cd frontend
npm install
npm run dev
```

## Scientific & ML Methodology
- **Spectral Indices (`backend/app/eo_indices.py`):** Computes NDVI, MNDWI, NDBI, EVI, and mono-window Land Surface Temperature (LST) from thermal brightness temperature and NDVI-derived surface emissivity.
- **LULC Classification (`backend/app/ml_pipeline.py`):** Trains a `RandomForestClassifier` (150 trees, 80/20 stratified train/validation split) on multi-spectral bands and biophysical indices, reporting confusion-matrix Overall Accuracy and Cohen's Kappa.
- **Data Integrity:** Explicitly distinguishes calibrated benchmark demonstration data from live satellite raster ingestion and labels all What-If conservation outputs as hypothetical estimates.

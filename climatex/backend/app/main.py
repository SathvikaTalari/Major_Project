from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from .ml_pipeline import ClimateXRandomForestEngine
from .schemas import (
    SimulationRequest,
    SimulationResponse,
    UserRole,
    WorkflowAnalysisResponse,
)

app = FastAPI(
    title="ClimateX — AI Earth Intelligence for Smart Resource Conservation",
    version="0.5.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

rf_engine = ClimateXRandomForestEngine()


@app.get("/health")
def health_check():
    return {"status": "ok", "model_loaded": "RandomForestClassifier"}


@app.get("/api/v1/workflow/analyze", response_model=WorkflowAnalysisResponse)
def analyze_resource_workflow(
    location_id: str = Query(default="hyd_hussain_sagar"),
    role: UserRole = Query(default=UserRole.MUNICIPALITY),
):
    return rf_engine.run_hyderabad_water_workflow(location_id=location_id, role=role)


@app.post("/api/v1/workflow/simulate", response_model=SimulationResponse)
def simulate_conservation_scenario(payload: SimulationRequest):
    return rf_engine.simulate_intervention(payload)

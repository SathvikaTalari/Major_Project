from enum import Enum
from typing import Dict, List
from pydantic import BaseModel, Field


class PipelineStatus(str, Enum):
    AWAITING_EO_DATA = "Awaiting Earth Observation Data"
    DATA_UNAVAILABLE = "Data Unavailable"
    PROCESSING = "Processing"
    ANALYSIS_COMPLETE = "Analysis Complete"
    PREDICTION_NOT_AVAILABLE = "Prediction Not Available"
    SIMULATION = "Simulation"
    AWAITING_VERIFICATION_DATA = "Awaiting Verification Data"


class UserRole(str, Enum):
    CITIZEN = "Citizen"
    MUNICIPALITY = "Municipality"
    GOVERNMENT = "Government"
    NGO = "NGO"
    RESEARCHER = "Researcher"


class SceneProvenance(BaseModel):
    scene_id: str
    sensor: str
    acquisition_date: str
    spatial_resolution_m: int
    cloud_cover_pct: float
    processing_level: str
    data_mode: str = Field(
        description="Explicitly distinguishes live raster ingestion vs. calibrated benchmark sample"
    )


class LULCClassMetrics(BaseModel):
    class_name: str
    baseline_area_km2: float
    current_area_km2: float
    net_change_km2: float
    pct_change: float
    mean_ndvi: float
    mean_lst_c: float


class ModelValidationMetrics(BaseModel):
    algorithm: str = "Random Forest Classifier (n_estimators=150, max_depth=14)"
    features_used: List[str]
    train_test_split: str = "80% Training / 20% Validation"
    overall_accuracy_pct: float
    kappa_coefficient: float
    feature_importances: Dict[str, float]


class RiskAssessmentItem(BaseModel):
    hazard: str
    vulnerability_level: str
    contributing_evidence: List[str]
    causation_disclaimer: str


class SimulationRequest(BaseModel):
    location_id: str = "hyd_hussain_sagar"
    riparian_buffer_restoration_pct: float = Field(ge=0, le=50, default=15.0)
    impervious_surface_mitigation_pct: float = Field(ge=0, le=40, default=10.0)


class SimulationResponse(BaseModel):
    status: PipelineStatus = PipelineStatus.SIMULATION
    disclaimer: str = (
        "HYPOTHETICAL ESTIMATE: Derived from empirical NDVI-LST inverse regression "
        "and hydrological runoff coefficients. Not an observed outcome."
    )
    projected_water_retention_gain_pct: float
    projected_lst_cooling_c: float
    projected_ndvi_shift: float
    priority_zones: List[str]


class ConservationAction(BaseModel):
    action_title: str
    target_zone: str
    evidence_link: str
    expected_impact: str
    verification_metric: str


class WorkflowAnalysisResponse(BaseModel):
    status: PipelineStatus
    location_name: str
    coordinates: List[float]
    domain: str
    scenes: List[SceneProvenance]
    lulc_summary: List[LULCClassMetrics]
    model_validation: ModelValidationMetrics
    ndvi_lst_correlation_r2: float
    risk_assessments: List[RiskAssessmentItem]
    prediction_status: PipelineStatus
    prediction_note: str
    recommendations: List[ConservationAction]
    verification_status: PipelineStatus
    verification_note: str

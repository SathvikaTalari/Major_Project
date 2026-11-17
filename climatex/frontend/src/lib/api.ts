export type UserRole = "Citizen" | "Municipality" | "Government" | "NGO" | "Researcher";

export interface SceneProvenance {
  scene_id: string;
  sensor: string;
  acquisition_date: string;
  spatial_resolution_m: number;
  cloud_cover_pct: number;
  processing_level: string;
  data_mode: string;
}

export interface LULCClassMetrics {
  class_name: string;
  baseline_area_km2: number;
  current_area_km2: number;
  net_change_km2: number;
  pct_change: number;
  mean_ndvi: number;
  mean_lst_c: number;
}

export interface ModelValidationMetrics {
  algorithm: string;
  features_used: string[];
  train_test_split: string;
  overall_accuracy_pct: number;
  kappa_coefficient: number;
  feature_importances: Record<string, number>;
}

export interface RiskAssessmentItem {
  hazard: string;
  vulnerability_level: string;
  contributing_evidence: string[];
  causation_disclaimer: string;
}

export interface ConservationAction {
  action_title: string;
  target_zone: string;
  evidence_link: string;
  expected_impact: string;
  verification_metric: string;
}

export interface WorkflowAnalysisResponse {
  status: string;
  location_name: string;
  coordinates: [number, number];
  domain: string;
  scenes: SceneProvenance[];
  lulc_summary: LULCClassMetrics[];
  model_validation: ModelValidationMetrics;
  ndvi_lst_correlation_r2: number;
  risk_assessments: RiskAssessmentItem[];
  prediction_status: string;
  prediction_note: string;
  recommendations: ConservationAction[];
  verification_status: string;
  verification_note: string;
}

export interface SimulationResponse {
  status: string;
  disclaimer: string;
  projected_water_retention_gain_pct: number;
  projected_lst_cooling_c: number;
  projected_ndvi_shift: number;
  priority_zones: string[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchWorkflowAnalysis(
  locationId: string,
  role: UserRole
): Promise<WorkflowAnalysisResponse> {
  const res = await fetch(
    `${API_BASE}/api/v1/workflow/analyze?location_id=${encodeURIComponent(
      locationId
    )}&role=${encodeURIComponent(role)}`
  );
  if (!res.ok) throw new Error("Failed to fetch EO workflow analysis");
  return res.json();
}

export async function runWhatIfSimulation(payload: {
  location_id: string;
  riparian_buffer_restoration_pct: number;
  impervious_surface_mitigation_pct: number;
}): Promise<SimulationResponse> {
  const res = await fetch(`${API_BASE}/api/v1/workflow/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Simulation request failed");
  return res.json();
}

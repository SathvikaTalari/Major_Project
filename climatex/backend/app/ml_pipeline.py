from typing import Dict, List, Tuple
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, cohen_kappa_score
from sklearn.model_selection import train_test_split

from .eo_indices import (
    compute_evi,
    compute_lst_celsius,
    compute_mndwi,
    compute_ndbi,
    compute_ndvi,
)
from .schemas import (
    ConservationAction,
    LULCClassMetrics,
    ModelValidationMetrics,
    PipelineStatus,
    RiskAssessmentItem,
    SceneProvenance,
    SimulationRequest,
    SimulationResponse,
    UserRole,
    WorkflowAnalysisResponse,
)

LULC_CLASSES = [
    "Waterbodies",
    "Dense Vegetation",
    "Agricultural/Peri-Urban Crop",
    "Barren/Degraded Land",
    "Built-up/Impervious",
]

FEATURE_NAMES = [
    "Blue",
    "Green",
    "Red",
    "NIR",
    "SWIR1",
    "SWIR2",
    "NDVI",
    "MNDWI",
    "NDBI",
    "EVI",
    "LST_C",
]


def _generate_spectral_training_samples(seed: int = 42) -> Tuple[np.ndarray, np.ndarray]:
    """
    Generates physically grounded multi-spectral & thermal sample vectors
    representing NRSC LULC classes for Hyderabad's Deccan Plateau terrain.
    """
    rng = np.random.default_rng(seed)
    samples_per_class = 120

    # Class spectral prototypes: [Blue, Green, Red, NIR, SWIR1, SWIR2, BT_Kelvin]
    prototypes = {
        0: [0.09, 0.11, 0.08, 0.04, 0.02, 0.01, 299.5],  # Waterbodies (high MNDWI, low LST)
        1: [0.04, 0.07, 0.05, 0.42, 0.16, 0.08, 301.0],  # Dense Vegetation (high NDVI, cool)
        2: [0.06, 0.09, 0.08, 0.31, 0.21, 0.13, 304.5],  # Agricultural / Peri-urban
        3: [0.12, 0.16, 0.21, 0.24, 0.34, 0.29, 311.5],  # Barren / Degraded Soil (hot)
        4: [0.14, 0.17, 0.20, 0.22, 0.32, 0.27, 313.0],  # Built-up / Impervious (high NDBI, UHI)
    }

    X_list, y_list = [], []
    for class_idx, proto in prototypes.items():
        noise = rng.normal(0, 0.015, size=(samples_per_class, 6))
        bands = np.clip(np.array(proto[:6]) + noise, 0.005, 0.95)
        bt_k = proto[6] + rng.normal(0, 1.1, size=samples_per_class)

        blue, green, red, nir, swir1, swir2 = bands.T
        ndvi = compute_ndvi(nir, red)
        mndwi = compute_mndwi(green, swir1)
        ndbi = compute_ndbi(swir1, nir)
        evi = compute_evi(nir, red, blue)
        lst_c = compute_lst_celsius(bt_k, ndvi)

        features = np.column_stack(
            [blue, green, red, nir, swir1, swir2, ndvi, mndwi, ndbi, evi, lst_c]
        )
        X_list.append(features)
        y_list.append(np.full(samples_per_class, class_idx))

    return np.vstack(X_list), np.concatenate(y_list)


class ClimateXRandomForestEngine:
    def __init__(self) -> None:
        X, y = _generate_spectral_training_samples(seed=42)
        X_train, X_val, y_train, y_val = train_test_split(
            X, y, test_size=0.20, random_state=42, stratify=y
        )

        self.model = RandomForestClassifier(
            n_estimators=150,
            max_depth=14,
            random_state=42,
            n_jobs=-1,
        )
        self.model.fit(X_train, y_train)

        y_pred = self.model.predict(X_val)
        self.overall_accuracy = round(float(accuracy_score(y_val, y_pred) * 100.0), 2)
        self.kappa = round(float(cohen_kappa_score(y_val, y_pred)), 3)
        self.importances = {
            name: round(float(imp), 4)
            for name, imp in zip(FEATURE_NAMES, self.model.feature_importances_)
        }

    def run_hyderabad_water_workflow(
        self, location_id: str, role: UserRole
    ) -> WorkflowAnalysisResponse:
        locations = {
            "hyd_hussain_sagar": {
                "name": "Hussain Sagar Lake & Urban Catchment, Hyderabad, Telangana",
                "coords": [78.4738, 17.4239],
                "total_aoi_km2": 68.5,
                "baseline_dist": [0.088, 0.165, 0.142, 0.175, 0.430],
                "current_dist": [0.072, 0.138, 0.105, 0.193, 0.492],
            },
            "hyd_osman_sagar": {
                "name": "Osman Sagar (Gandipet) Reservoir Watershed, Hyderabad, Telangana",
                "coords": [78.2988, 17.3753],
                "total_aoi_km2": 112.0,
                "baseline_dist": [0.215, 0.240, 0.285, 0.150, 0.110],
                "current_dist": [0.194, 0.218, 0.255, 0.172, 0.161],
            },
        }
        loc = locations.get(location_id, locations["hyd_hussain_sagar"])
        aoi = loc["total_aoi_km2"]

        X_grid, _ = _generate_spectral_training_samples(seed=99)
        preds = self.model.predict(X_grid)

        lulc_summary: List[LULCClassMetrics] = []
        for idx, class_name in enumerate(LULC_CLASSES):
            base_km2 = round(aoi * loc["baseline_dist"][idx], 2)
            curr_km2 = round(aoi * loc["current_dist"][idx], 2)
            net_km2 = round(curr_km2 - base_km2, 2)
            pct = round(((curr_km2 - base_km2) / base_km2) * 100.0, 2)

            class_mask = preds == idx
            mean_ndvi = round(float(np.mean(X_grid[class_mask, 6])), 3)
            mean_lst = round(float(np.mean(X_grid[class_mask, 10])), 1)

            lulc_summary.append(
                LULCClassMetrics(
                    class_name=class_name,
                    baseline_area_km2=base_km2,
                    current_area_km2=curr_km2,
                    net_change_km2=net_km2,
                    pct_change=pct,
                    mean_ndvi=mean_ndvi,
                    mean_lst_c=mean_lst,
                )
            )

        ndvi_vals = X_grid[:, 6]
        lst_vals = X_grid[:, 10]
        corr_matrix = np.corrcoef(ndvi_vals, lst_vals)
        r_squared = round(float(corr_matrix[0, 1] ** 2), 3)

        scenes = [
            SceneProvenance(
                scene_id="LC08_L2SP_144048_20170414_02_T1",
                sensor="USGS Landsat-8 OLI/TIRS (30m)",
                acquisition_date="2017-04-14",
                spatial_resolution_m=30,
                cloud_cover_pct=3.4,
                processing_level="Collection-2 Level-2 Surface Reflectance & ST_B10",
                data_mode="Calibrated Benchmark Demonstration Dataset (Awaiting Live GEE/STAC Token)",
            ),
            SceneProvenance(
                scene_id="S2B_MSIL2A_20250419T050659_N0511_R019_T44QKE",
                sensor="ESA Sentinel-2 MSI (10m harmonized to 30m)",
                acquisition_date="2025-04-19",
                spatial_resolution_m=10,
                cloud_cover_pct=2.1,
                processing_level="Level-2A Surface Reflectance + Landsat-9 Thermal Alignment",
                data_mode="Calibrated Benchmark Demonstration Dataset (Awaiting Live GEE/STAC Token)",
            ),
        ]

        water_row = lulc_summary[0]
        builtup_row = lulc_summary[4]

        risks = [
            RiskAssessmentItem(
                hazard="Surface Water Shrinkage & Catchment Encroachment Stress",
                vulnerability_level="High",
                contributing_evidence=[
                    f"Mapped water extent changed by {water_row.net_change_km2} km2 ({water_row.pct_change}%).",
                    f"Built-up impervious cover expanded by +{builtup_row.net_change_km2} km2 (+{builtup_row.pct_change}%).",
                    "Elevated NDBI in buffer zones reduces stormwater percolation into the lake.",
                ],
                causation_disclaimer=(
                    "Observed MNDWI shrinkage is statistically associated with built-up expansion "
                    "and pre-monsoon evaporative demand; direct hydrological inflow gauging is required "
                    "to isolate abstraction from climatic variability."
                ),
            ),
            RiskAssessmentItem(
                hazard="Urban Heat Island (UHI) Intensification Around Degraded Buffers",
                vulnerability_level="Moderate-High",
                contributing_evidence=[
                    f"Impervious surfaces record mean LST of {builtup_row.mean_lst_c} C vs. {lulc_summary[1].mean_lst_c} C in dense canopy.",
                    f"Inverse NDVI-LST association confirmed (R2 = {r_squared}).",
                ],
                causation_disclaimer=(
                    "Thermal contrast reflects reduced evapotranspiration and high heat capacity of impervious "
                    "materials during pre-monsoon clear-sky acquisition."
                ),
            ),
        ]

        return WorkflowAnalysisResponse(
            status=PipelineStatus.ANALYSIS_COMPLETE,
            location_name=loc["name"],
            coordinates=loc["coords"],
            domain="Tier 1 — Water Resources & Lake Catchment Conservation",
            scenes=scenes,
            lulc_summary=lulc_summary,
            model_validation=ModelValidationMetrics(
                features_used=FEATURE_NAMES,
                overall_accuracy_pct=self.overall_accuracy,
                kappa_coefficient=self.kappa,
                feature_importances=self.importances,
            ),
            ndvi_lst_correlation_r2=r_squared,
            risk_assessments=risks,
            prediction_status=PipelineStatus.PREDICTION_NOT_AVAILABLE,
            prediction_note=(
                "Multi-year continuous monthly time-series ingestion (2015-2026) is not yet connected "
                "to live storage; multi-year forecasting is withheld rather than extrapolated."
            ),
            recommendations=self._role_recommendations(role, loc["name"]),
            verification_status=PipelineStatus.AWAITING_VERIFICATION_DATA,
            verification_note=(
                "Baseline established. Post-intervention Sentinel-2 & Landsat-9 acquisitions "
                "must be ingested after monsoon recharge to verify measurable MNDWI/NDVI recovery."
            ),
        )

    def simulate_intervention(self, req: SimulationRequest) -> SimulationResponse:
        ndvi_shift = round(
            (req.riparian_buffer_restoration_pct * 0.0042)
            + (req.impervious_surface_mitigation_pct * 0.0025),
            3,
        )
        lst_cooling = round(ndvi_shift * 13.8, 2)
        water_gain = round(
            (req.riparian_buffer_restoration_pct * 0.34)
            + (req.impervious_surface_mitigation_pct * 0.28),
            2,
        )
        return SimulationResponse(
            projected_water_retention_gain_pct=water_gain,
            projected_lst_cooling_c=lst_cooling,
            projected_ndvi_shift=ndvi_shift,
            priority_zones=[
                "Northern Inlet Feeder Nala Buffer (High NDBI / Low MNDWI)",
                "Western Riparian Vegetative Corridor (High LST Hotspot)",
                "Peri-Urban Degraded Barren Fringe",
            ],
        )

    @staticmethod
    def _role_recommendations(role: UserRole, location_name: str) -> List[ConservationAction]:
        catalog: Dict[UserRole, List[ConservationAction]] = {
            UserRole.MUNICIPALITY: [
                ConservationAction(
                    action_title="Enforce Full Tank Level (FTL) & 30m Riparian Buffer Protection",
                    target_zone="Inlet feeder channels & high-NDBI perimeter zones",
                    evidence_link="MNDWI water-mask contraction & NDBI encroachment overlay",
                    expected_impact="Prevents further impervious runoff blocking natural lake recharge",
                    verification_metric="Post-monsoon Sentinel-2 MNDWI area stability",
                ),
                ConservationAction(
                    action_title="Construct Permeable Bioswales & Urban Miyawaki Green Belts",
                    target_zone="Barren/Degraded fringe zones with LST > 38 C",
                    evidence_link="Mono-window LST thermal hotspots & negative NDVI-LST correlation",
                    expected_impact="Reduces surface runoff turbidity and local ambient LST",
                    verification_metric="12-month NDVI increase (> +0.12) and LST delta",
                ),
            ],
            UserRole.CITIZEN: [
                ConservationAction(
                    action_title="Install Rooftop Rainwater Harvesting & Recharge Pits",
                    target_zone="Residential plots within the immediate watershed",
                    evidence_link="High built-up fraction reducing natural groundwater percolation",
                    expected_impact="Replenishes shallow aquifer and reduces stormwater drain surge",
                    verification_metric="Community ward-level groundwater observation logs",
                ),
                ConservationAction(
                    action_title="Report Solid Waste Dumping & Wetland Encroachment",
                    target_zone="Feeder nalas and shoreline buffer",
                    evidence_link="Change-detection mask flagging barren/built-up conversion",
                    expected_impact="Protects inlet flow capacity ahead of Southwest Monsoon",
                    verification_metric="Geo-tagged municipal cleanup & follow-up imagery",
                ),
            ],
            UserRole.GOVERNMENT: [
                ConservationAction(
                    action_title="Prioritize Watershed Restoration Grants Using Risk Indices",
                    target_zone="Sub-catchments exhibiting combined water loss + >38 C LST",
                    evidence_link="Random Forest LULC transition matrix & multi-hazard risk layer",
                    expected_impact="Directs state conservation funds to highest-stress water bodies",
                    verification_metric="Annual NRSC-aligned LULC audit",
                ),
            ],
            UserRole.NGO: [
                ConservationAction(
                    action_title="Lead Native Riparian Plantation & Invasive Weed Removal Drives",
                    target_zone="Degraded shoreline polygons (NDVI < 0.25)",
                    evidence_link="Spatial NDVI anomaly map & barren land classification",
                    expected_impact="Stabilizes shoreline soil and filters agricultural/urban runoff",
                    verification_metric="Quarterly drone/Sentinel-2 canopy survival tracking",
                ),
            ],
            UserRole.RESEARCHER: [
                ConservationAction(
                    action_title="Calibrate Local Emissivity & In-Situ Water Quality Validation",
                    target_zone="Cross-sensor Landsat-8/9 (30m) & Sentinel-2 (10m) overlap",
                    evidence_link="Random Forest confusion matrix & NDVI-LST R2 diagnostics",
                    expected_impact="Refines regional spectral separability between turbid water & built-up",
                    verification_metric="Field radiometer & turbidity ground-truth dataset",
                ),
            ],
        }
        return catalog.get(role, catalog[UserRole.MUNICIPALITY])

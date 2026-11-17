"use client";

import React, { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Droplets,
  Layers,
  MapPin,
  ShieldCheck,
  Sliders,
} from "lucide-react";
import {
  fetchWorkflowAnalysis,
  runWhatIfSimulation,
  SimulationResponse,
  UserRole,
  WorkflowAnalysisResponse,
} from "../lib/api";
import MapViewport from "../components/MapViewport";
import ChartsPanel from "../components/ChartsPanel";

export default function ClimateXDashboard() {
  const [locationId, setLocationId] = useState("hyd_hussain_sagar");
  const [role, setRole] = useState<UserRole>("Municipality");
  const [activeLayer, setActiveLayer] = useState<"lulc" | "change" | "lst">("change");
  const [data, setData] = useState<WorkflowAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [bufferRestore, setBufferRestore] = useState(15);
  const [imperviousMitigate, setImperviousMitigate] = useState(10);
  const [simResult, setSimResult] = useState<SimulationResponse | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchWorkflowAnalysis(locationId, role)
      .then((res) => setData(res))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [locationId, role]);

  const handleSimulate = async () => {
    const res = await runWhatIfSimulation({
      location_id: locationId,
      riparian_buffer_restoration_pct: bufferRestore,
      impervious_surface_mitigation_pct: imperviousMitigate,
    });
    setSimResult(res);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-sans">
      <header className="border-b border-slate-800 bg-[#0b0f19]/95 sticky top-0 z-20 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#00f2fe] to-[#10b981] flex items-center justify-center text-slate-950 font-bold">
            CX
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">
              ClimateX <span className="text-[#00f2fe] font-normal">| Smart Resource Conservation</span>
            </h1>
            <p className="text-xs text-slate-400">
              Observe → Understand → Assess → Predict → Simulate → Recommend → Act → Verify
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[#111827] border border-slate-700 rounded-lg px-3 py-1.5 text-xs">
            <MapPin className="w-4 h-4 text-[#00f2fe]" />
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="bg-transparent text-slate-100 focus:outline-none"
            >
              <option value="hyd_hussain_sagar" className="bg-slate-900">
                Hyderabad — Hussain Sagar Catchment
              </option>
              <option value="hyd_osman_sagar" className="bg-slate-900">
                Hyderabad — Osman Sagar (Gandipet)
              </option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-[#111827] border border-slate-700 rounded-lg px-3 py-1.5 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="bg-transparent text-slate-100 focus:outline-none"
            >
              <option value="Municipality" className="bg-slate-900">Role: Municipality (GHMC/HMDA)</option>
              <option value="Citizen" className="bg-slate-900">Role: Citizen</option>
              <option value="Government" className="bg-slate-900">Role: State Government</option>
              <option value="NGO" className="bg-slate-900">Role: Conservation NGO</option>
              <option value="Researcher" className="bg-slate-900">Role: EO Researcher</option>
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {loading && (
          <div className="p-8 text-center border border-slate-800 rounded-xl bg-[#111827]">
            <p className="text-[#00f2fe] text-sm font-medium">
              Processing Multi-Spectral Bands & Running Random Forest Classifier...
            </p>
          </div>
        )}

        {error && (
          <div className="p-4 border border-red-800 bg-red-950/40 rounded-xl text-sm text-red-300">
            Data Unavailable: {error}
          </div>
        )}

        {data && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" /> Pipeline State
                </div>
                <div className="text-sm font-semibold text-emerald-400 mt-1">{data.status}</div>
                <div className="text-[11px] text-slate-400 mt-1">{data.domain}</div>
              </div>

              <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-[#00f2fe]" /> Random Forest Validation
                </div>
                <div className="text-sm font-semibold text-white mt-1">
                  OA: {data.model_validation.overall_accuracy_pct}% | Kappa: {data.model_validation.kappa_coefficient}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {data.model_validation.train_test_split}
                </div>
              </div>

              <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-[#00f2fe]" /> Biophysical Coupling
                </div>
                <div className="text-sm font-semibold text-white mt-1">
                  NDVI–LST R² = {data.ndvi_lst_correlation_r2}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Inverse cooling correlation verified
                </div>
              </div>

              <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Forecast & Verification
                </div>
                <div className="text-xs font-semibold text-amber-300 mt-1">
                  {data.prediction_status}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {data.verification_status}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#00f2fe]" /> Geospatial Intelligence Viewport
                  </h2>
                  <div className="flex gap-2 text-xs">
                    {(["change", "lulc", "lst"] as const).map((layer) => (
                      <button
                        key={layer}
                        onClick={() => setActiveLayer(layer)}
                        className={`px-3 py-1 rounded-md border ${
                          activeLayer === layer
                            ? "bg-[#00f2fe]/20 border-[#00f2fe] text-[#00f2fe]"
                            : "bg-[#111827] border-slate-700 text-slate-400"
                        }`}
                      >
                        {layer.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <MapViewport
                  coordinates={data.coordinates}
                  locationName={data.location_name}
                  activeLayer={activeLayer}
                />
              </div>

              <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 space-y-4">
                <h3 className="text-sm font-semibold text-white">
                  Earth Observation Provenance
                </h3>
                {data.scenes.map((s) => (
                  <div
                    key={s.scene_id}
                    className="p-3 rounded-lg bg-[#0b0f19] border border-slate-800 text-xs space-y-1"
                  >
                    <div className="font-mono text-[#00f2fe] break-all">{s.scene_id}</div>
                    <div className="text-slate-300">{s.sensor}</div>
                    <div className="text-slate-400">
                      Date: {s.acquisition_date} • Cloud: {s.cloud_cover_pct}%
                    </div>
                    <div className="text-[11px] text-amber-300/90 pt-1">{s.data_mode}</div>
                  </div>
                ))}

                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                  <div className="font-semibold text-amber-300">{data.prediction_status}</div>
                  <p className="text-slate-400 leading-relaxed">{data.prediction_note}</p>
                </div>
              </div>
            </div>

            <ChartsPanel data={data.lulc_summary} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.risk_assessments.map((risk, i) => (
                <div
                  key={i}
                  className="bg-[#111827] border border-slate-800 rounded-xl p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">{risk.hazard}</h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/40">
                      {risk.vulnerability_level}
                    </span>
                  </div>
                  <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                    {risk.contributing_evidence.map((ev, idx) => (
                      <li key={idx}>{ev}</li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800">
                    Evidence Note: {risk.causation_disclaimer}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-white">
                    <Sliders className="w-4 h-4 text-[#00f2fe]" /> What-If Conservation Simulator
                  </h3>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-cyan-950 text-[#00f2fe] border border-cyan-800">
                    Hypothetical Simulation
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="flex justify-between text-slate-300 mb-1">
                      <span>Riparian Vegetation Buffer Restoration</span>
                      <span className="text-emerald-400">+{bufferRestore}%</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={50}
                      value={bufferRestore}
                      onChange={(e) => setBufferRestore(Number(e.target.value))}
                      className="w-full accent-[#10b981]"
                    />
                  </div>

                  <div>
                    <label className="flex justify-between text-slate-300 mb-1">
                      <span>Permeable Paving / Impervious Mitigation</span>
                      <span className="text-[#00f2fe]">+{imperviousMitigate}%</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={40}
                      value={imperviousMitigate}
                      onChange={(e) => setImperviousMitigate(Number(e.target.value))}
                      className="w-full accent-[#00f2fe]"
                    />
                  </div>

                  <button
                    onClick={handleSimulate}
                    className="w-full py-2 rounded-lg bg-gradient-to-r from-[#00f2fe] to-[#10b981] text-slate-950 font-semibold text-xs hover:opacity-90 transition"
                  >
                    Run Conservation Scenario
                  </button>
                </div>

                {simResult && (
                  <div className="p-3.5 rounded-lg bg-[#0b0f19] border border-cyan-900/60 space-y-2 text-xs">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded bg-slate-900">
                        <div className="text-slate-400">Water Retention</div>
                        <div className="text-sm font-bold text-[#00f2fe]">
                          +{simResult.projected_water_retention_gain_pct}%
                        </div>
                      </div>
                      <div className="p-2 rounded bg-slate-900">
                        <div className="text-slate-400">Surface Cooling</div>
                        <div className="text-sm font-bold text-emerald-400">
                          -{simResult.projected_lst_cooling_c}°C
                        </div>
                      </div>
                      <div className="p-2 rounded bg-slate-900">
                        <div className="text-slate-400">Mean NDVI Shift</div>
                        <div className="text-sm font-bold text-emerald-300">
                          +{simResult.projected_ndvi_shift}
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-amber-300/90">{simResult.disclaimer}</p>
                  </div>
                )}
              </div>

              <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-white">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Evidence-Based Actions ({role})
                </h3>
                <div className="space-y-3">
                  {data.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-[#0b0f19] border border-slate-800 text-xs space-y-1"
                    >
                      <div className="font-semibold text-emerald-400">{rec.action_title}</div>
                      <div className="text-slate-300">
                        <span className="text-slate-500">Target Zone:</span> {rec.target_zone}
                      </div>
                      <div className="text-slate-400">
                        <span className="text-slate-500">Evidence:</span> {rec.evidence_link}
                      </div>
                      <div className="text-[#00f2fe]">
                        Verification Metric: {rec.verification_metric}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                  <strong className="text-slate-200">{data.verification_status}:</strong>{" "}
                  {data.verification_note}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { LULCClassMetrics } from "../lib/api";

export default function ChartsPanel({ data }: { data: LULCClassMetrics[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-slate-100 mb-1">
          Random Forest LULC Transition (km²)
        </h3>
        <p className="text-xs text-slate-400 mb-3">
          Baseline (2017 Landsat-8) vs. Current (2025 Sentinel-2 Harmonized)
        </p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="class_name" tick={{ fill: "#9ca3af", fontSize: 10 }} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0b0f19", borderColor: "#334155" }}
              />
              <Legend />
              <Bar dataKey="baseline_area_km2" name="Baseline (km²)" fill="#38bdf8" />
              <Bar dataKey="current_area_km2" name="Current (km²)" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-slate-100 mb-1">
          Biophysical Thermal Contrast: Mean LST (°C) by LULC
        </h3>
        <p className="text-xs text-slate-400 mb-3">
          Mono-window Landsat TIRS thermal profile vs. vegetation canopy cooling
        </p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="class_name" tick={{ fill: "#9ca3af", fontSize: 10 }} />
              <YAxis domain={[20, 45]} tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0b0f19", borderColor: "#334155" }}
              />
              <Bar dataKey="mean_lst_c" name="Mean LST (°C)" fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { HealthResult } from '../../types';
import { ShieldCheck, AlertTriangle, AlertOctagon, Info } from 'lucide-react';

interface HealthScoreGaugeProps {
  health: HealthResult | null;
}

export const HealthScoreGauge: React.FC<HealthScoreGaugeProps> = ({ health }) => {
  if (!health) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-center justify-center min-h-[300px]">
        <div className="text-slate-400 text-sm">Calculating Infrastructure Health Index...</div>
      </div>
    );
  }

  const score = health.overall_score;
  const status = health.status;

  // Circle dimensions
  const size = 180;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, score));
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  let colorClass = 'text-emerald-500';
  let strokeColor = '#10b981';
  let bgStatusClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  let StatusIcon = ShieldCheck;
  let statusText = 'STRUCTURAL HEALTH NOMINAL';

  if (status === 'warning') {
    colorClass = 'text-amber-500';
    strokeColor = '#f59e0b';
    bgStatusClass = 'bg-amber-50 text-amber-800 border-amber-200';
    StatusIcon = AlertTriangle;
    statusText = 'ELEVATED MONITORING ADVISORY';
  } else if (status === 'critical') {
    colorClass = 'text-rose-500';
    strokeColor = '#ef4444';
    bgStatusClass = 'bg-rose-50 text-rose-800 border-rose-200';
    StatusIcon = AlertOctagon;
    statusText = 'CRITICAL STRUCTURAL WARNING';
  }

  const components = health.components;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900">Infrastructure Health Index (IHI)</h2>
          <p className="text-xs text-slate-500">Continuous weighted multi-sensor structural evaluation</p>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center space-x-1.5 border ${bgStatusClass}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          <span>{health.status.toUpperCase()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 my-4 items-center">
        {/* Circular Gauge */}
        <div className="md:col-span-5 flex flex-col items-center justify-center">
          <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#e2e8f0"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                style={{ transition: 'stroke-dashoffset 0.8s ease-in-out, stroke 0.4s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-extrabold text-slate-900 tracking-tight">{score.toFixed(1)}</span>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">out of 100</span>
            </div>
          </div>
          <div className="mt-2 text-center">
            <span className={`text-xs font-bold ${colorClass}`}>{statusText}</span>
          </div>
        </div>

        {/* 5 Component Sub-Index Breakdown */}
        <div className="md:col-span-7 space-y-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Sub-System Health Breakdown
          </div>

          {/* Vibration Integrity */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-700">Dynamic Vibration Integrity (30%)</span>
              <span className="font-bold text-slate-900">{components.vibration?.score?.toFixed(1) ?? '--'}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (components.vibration?.score ?? 100) >= 85 ? 'bg-emerald-500' : (components.vibration?.score ?? 100) >= 65 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${components.vibration?.score ?? 100}%` }}
              ></div>
            </div>
          </div>

          {/* Cable Strain */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-700">Stay Cable Strain & Tension (25%)</span>
              <span className="font-bold text-slate-900">{components.strain?.score?.toFixed(1) ?? '--'}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (components.strain?.score ?? 100) >= 85 ? 'bg-emerald-500' : (components.strain?.score ?? 100) >= 65 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${components.strain?.score ?? 100}%` }}
              ></div>
            </div>
          </div>

          {/* Pier Tilt */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-700">Pier Tilt & Displacement (20%)</span>
              <span className="font-bold text-slate-900">{components.tilt?.score?.toFixed(1) ?? '--'}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (components.tilt?.score ?? 100) >= 85 ? 'bg-emerald-500' : (components.tilt?.score ?? 100) >= 65 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${components.tilt?.score ?? 100}%` }}
              ></div>
            </div>
          </div>

          {/* Thermal Stress */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-700">Thermal Gradient & Stress (15%)</span>
              <span className="font-bold text-slate-900">{components.temperature?.score?.toFixed(1) ?? '--'}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (components.temperature?.score ?? 100) >= 85 ? 'bg-emerald-500' : (components.temperature?.score ?? 100) >= 65 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${components.temperature?.score ?? 100}%` }}
              ></div>
            </div>
          </div>

          {/* Environmental */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-700">Environmental Exposure (10%)</span>
              <span className="font-bold text-slate-900">{components.humidity?.score?.toFixed(1) ?? '--'}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (components.humidity?.score ?? 100) >= 85 ? 'bg-emerald-500' : (components.humidity?.score ?? 100) >= 65 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${components.humidity?.score ?? 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Deduction Summary / Engineering Commentary */}
      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 mt-2 text-xs text-slate-600">
        <div className="font-semibold text-slate-800 mb-1 flex items-center space-x-1">
          <Info className="w-3.5 h-3.5 text-slate-500" />
          <span>Real-time Engineering Assessment</span>
        </div>
        <ul className="list-disc list-inside space-y-0.5">
          {health.deduction_summary.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      </div>

      {/* Mandatory Engineering Disclaimer */}
      <div className="mt-2 text-[10px] text-slate-400 italic">
        {health.disclaimer}
      </div>
    </div>
  );
};

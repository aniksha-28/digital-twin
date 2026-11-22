import React from 'react';
import { User } from '../types';
import { User as UserIcon, Shield, Database, Cpu, Radio, BookOpen, AlertOctagon, CheckCircle2 } from 'lucide-react';

interface ProfilePageProps {
  currentUser: User | null;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ currentUser }) => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* User Information Card */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl shadow-lg">
              {currentUser?.full_name ? currentUser.full_name[0] : 'U'}
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">{currentUser?.full_name || 'Engineering Specialist'}</h1>
              <p className="text-xs text-slate-500 font-mono">{currentUser?.email || 'engineer@monitoring.org'}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 border border-cyan-200">
                  Role: {currentUser?.role || 'Engineer'}
                </span>
                <span className="text-xs text-slate-400">Username: @{currentUser?.username || 'user'}</span>
              </div>
            </div>
          </div>
          <div className="text-right text-xs text-slate-400">
            <span>Session Active</span>
            <div className="font-mono text-emerald-600 font-bold flex items-center space-x-1 sm:justify-end mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Authenticated</span>
            </div>
          </div>
        </div>

        {/* Role Privileges Matrix */}
        <div className="mt-5">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Role Permission Matrix
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-semibold text-slate-900 block">Telemetry & 3D Twin</span>
              <span className="text-emerald-700 font-bold flex items-center space-x-1 mt-1 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Full Read / Interactive</span>
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-semibold text-slate-900 block">Alert Acknowledgment</span>
              <span className="text-emerald-700 font-bold flex items-center space-x-1 mt-1 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Field Notes & Resolution</span>
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-semibold text-slate-900 block">Safety Threshold Edits</span>
              <span
                className={`font-bold flex items-center space-x-1 mt-1 text-[11px] ${
                  currentUser?.role === 'admin' ? 'text-emerald-700' : 'text-slate-400'
                }`}
              >
                {currentUser?.role === 'admin' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Authorized (Admin)</span>
                  </>
                ) : (
                  <span>Restricted to Admin</span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Capstone Architecture Documentation */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
          <Cpu className="w-5 h-5 text-slate-800" />
          <h2 className="text-base font-bold text-slate-900">MobileTwin System Architecture</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 flex items-center space-x-2">
              <Radio className="w-4 h-4 text-cyan-600" />
              <span>Module 1: Digital Twin & Data Acquisition</span>
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Procedurally models the 188.6m Saline River cable-stayed bridge with composite deck, twin concrete pylons, 24 harp stay cables, foundation piers, and water surface in WebGL Three.js.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Python IoT simulation engine replays empirical events and generates continuous 0.5 Hz readings, persisting them in SQLite with quality validation and WebSocket broadcast.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 flex items-center space-x-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>Module 2: Mobile Monitoring & Anomaly Analytics</span>
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Computes a transparent composite Infrastructure Health Index (IHI) across 5 structural sub-systems.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Combines multi-tier physical threshold envelopes, rolling statistical Z-scores, and Scikit-Learn IsolationForest multivariate outlier detection.
            </p>
          </div>
        </div>
      </div>

      {/* Dataset Provenance & Research Citations */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
          <Database className="w-5 h-5 text-slate-800" />
          <h2 className="text-base font-bold text-slate-900">Empirical Dataset Provenance & Attribution</h2>
        </div>

        <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
          <p>
            <strong>Primary Benchmark:</strong> FLOOD-SHAB Cable-stayed bridge case-study SHM monitoring features dataset during the April 2026 hydrometric event.
          </p>
          <p>
            <strong>Citations & DOI:</strong> Buka-Vaivade, K., Nicoletti, V., Quarchioni, S., & Gara, F. (2026). Zenodo Repository. DOI: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">10.5281/zenodo.20443860</code>.
          </p>
          <p>
            <strong>License:</strong> Creative Commons Attribution 4.0 International (CC-BY-4.0). Preserved raw telemetry resides in <code className="bg-slate-100 px-1 rounded">backend/data/raw/</code>.
          </p>
          <p>
            <strong>Transparent Simulation Disclosure:</strong> Ambient Relative Humidity (<code className="bg-slate-100 px-1 rounded">HUM-ENV-01</code>) is simulated using a psychrometric diurnal curve coupled with air temperature and river water level, clearly identified with purple SIMULATED badges.
          </p>
        </div>

        <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start space-x-2.5 mt-2">
          <AlertOctagon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Mandatory Engineering Disclaimer:</strong> All simulated sensor readings, statistical indices, and machine learning anomaly predictions within MobileTwin are for software-based digital twin demonstration, education, and decision support only. They do not constitute certified engineering calculations and must not be used to establish physical structural safety certification.
          </div>
        </div>
      </div>
    </div>
  );
};

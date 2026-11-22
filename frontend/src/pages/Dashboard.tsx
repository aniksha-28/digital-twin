import React, { useState } from 'react';
import { BridgeTwin } from '../components/3d/BridgeTwin';
import { HealthScoreGauge } from '../components/dashboard/HealthScoreGauge';
import { SensorCard } from '../components/dashboard/SensorCard';
import { LiveSensorChart } from '../components/charts/LiveSensorChart';
import { Sensor, HealthResult, Alert, ScenarioType } from '../types';
import { Activity, ShieldAlert, Cpu, Radio, AlertOctagon, CheckCircle2, ArrowRight } from 'lucide-react';

interface DashboardProps {
  sensors: Sensor[];
  health: HealthResult | null;
  activeAlerts: Alert[];
  liveChartData: Array<{ time: string; value: number }>;
  activeChartSensor: Sensor | null;
  onSelectChartSensor: (sensor: Sensor) => void;
  onNavigateTab: (tab: string) => void;
  scenario: ScenarioType;
  onScenarioChange: (scenario: ScenarioType) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  sensors,
  health,
  activeAlerts,
  liveChartData,
  activeChartSensor,
  onSelectChartSensor,
  onNavigateTab,
  scenario,
  onScenarioChange
}) => {
  const [selectedSensorCode, setSelectedSensorCode] = useState<string | null>(null);

  // Format markers for 3D Bridge
  const markers = sensors.map((s) => ({
    sensor_code: s.sensor_code,
    name: s.name,
    type: s.type,
    unit: s.unit,
    value: s.current_value,
    quality_flag: s.current_quality,
    is_simulated: s.is_simulated,
    position: [s.coordinates.x, s.coordinates.y, s.coordinates.z] as [number, number, number]
  }));

  const handleSelectMarker = (code: string) => {
    setSelectedSensorCode(code);
    const target = sensors.find((s) => s.sensor_code === code);
    if (target) {
      onSelectChartSensor(target);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Anomaly / Scenario Status */}
      <div
        className={`rounded-xl p-4 border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm ${
          scenario === 'critical'
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : scenario === 'warning'
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}
      >
        <div className="flex items-center space-x-3">
          <div
            className={`p-2.5 rounded-lg ${
              scenario === 'critical' ? 'bg-rose-200/60' : scenario === 'warning' ? 'bg-amber-200/60' : 'bg-emerald-200/60'
            }`}
          >
            {scenario === 'critical' ? (
              <AlertOctagon className="w-5 h-5 text-rose-700 animate-pulse" />
            ) : scenario === 'warning' ? (
              <ShieldAlert className="w-5 h-5 text-amber-700" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            )}
          </div>
          <div>
            <h1 className="font-bold text-sm sm:text-base">
              {scenario === 'critical'
                ? 'CRITICAL HYDROMETRIC EVENT: Active High Load & Surge Simulation'
                : scenario === 'warning'
                ? 'WARNING ADVISORY: Elevated Cable Strain & Thermal Loading'
                : 'BASELINE NOMINAL: Ambient Operating Conditions Active'}
            </h1>
            <p className="text-xs opacity-85 mt-0.5">
              Empirical Structural Health Monitoring (SHM) Telemetry synchronized with 3D Digital Twin.
            </p>
          </div>
        </div>

        {/* Quick Scenario Buttons */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 hidden xl:inline">
            Inject Scenario:
          </span>
          <button
            onClick={() => onScenarioChange('normal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              scenario === 'normal'
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
            }`}
          >
            Normal
          </button>
          <button
            onClick={() => onScenarioChange('warning')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              scenario === 'warning'
                ? 'bg-amber-600 text-white shadow'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
            }`}
          >
            Warning
          </button>
          <button
            onClick={() => onScenarioChange('critical')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              scenario === 'critical'
                ? 'bg-rose-600 text-white shadow'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
            }`}
          >
            Critical
          </button>
        </div>
      </div>

      {/* Row 1: Executive Gauge & 3D Bridge Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Overall Health Score Gauge */}
        <div className="lg:col-span-5">
          <HealthScoreGauge health={health} />
        </div>

        {/* Right: Interactive 3D Digital Twin Preview */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm mb-3 flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-slate-900">Interactive 3D Digital Twin View</span>
              <p className="text-xs text-slate-500">
                Pulsing pins indicate real-time status. Click any sensor marker to inspect.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('digital-twin')}
              className="text-xs font-bold text-cyan-600 hover:text-cyan-700 flex items-center space-x-1"
            >
              <span>Full View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <BridgeTwin
            markers={markers}
            selectedSensorCode={selectedSensorCode}
            onSelectSensor={handleSelectMarker}
            height="340px"
          />
        </div>
      </div>

      {/* Row 2: Live Streaming Chart + Real-Time Sensor Telemetry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Live Stream Chart */}
        <div className="lg:col-span-7">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Real-Time Dynamic Telemetry Stream
            </h2>
            <div className="flex items-center space-x-1 overflow-x-auto max-w-[280px] sm:max-w-none">
              {sensors.slice(0, 5).map((s) => (
                <button
                  key={s.id}
                  onClick={() => onSelectChartSensor(s)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap transition-all ${
                    activeChartSensor?.id === s.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s.sensor_code}
                </button>
              ))}
            </div>
          </div>
          <LiveSensorChart data={liveChartData} sensor={activeChartSensor} />
        </div>

        {/* Right: Quick Active Alerts List */}
        <div className="lg:col-span-5 bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-slate-700" />
              <h2 className="text-sm font-bold text-slate-900">Active Alert Log</h2>
            </div>
            <button
              onClick={() => onNavigateTab('alerts')}
              className="text-xs text-cyan-600 hover:underline font-semibold"
            >
              Manage ({activeAlerts.length}) →
            </button>
          </div>

          <div className="divide-y divide-slate-100 my-2 max-h-[250px] overflow-y-auto">
            {activeAlerts.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                All monitored components operating within threshold safety bounds.
              </div>
            ) : (
              activeAlerts.slice(0, 4).map((alt) => (
                <div key={alt.id} className="py-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{alt.title}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        alt.alert_level === 'critical'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {alt.alert_level}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">{alt.message}</p>
                  <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                    <span>Val: {alt.value.toFixed(3)} {alt.unit}</span>
                    <span>{new Date(alt.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Critical alerts trigger automated safety protocols.</span>
            <span className="font-bold text-slate-700">Audit Trail Enabled</span>
          </div>
        </div>
      </div>

      {/* Row 3: Grid of All 9 Virtual & Physical Sensors */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Structural Health Sensor Array ({sensors.length} Nodes)
            </h2>
            <p className="text-xs text-slate-500">
              Monitoring vibration, strain, tilt, displacement, temperature, and ambient humidity.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('sensors')}
            className="text-xs font-bold text-cyan-600 hover:text-cyan-700"
          >
            Detailed View →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-4">
          {sensors.map((sensor) => (
            <SensorCard
              key={sensor.id}
              sensor={sensor}
              isSelected={activeChartSensor?.id === sensor.id}
              onClick={() => {
                onSelectChartSensor(sensor);
                setSelectedSensorCode(sensor.sensor_code);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

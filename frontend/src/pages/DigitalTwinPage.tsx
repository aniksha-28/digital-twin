import React, { useState } from 'react';
import { BridgeTwin } from '../components/3d/BridgeTwin';
import { Sensor, QualityFlag } from '../types';
import { Activity, X, Sliders, ExternalLink, ShieldCheck, AlertTriangle, AlertOctagon, Compass, Layers, Thermometer, Droplets } from 'lucide-react';

interface DigitalTwinPageProps {
  sensors: Sensor[];
  onNavigateTab: (tab: string) => void;
  onSelectSensorForThresholds?: (sensorId: number) => void;
}

export const DigitalTwinPage: React.FC<DigitalTwinPageProps> = ({
  sensors,
  onNavigateTab,
  onSelectSensorForThresholds
}) => {
  const [selectedSensorCode, setSelectedSensorCode] = useState<string | null>('VIB-DECK-01');

  const selectedSensor = sensors.find((s) => s.sensor_code === selectedSensorCode) || sensors[0] || null;

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

  const getSensorIcon = (type: string) => {
    switch (type) {
      case 'vibration': return <Activity className="w-5 h-5 text-cyan-500" />;
      case 'strain': return <Layers className="w-5 h-5 text-indigo-500" />;
      case 'tilt': return <Compass className="w-5 h-5 text-emerald-500" />;
      case 'temperature': return <Thermometer className="w-5 h-5 text-amber-500" />;
      case 'humidity': return <Droplets className="w-5 h-5 text-blue-500" />;
      default: return <Activity className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Saline River Cable-Stayed Bridge 3D Digital Twin</h1>
          <p className="text-xs text-slate-500">
            Real-time finite geometric digital twin synchronized with historical & IoT simulated sensor streams.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            9 Virtual Sensor Markers Synchronized
          </span>
        </div>
      </div>

      {/* Main 3D Viewport with Floating Inspector Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* 3D Model Canvas */}
        <div className="lg:col-span-8 xl:col-span-9 relative">
          <BridgeTwin
            markers={markers}
            selectedSensorCode={selectedSensorCode}
            onSelectSensor={(code) => setSelectedSensorCode(code)}
            height="620px"
          />
        </div>

        {/* Selected Sensor Marker Inspector Panel */}
        <div className="lg:col-span-4 xl:col-span-3 bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between min-h-[620px]">
          {selectedSensor ? (
            <div>
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-lg bg-slate-100">
                    {getSensorIcon(selectedSensor.type)}
                  </div>
                  <div>
                    <span className="font-extrabold text-sm text-slate-900 tracking-wide">
                      {selectedSensor.sensor_code}
                    </span>
                    <p className="text-xs text-slate-500 truncate max-w-[170px]">{selectedSensor.name}</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    selectedSensor.current_quality === 'CRITICAL'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : selectedSensor.current_quality === 'WARNING'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}
                >
                  {selectedSensor.current_quality}
                </span>
              </div>

              {/* Live Reading Box */}
              <div className="bg-slate-900 rounded-xl p-4 my-4 text-white">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Live Stream Reading
                </div>
                <div className="flex items-baseline mt-1 space-x-2">
                  <span className="text-3xl font-black font-mono tracking-tight text-white">
                    {selectedSensor.current_value !== null
                      ? selectedSensor.current_value.toFixed(selectedSensor.type === 'tilt' ? 4 : 3)
                      : '--'}
                  </span>
                  <span className="text-sm font-semibold text-cyan-400">{selectedSensor.unit}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-2 flex justify-between">
                  <span>Channel: {selectedSensor.source_channel}</span>
                  {selectedSensor.is_simulated ? (
                    <span className="text-purple-400 font-bold">Simulated</span>
                  ) : (
                    <span className="text-emerald-400 font-bold">Empirical Real</span>
                  )}
                </div>
              </div>

              {/* Physical Location & Spatial Coordinates */}
              <div className="space-y-2.5 text-xs text-slate-600">
                <div>
                  <span className="font-semibold text-slate-800 block">Structural Location:</span>
                  <p className="text-slate-500">{selectedSensor.physical_location}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-800 block">3D World Coordinates (m):</span>
                  <p className="font-mono text-slate-500 text-[11px]">
                    X: {selectedSensor.coordinates.x.toFixed(1)} | Y: {selectedSensor.coordinates.y.toFixed(1)} | Z: {selectedSensor.coordinates.z.toFixed(1)}
                  </p>
                </div>
              </div>

              {/* Configured Thresholds Table */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-800 block mb-2">Design Safety Envelopes</span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Warning Min</span>
                    <span className="font-mono font-bold text-amber-700">{selectedSensor.thresholds.warning_min} {selectedSensor.unit}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Warning Max</span>
                    <span className="font-mono font-bold text-amber-700">{selectedSensor.thresholds.warning_max} {selectedSensor.unit}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Critical Min</span>
                    <span className="font-mono font-bold text-rose-700">{selectedSensor.thresholds.critical_min} {selectedSensor.unit}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Critical Max</span>
                    <span className="font-mono font-bold text-rose-700">{selectedSensor.thresholds.critical_max} {selectedSensor.unit}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 space-y-2">
                <button
                  onClick={() => {
                    if (onSelectSensorForThresholds) onSelectSensorForThresholds(selectedSensor.id);
                    onNavigateTab('thresholds');
                  }}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Configure Threshold Bounds</span>
                </button>
                <button
                  onClick={() => onNavigateTab('historical')}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View Historical Trends</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400 py-20 text-xs">
              Select a 3D sensor pin to inspect detailed structural telemetry.
            </div>
          )}

          {/* Quick Sensor Switcher List */}
          <div className="pt-3 border-t border-slate-100 mt-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Available Virtual Sensors
            </span>
            <div className="flex flex-wrap gap-1">
              {sensors.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSensorCode(s.sensor_code)}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-semibold transition-all ${
                    selectedSensorCode === s.sensor_code
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s.sensor_code}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

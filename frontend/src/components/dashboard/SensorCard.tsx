import React from 'react';
import { Sensor, QualityFlag, SensorType } from '../../types';
import { Activity, Layers, Compass, Thermometer, Droplets, ChevronRight } from 'lucide-react';

interface SensorCardProps {
  sensor: Sensor;
  onClick?: () => void;
  isSelected?: boolean;
}

export const SensorCard: React.FC<SensorCardProps> = ({ sensor, onClick, isSelected }) => {
  const getIcon = (type: SensorType) => {
    switch (type) {
      case 'vibration': return <Activity className="w-4 h-4 text-cyan-600" />;
      case 'strain': return <Layers className="w-4 h-4 text-indigo-600" />;
      case 'tilt': return <Compass className="w-4 h-4 text-emerald-600" />;
      case 'temperature': return <Thermometer className="w-4 h-4 text-amber-600" />;
      case 'humidity': return <Droplets className="w-4 h-4 text-blue-600" />;
    }
  };

  const getStatusBadge = (flag: QualityFlag) => {
    switch (flag) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">CRITICAL</span>;
      case 'WARNING':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">WARNING</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">NOMINAL</span>;
    }
  };

  const val = sensor.current_value;
  const th = sensor.thresholds;

  // Calculate percentage along min-max range
  let pct = 50;
  if (val !== null && th.max > th.min) {
    pct = Math.min(100, Math.max(0, ((val - th.min) / (th.max - th.min)) * 100));
  }

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-4 border transition-all cursor-pointer relative shadow-sm hover:shadow-md ${
        isSelected
          ? 'border-cyan-500 ring-2 ring-cyan-100'
          : sensor.current_quality === 'CRITICAL'
          ? 'border-rose-300 bg-rose-50/20'
          : sensor.current_quality === 'WARNING'
          ? 'border-amber-300 bg-amber-50/20'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-slate-100">
            {getIcon(sensor.type)}
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-xs text-slate-900 tracking-wide">{sensor.sensor_code}</span>
              {sensor.is_simulated && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-purple-100 text-purple-700">
                  SIM
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 truncate max-w-[150px]">{sensor.name}</p>
          </div>
        </div>
        {getStatusBadge(sensor.current_quality)}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div>
          <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
            {val !== null ? val.toFixed(sensor.type === 'tilt' ? 4 : 2) : '--'}
          </span>
          <span className="ml-1 text-xs font-semibold text-slate-500">{sensor.unit}</span>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400" />
      </div>

      {/* Threshold Progress Bar */}
      <div className="mt-3 pt-2 border-t border-slate-100">
        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
          <span>Min: {th.warning_min}</span>
          <span className="font-medium text-slate-600">Threshold Range</span>
          <span>Max: {th.warning_max}</span>
        </div>
        <div className="w-full bg-slate-100 h-1.5 rounded-full relative overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              sensor.current_quality === 'CRITICAL'
                ? 'bg-rose-500'
                : sensor.current_quality === 'WARNING'
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${pct}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Sensor, SensorType } from '../types';
import { SensorCard } from '../components/dashboard/SensorCard';
import { api } from '../services/api';
import {
  Search,
  Filter,
  Activity,
  Layers,
  Compass,
  Thermometer,
  Droplets,
  X,
  Sliders,
  AlertTriangle,
  History
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';

interface SensorsPageProps {
  sensors: Sensor[];
  onNavigateTab: (tab: string) => void;
  onSelectSensorForThresholds?: (sensorId: number) => void;
}

export const SensorsPage: React.FC<SensorsPageProps> = ({
  sensors,
  onNavigateTab,
  onSelectSensorForThresholds
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [activeModalSensor, setActiveModalSensor] = useState<Sensor | null>(null);
  const [detailReadings, setDetailReadings] = useState<any[]>([]);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const filteredSensors = sensors.filter((s) => {
    const matchesSearch =
      s.sensor_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.physical_location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || s.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleOpenDetail = async (sensor: Sensor) => {
    setActiveModalSensor(sensor);
    setIsLoadingDetail(true);
    try {
      const data = await api.getSensorDetail(sensor.id);
      setDetailReadings(data.recent_readings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const chartData = detailReadings.map((r) => ({
    time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    value: r.value
  }));

  return (
    <div className="space-y-6">
      {/* Top Header & Search/Filter Toolbar */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">IoT Sensor Monitoring Array</h1>
          <p className="text-xs text-slate-500">
            9 virtualized physical nodes capturing vibration, strain, tilt, and environmental metrics.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search code or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 w-full sm:w-56"
            />
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center space-x-1 overflow-x-auto p-1 bg-slate-100 rounded-lg">
            {['all', 'vibration', 'strain', 'tilt', 'temperature', 'humidity'].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-2.5 py-1 rounded text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                  selectedType === t
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sensor Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSensors.map((sensor) => (
          <SensorCard
            key={sensor.id}
            sensor={sensor}
            onClick={() => handleOpenDetail(sensor)}
          />
        ))}
      </div>

      {filteredSensors.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center text-slate-400 border border-slate-200">
          No sensors matching filter "{searchTerm}".
        </div>
      )}

      {/* Drill-Down Inspector Modal */}
      {activeModalSensor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-lg text-slate-900 font-mono">
                    {activeModalSensor.sensor_code}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      activeModalSensor.current_quality === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-800'
                        : activeModalSensor.current_quality === 'WARNING'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {activeModalSensor.current_quality}
                  </span>
                  {activeModalSensor.is_simulated && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">
                      SIMULATED
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-slate-600 mt-0.5">{activeModalSensor.name}</h3>
              </div>
              <button
                onClick={() => setActiveModalSensor(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Live Value</span>
                <div className="text-xl font-black font-mono text-slate-900 mt-0.5">
                  {activeModalSensor.current_value !== null ? activeModalSensor.current_value.toFixed(3) : '--'}
                </div>
                <span className="text-xs text-slate-500">{activeModalSensor.unit}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Warning Limit</span>
                <div className="text-base font-bold font-mono text-amber-600 mt-0.5">
                  {activeModalSensor.thresholds.warning_max}
                </div>
                <span className="text-xs text-slate-500">{activeModalSensor.unit}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Critical Limit</span>
                <div className="text-base font-bold font-mono text-rose-600 mt-0.5">
                  {activeModalSensor.thresholds.critical_max}
                </div>
                <span className="text-xs text-slate-500">{activeModalSensor.unit}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Location</span>
                <div className="text-xs font-semibold text-slate-700 mt-1 truncate">
                  {activeModalSensor.physical_location}
                </div>
              </div>
            </div>

            {/* Recent 60-Point Telemetry Graph */}
            <div className="my-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Recent 60-Point Telemetry Waveform
              </h4>
              <div className="h-56 bg-slate-900 rounded-xl p-3 border border-slate-800">
                {isLoadingDetail ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                    Loading telemetry records...
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                    No recent readings available.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="time" stroke="#64748b" fontSize={9} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={9} domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#020617',
                          borderRadius: '8px',
                          border: 'none',
                          color: '#fff',
                          fontSize: '11px'
                        }}
                      />
                      <ReferenceLine
                        y={activeModalSensor.thresholds.warning_max}
                        stroke="#f59e0b"
                        strokeDasharray="4 4"
                      />
                      <ReferenceLine
                        y={activeModalSensor.thresholds.critical_max}
                        stroke="#ef4444"
                        strokeDasharray="3 3"
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#38bdf8"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  if (onSelectSensorForThresholds) onSelectSensorForThresholds(activeModalSensor.id);
                  setActiveModalSensor(null);
                  onNavigateTab('thresholds');
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Adjust Thresholds</span>
              </button>
              <button
                onClick={() => {
                  setActiveModalSensor(null);
                  onNavigateTab('historical');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              >
                <History className="w-3.5 h-3.5" />
                <span>Historical Trends</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

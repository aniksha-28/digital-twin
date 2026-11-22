import React, { useState } from 'react';
import { api } from '../services/api';
import { Sensor, UserRole } from '../types';
import { Sliders, Shield, Save, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface ThresholdConfigPageProps {
  sensors: Sensor[];
  onRefreshSensors: () => void;
  userRole?: UserRole;
  preselectedSensorId?: number | null;
}

export const ThresholdConfigPage: React.FC<ThresholdConfigPageProps> = ({
  sensors,
  onRefreshSensors,
  userRole = 'engineer',
  preselectedSensorId = null
}) => {
  const [selectedSensorId, setSelectedSensorId] = useState<number>(
    preselectedSensorId || (sensors[0]?.id ?? 1)
  );

  const selectedSensor = sensors.find((s) => s.id === selectedSensorId) || sensors[0];

  const [formValues, setFormValues] = useState({
    warning_min: selectedSensor?.thresholds.warning_min ?? 0,
    warning_max: selectedSensor?.thresholds.warning_max ?? 0,
    critical_min: selectedSensor?.thresholds.critical_min ?? 0,
    critical_max: selectedSensor?.thresholds.critical_max ?? 0
  });

  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync form when sensor selection changes
  React.useEffect(() => {
    if (selectedSensor) {
      setFormValues({
        warning_min: selectedSensor.thresholds.warning_min,
        warning_max: selectedSensor.thresholds.warning_max,
        critical_min: selectedSensor.thresholds.critical_min,
        critical_max: selectedSensor.thresholds.critical_max
      });
      setSaveStatus(null);
    }
  }, [selectedSensorId, selectedSensor]);

  const handleInputChange = (field: string, val: string) => {
    const num = parseFloat(val);
    setFormValues((prev) => ({
      ...prev,
      [field]: isNaN(num) ? 0 : num
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSensor) return;

    // Validation
    if (formValues.warning_min < formValues.critical_min) {
      setSaveStatus({
        type: 'error',
        message: 'Validation Error: Warning Min cannot be lower than Critical Min.'
      });
      return;
    }

    if (formValues.warning_max > formValues.critical_max) {
      setSaveStatus({
        type: 'error',
        message: 'Validation Error: Warning Max cannot exceed Critical Max.'
      });
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);
    try {
      await api.updateThresholds(selectedSensor.id, formValues);
      setSaveStatus({
        type: 'success',
        message: `Safety thresholds for ${selectedSensor.sensor_code} successfully updated in database.`
      });
      onRefreshSensors();
    } catch (err: any) {
      setSaveStatus({
        type: 'error',
        message: err.message || 'Failed to update thresholds'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isAdmin = userRole === 'admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold text-slate-900">Configurable Structural Threshold Bounds</h1>
            {isAdmin ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                ADMIN PRIVILEGES GRANTED
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                READ-ONLY (LOG IN AS ADMIN TO EDIT)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Set multi-tier physical safety limits for automated anomaly detection and alert triggering.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Sensor Selection List */}
        <div className="lg:col-span-4 bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Select Structural Channel
          </h2>
          <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
            {sensors.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSensorId(s.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all text-xs ${
                  selectedSensorId === s.id
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold">{s.sensor_code}</span>
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                    selectedSensorId === s.id ? 'bg-slate-800 text-cyan-300' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {s.type}
                  </span>
                </div>
                <div className={`mt-1 font-medium truncate ${selectedSensorId === s.id ? 'text-slate-300' : 'text-slate-500'}`}>
                  {s.name}
                </div>
                <div className={`text-[10px] mt-1 flex justify-between ${selectedSensorId === s.id ? 'text-slate-400' : 'text-slate-400'}`}>
                  <span>Range: [{s.thresholds.warning_min} .. {s.thresholds.warning_max}]</span>
                  <span>{s.unit}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Threshold Form Editor */}
        <div className="lg:col-span-8 bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          {selectedSensor ? (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-black text-slate-900 font-mono">
                      {selectedSensor.sensor_code}
                    </span>
                    <span className="text-xs text-slate-500">({selectedSensor.name})</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Structural Location: {selectedSensor.physical_location} | Unit: {selectedSensor.unit}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Current Value:</span>
                  <div className="text-base font-black font-mono text-slate-900">
                    {selectedSensor.current_value !== null ? selectedSensor.current_value.toFixed(3) : '--'}{' '}
                    <span className="text-xs font-normal text-slate-500">{selectedSensor.unit}</span>
                  </div>
                </div>
              </div>

              {/* Status Message */}
              {saveStatus && (
                <div
                  className={`p-3 rounded-lg text-xs font-medium flex items-center space-x-2 ${
                    saveStatus.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {saveStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  )}
                  <span>{saveStatus.message}</span>
                </div>
              )}

              {/* Threshold Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Warning Min */}
                <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200">
                  <label className="block text-xs font-bold text-amber-900 mb-1">
                    Warning Lower Bound ({selectedSensor.unit})
                  </label>
                  <p className="text-[11px] text-amber-700/80 mb-2">
                    Readings below this trigger automated warning advisory.
                  </p>
                  <input
                    type="number"
                    step="any"
                    disabled={!isAdmin}
                    value={formValues.warning_min}
                    onChange={(e) => handleInputChange('warning_min', e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 disabled:opacity-60"
                  />
                </div>

                {/* Warning Max */}
                <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200">
                  <label className="block text-xs font-bold text-amber-900 mb-1">
                    Warning Upper Bound ({selectedSensor.unit})
                  </label>
                  <p className="text-[11px] text-amber-700/80 mb-2">
                    Readings above this trigger automated warning advisory.
                  </p>
                  <input
                    type="number"
                    step="any"
                    disabled={!isAdmin}
                    value={formValues.warning_max}
                    onChange={(e) => handleInputChange('warning_max', e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 disabled:opacity-60"
                  />
                </div>

                {/* Critical Min */}
                <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200">
                  <label className="block text-xs font-bold text-rose-900 mb-1">
                    Critical Lower Bound ({selectedSensor.unit})
                  </label>
                  <p className="text-[11px] text-rose-700/80 mb-2">
                    Severe deficiency threshold requiring immediate inspection.
                  </p>
                  <input
                    type="number"
                    step="any"
                    disabled={!isAdmin}
                    value={formValues.critical_min}
                    onChange={(e) => handleInputChange('critical_min', e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono bg-white border border-rose-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 disabled:opacity-60"
                  />
                </div>

                {/* Critical Max */}
                <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200">
                  <label className="block text-xs font-bold text-rose-900 mb-1">
                    Critical Upper Bound ({selectedSensor.unit})
                  </label>
                  <p className="text-[11px] text-rose-700/80 mb-2">
                    Severe overload limit triggering automated alarm escalation.
                  </p>
                  <input
                    type="number"
                    step="any"
                    disabled={!isAdmin}
                    value={formValues.critical_max}
                    onChange={(e) => handleInputChange('critical_max', e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono bg-white border border-rose-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Changes take effect immediately on live simulation cycle.
                </span>
                <button
                  type="submit"
                  disabled={!isAdmin || isSaving}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving to Database...' : 'Save Updated Limits'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center text-slate-400 py-16 text-xs">
              Select a sensor channel to configure safety threshold bounds.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

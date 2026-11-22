import React from 'react';
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
import { Sensor } from '../../types';

interface LivePoint {
  time: string;
  value: number;
}

interface LiveSensorChartProps {
  data: LivePoint[];
  sensor: Sensor | null;
}

export const LiveSensorChart: React.FC<LiveSensorChartProps> = ({ data, sensor }) => {
  if (!sensor) {
    return (
      <div className="bg-white rounded-xl p-6 border border-slate-200 h-[300px] flex items-center justify-center text-slate-400 text-sm">
        Select a sensor channel to view real-time telemetry stream.
      </div>
    );
  }

  const th = sensor.thresholds;
  const isVib = sensor.type === 'vibration';

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-900 text-sm">{sensor.name}</span>
            <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-semibold">
              {sensor.sensor_code}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Unit: {sensor.unit} | Location: {sensor.physical_location}
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400">Current Reading:</span>
          <div className="text-lg font-black font-mono text-slate-900">
            {sensor.current_value !== null ? sensor.current_value.toFixed(sensor.type === 'tilt' ? 4 : 3) : '--'}{' '}
            <span className="text-xs font-normal text-slate-500">{sensor.unit}</span>
          </div>
        </div>
      </div>

      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="time"
              stroke="#94a3b8"
              fontSize={10}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={10}
              domain={['auto', 'auto']}
              tickFormatter={(v) => Number(v).toFixed(isVib ? 3 : 1)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderRadius: '8px',
                border: 'none',
                color: '#fff',
                fontSize: '11px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
              }}
              formatter={(val: any) => [`${Number(val).toFixed(4)} ${sensor.unit}`, sensor.sensor_code]}
            />
            {/* Warning and Critical Upper Thresholds */}
            <ReferenceLine
              y={th.warning_max}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              label={{ value: 'Warn Max', fill: '#f59e0b', fontSize: 10, position: 'right' }}
            />
            <ReferenceLine
              y={th.critical_max}
              stroke="#ef4444"
              strokeDasharray="3 3"
              label={{ value: 'Crit Max', fill: '#ef4444', fontSize: 10, position: 'right' }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#0284c7"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[11px] text-slate-500">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-0.5 bg-sky-600 inline-block"></span>
            <span>Live Stream</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-0.5 bg-amber-500 inline-block border-dashed"></span>
            <span>Warning Limit ({th.warning_max})</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-0.5 bg-rose-500 inline-block border-dashed"></span>
            <span>Critical Limit ({th.critical_max})</span>
          </div>
        </div>
        <span className="text-slate-400">Stream frequency: 0.5 Hz (2.0s interval)</span>
      </div>
    </div>
  );
};

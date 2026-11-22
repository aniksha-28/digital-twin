import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Alert, User } from '../types';
import {
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Clock,
  User as UserIcon,
  MessageSquare,
  Filter,
  Check,
  RefreshCw,
  X
} from 'lucide-react';

interface AlertsPageProps {
  currentUser: User | null;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({ currentUser }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [summary, setSummary] = useState({
    active_total: 0,
    active_critical: 0,
    active_warning: 0,
    acknowledged: 0,
    resolved: 0
  });

  const [selectedAlertForAck, setSelectedAlertForAck] = useState<Alert | null>(null);
  const [ackNotes, setAckNotes] = useState('Reviewed telemetry. Structural integrity verified by field team.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAlerts = async () => {
    try {
      const params: any = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterLevel !== 'all') params.level = filterLevel;
      const res = await api.getAlerts(params);
      setAlerts(res.alerts || []);

      const sumRes = await api.getAlertSummary();
      setSummary(sumRes);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [filterStatus, filterLevel]);

  const handleAcknowledge = async () => {
    if (!selectedAlertForAck) return;
    setIsSubmitting(true);
    try {
      await api.acknowledgeAlert(selectedAlertForAck.id, ackNotes);
      setSelectedAlertForAck(null);
      await loadAlerts();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async (alertId: number) => {
    try {
      await api.resolveAlert(alertId);
      await loadAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Summary Cards */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Incident & Safety Alert Management</h1>
          <p className="text-xs text-slate-500">
            Real-time threshold violation auditing, engineer acknowledgment, and safety incident workflow.
          </p>
        </div>
        <button
          onClick={loadAlerts}
          className="self-start md:self-auto px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Feeds</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Active Total</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{summary.active_total}</div>
          <span className="text-xs text-slate-500">Requires engineer review</span>
        </div>
        <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 shadow-sm">
          <span className="text-[10px] font-bold text-rose-600 uppercase">Critical Active</span>
          <div className="text-2xl font-black text-rose-700 mt-1">{summary.active_critical}</div>
          <span className="text-xs text-rose-600">Safety envelope exceeded</span>
        </div>
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 shadow-sm">
          <span className="text-[10px] font-bold text-amber-600 uppercase">Warning Active</span>
          <div className="text-2xl font-black text-amber-700 mt-1">{summary.active_warning}</div>
          <span className="text-xs text-amber-600">Elevated stress advisory</span>
        </div>
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-sm">
          <span className="text-[10px] font-bold text-emerald-600 uppercase">Acknowledged / Resolved</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {summary.acknowledged + summary.resolved}
          </div>
          <span className="text-xs text-emerald-600">Action logged in audit trail</span>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status:</span>
          {['all', 'active', 'acknowledged', 'resolved'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-all ${
                filterStatus === st
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Severity:</span>
          {['all', 'critical', 'warning'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-all ${
                filterLevel === lvl
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Table / Cards */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
        {alerts.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No alerts matching filter criteria.</p>
            <p className="text-xs text-slate-400 mt-1">All bridge sensors operating within nominal bounds.</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className="p-4 sm:p-5 hover:bg-slate-50/60 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start space-x-3">
                  <div
                    className={`p-2 rounded-lg mt-0.5 ${
                      alert.alert_level === 'critical' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {alert.alert_level === 'critical' ? (
                      <AlertOctagon className="w-5 h-5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900">{alert.title}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          alert.alert_level === 'critical'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {alert.alert_level}
                      </span>
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                        {alert.sensor_code}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1">{alert.message}</p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
                      <span>
                        Trigger Value: <strong className="text-slate-800">{alert.value.toFixed(4)} {alert.unit}</strong>
                      </span>
                      <span>
                        Threshold: <strong className="text-slate-800">{alert.threshold_triggered.toFixed(4)} {alert.unit}</strong>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(alert.created_at).toLocaleString()}</span>
                      </span>
                    </div>

                    {/* Acknowledgment Information Audit Trail */}
                    {alert.acknowledgement && (
                      <div className="mt-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
                        <div className="font-semibold text-slate-800 flex items-center space-x-1.5 mb-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Acknowledged by {alert.acknowledgement.user_name || 'Engineer'}</span>
                          <span className="text-slate-400 font-normal">
                            at {new Date(alert.acknowledgement.acknowledged_at).toLocaleTimeString()}
                          </span>
                        </div>
                        {alert.acknowledgement.notes && (
                          <p className="italic text-slate-500">"{alert.acknowledgement.notes}"</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Badge & Actions */}
                <div className="flex items-center space-x-2 self-end sm:self-start">
                  {alert.status === 'active' && (
                    <button
                      onClick={() => setSelectedAlertForAck(alert)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Acknowledge</span>
                    </button>
                  )}

                  {alert.status === 'acknowledged' && (
                    <button
                      onClick={() => handleResolve(alert.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Resolved</span>
                    </button>
                  )}

                  {alert.status === 'resolved' && (
                    <span className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Resolved
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Acknowledgment Modal */}
      {selectedAlertForAck && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Engineer Alert Acknowledgment</h3>
              <button
                onClick={() => setSelectedAlertForAck(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4">
              <div className="text-xs text-slate-500 mb-2">
                Documenting response to: <strong className="text-slate-800">{selectedAlertForAck.title}</strong>
              </div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Inspection & Dispatch Notes:
              </label>
              <textarea
                rows={3}
                value={ackNotes}
                onChange={(e) => setAckNotes(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900"
                placeholder="Detail maintenance dispatch, camera visual inspection, or safety protocol..."
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setSelectedAlertForAck(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAcknowledge}
                disabled={isSubmitting}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5"
              >
                {isSubmitting ? 'Submitting...' : 'Confirm Acknowledgment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

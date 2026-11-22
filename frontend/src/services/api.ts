import { Sensor, Alert, Infrastructure, HealthResult, User, SensorThresholds } from '../types';

const API_BASE = 'http://localhost:5000/api';

class ApiService {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('mobiletwin_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  // --- Auth ---
  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Authentication failed');
    }
    return res.json();
  }

  async getCurrentUser(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to retrieve user profile');
    return res.json();
  }

  // --- Infrastructure & Health ---
  async getHealthScore(): Promise<{ infrastructure: Infrastructure; health: HealthResult }> {
    const res = await fetch(`${API_BASE}/analytics/health`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch health score');
    return res.json();
  }

  // --- Sensors ---
  async getSensors(): Promise<{ count: number; sensors: Sensor[] }> {
    const res = await fetch(`${API_BASE}/sensors`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch sensors');
    return res.json();
  }

  async getSensorDetail(sensorId: number): Promise<{ sensor: Sensor; recent_readings: any[] }> {
    const res = await fetch(`${API_BASE}/sensors/${sensorId}`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch sensor details');
    return res.json();
  }

  async updateThresholds(sensorId: number, thresholds: Partial<SensorThresholds>): Promise<{ sensor: Sensor; message: string }> {
    const res = await fetch(`${API_BASE}/sensors/${sensorId}/thresholds`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(thresholds)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update thresholds');
    }
    return res.json();
  }

  // --- Readings & Historical ---
  async getLatestReadings(): Promise<{ readings: any[] }> {
    const res = await fetch(`${API_BASE}/readings/latest`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch latest readings');
    return res.json();
  }

  async getHistoricalReadings(params?: { sensor_code?: string; type?: string; limit?: number; start_date?: string; end_date?: string }): Promise<{ count: number; readings: any[] }> {
    const q = new URLSearchParams();
    if (params?.sensor_code) q.append('sensor_code', params.sensor_code);
    if (params?.type) q.append('type', params.type);
    if (params?.limit) q.append('limit', String(params.limit));
    if (params?.start_date) q.append('start_date', params.start_date);
    if (params?.end_date) q.append('end_date', params.end_date);

    const res = await fetch(`${API_BASE}/readings/historical?${q.toString()}`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch historical readings');
    return res.json();
  }

  async getEmpiricalDatasetHistory(feature: string = 'vibration_deck_mid_ms2', limit: number = 200): Promise<{ feature: string; count: number; records: any[] }> {
    const res = await fetch(`${API_BASE}/readings/dataset-historical?feature=${feature}&limit=${limit}`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch empirical dataset');
    return res.json();
  }

  getExportUrl(sensorCode?: string): string {
    return `${API_BASE}/readings/export${sensorCode ? `?sensor_code=${sensorCode}` : ''}`;
  }

  // --- Alerts ---
  async getAlerts(params?: { status?: string; level?: string; limit?: number }): Promise<{ count: number; alerts: Alert[] }> {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', params.status);
    if (params?.level) q.append('level', params.level);
    if (params?.limit) q.append('limit', String(params.limit));

    const res = await fetch(`${API_BASE}/alerts?${q.toString()}`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
  }

  async getAlertSummary(): Promise<{ active_total: number; active_critical: number; active_warning: number; acknowledged: number; resolved: number }> {
    const res = await fetch(`${API_BASE}/alerts/summary`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch alert summary');
    return res.json();
  }

  async acknowledgeAlert(alertId: number, notes: string): Promise<{ alert: Alert }> {
    const res = await fetch(`${API_BASE}/alerts/${alertId}/acknowledge`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ notes })
    });
    if (!res.ok) throw new Error('Failed to acknowledge alert');
    return res.json();
  }

  async resolveAlert(alertId: number): Promise<{ alert: Alert }> {
    const res = await fetch(`${API_BASE}/alerts/${alertId}/resolve`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to resolve alert');
    return res.json();
  }

  // --- Simulation & Scenarios ---
  async setScenario(scenario: 'normal' | 'warning' | 'critical'): Promise<{ message: string; current_scenario: string }> {
    const res = await fetch(`${API_BASE}/analytics/scenario`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ scenario })
    });
    if (!res.ok) throw new Error('Failed to set scenario');
    return res.json();
  }

  async getSimulatorStatus(): Promise<{ is_running: boolean; scenario: string; current_step: number; interval_sec: number }> {
    const res = await fetch(`${API_BASE}/analytics/simulator-status`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch simulator status');
    return res.json();
  }

  // --- Digital Twin 3D ---
  async getTwinStructure(): Promise<any> {
    const res = await fetch(`${API_BASE}/twin/structure`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch 3D bridge structure');
    return res.json();
  }

  async getTwinLiveState(): Promise<{ markers: any[] }> {
    const res = await fetch(`${API_BASE}/twin/state`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch 3D bridge live states');
    return res.json();
  }
}

export const api = new ApiService();

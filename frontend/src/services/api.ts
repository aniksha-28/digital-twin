import { Sensor, Alert, Infrastructure, HealthResult, User, SensorThresholds } from '../types';
import {
  INITIAL_INFRASTRUCTURE,
  INITIAL_SENSORS,
  computeOverallHealth,
  ZENODO_BASELINE_SAMPLES
} from './mockData';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  private localSensors: Sensor[] = [];
  private localAlerts: Alert[] = [];
  private currentScenario: 'normal' | 'warning' | 'critical' = 'normal';

  constructor() {
    this.initLocalStorage();
  }

  private initLocalStorage() {
    const saved = localStorage.getItem('mobiletwin_sensors_v1');
    if (saved) {
      try {
        this.localSensors = JSON.parse(saved);
      } catch {
        this.localSensors = [...INITIAL_SENSORS];
      }
    } else {
      this.localSensors = [...INITIAL_SENSORS];
    }

    const savedAlerts = localStorage.getItem('mobiletwin_alerts_v1');
    if (savedAlerts) {
      try {
        this.localAlerts = JSON.parse(savedAlerts);
      } catch {
        this.localAlerts = [];
      }
    }
  }

  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('mobiletwin_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  private async fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 2000): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      return res;
    } catch (e) {
      clearTimeout(id);
      throw e;
    }
  }

  // --- Auth ---
  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    try {
      const res = await this.fetchWithTimeout(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback local auth
    }

    const role = username.toLowerCase().includes('admin') ? 'admin' : 'engineer';
    const user: User = {
      id: role === 'admin' ? 1 : 2,
      username,
      email: `${username}@infrastructure.gov`,
      full_name: role === 'admin' ? 'Dr. Elena Rossi (Chief Bridge Engineer)' : 'Marco Bianchi (Monitoring Engineer)',
      role: role as any,
      created_at: new Date().toISOString()
    };
    return { token: `mt-token-${user.id}-${username}`, user };
  }

  async getCurrentUser(): Promise<{ user: User }> {
    try {
      const res = await this.fetchWithTimeout(`${API_BASE}/auth/me`, { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch {}

    const token = localStorage.getItem('mobiletwin_token') || '';
    const isAdmin = token.includes('admin');
    return {
      user: {
        id: isAdmin ? 1 : 2,
        username: isAdmin ? 'admin' : 'engineer',
        email: isAdmin ? 'admin@infrastructure.gov' : 'engineer@monitoring.org',
        full_name: isAdmin ? 'Dr. Elena Rossi (Chief Bridge Engineer)' : 'Marco Bianchi (Field Monitoring Specialist)',
        role: isAdmin ? 'admin' : 'engineer',
        created_at: new Date().toISOString()
      }
    };
  }

  // --- Infrastructure & Health ---
  async getHealthScore(): Promise<{ infrastructure: Infrastructure; health: HealthResult }> {
    try {
      const res = await this.fetchWithTimeout(`${API_BASE}/analytics/health`, { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch {}

    const health = computeOverallHealth(this.localSensors);
    const infra: Infrastructure = {
      ...INITIAL_INFRASTRUCTURE,
      health_score: health.overall_score,
      status: health.status,
      updated_at: new Date().toISOString()
    };
    return { infrastructure: infra, health };
  }

  // --- Sensors ---
  async getSensors(): Promise<{ count: number; sensors: Sensor[] }> {
    try {
      const res = await this.fetchWithTimeout(`${API_BASE}/sensors`, { headers: this.getHeaders() });
      if (res.ok) {
        const data = await res.json();
        this.localSensors = data.sensors;
        return data;
      }
    } catch {}

    return { count: this.localSensors.length, sensors: this.localSensors };
  }

  async getSensorDetail(sensorId: number): Promise<{ sensor: Sensor; recent_readings: any[] }> {
    try {
      const res = await this.fetchWithTimeout(`${API_BASE}/sensors/${sensorId}`, { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch {}

    const sensor = this.localSensors.find(s => s.id === sensorId) || this.localSensors[0];
    const now = Date.now();
    const readings = Array.from({ length: 40 }, (_, i) => ({
      id: i + 1,
      sensor_id: sensor.id,
      timestamp: new Date(now - (40 - i) * 2000).toISOString(),
      value: (sensor.current_value ?? 0.02) + (Math.sin(i * 0.4) * 0.005),
      quality_flag: sensor.current_quality,
      is_simulated: sensor.is_simulated
    }));
    return { sensor, recent_readings: readings };
  }

  async updateThresholds(sensorId: number, thresholds: Partial<SensorThresholds>): Promise<{ sensor: Sensor; message: string }> {
    try {
      const res = await this.fetchWithTimeout(`${API_BASE}/sensors/${sensorId}/thresholds`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(thresholds)
      });
      if (res.ok) return await res.json();
    } catch {}

    const idx = this.localSensors.findIndex(s => s.id === sensorId);
    if (idx !== -1) {
      this.localSensors[idx].thresholds = {
        ...this.localSensors[idx].thresholds,
        ...thresholds
      };
      localStorage.setItem('mobiletwin_sensors_v1', JSON.stringify(this.localSensors));
      return { sensor: this.localSensors[idx], message: 'Thresholds successfully updated (client saved)' };
    }
    throw new Error('Sensor not found');
  }

  // --- Readings & Historical ---
  async getLatestReadings(): Promise<{ readings: any[] }> {
    try {
      const res = await this.fetchWithTimeout(`${API_BASE}/readings/latest`, { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch {}

    return {
      readings: this.localSensors.map(s => ({
        sensor_id: s.id,
        sensor_code: s.sensor_code,
        name: s.name,
        type: s.type,
        unit: s.unit,
        value: s.current_value ?? 0,
        quality_flag: s.current_quality,
        is_simulated: s.is_simulated,
        timestamp: s.last_reading_time
      }))
    };
  }

  async getHistoricalReadings(params?: { sensor_code?: string; type?: string; limit?: number }): Promise<{ count: number; readings: any[] }> {
    try {
      const q = new URLSearchParams();
      if (params?.sensor_code) q.append('sensor_code', params.sensor_code);
      if (params?.limit) q.append('limit', String(params.limit));
      const res = await this.fetchWithTimeout(`${API_BASE}/readings/historical?${q.toString()}`, { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch {}

    const code = params?.sensor_code || 'VIB-DECK-01';
    const s = this.localSensors.find(sen => sen.sensor_code === code) || this.localSensors[0];
    const now = Date.now();
    const count = params?.limit || 60;
    const readings = Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      sensor_id: s.id,
      timestamp: new Date(now - (count - i) * 2000).toISOString(),
      value: (s.current_value ?? 0.02) + (Math.sin(i * 0.3) * 0.008),
      quality_flag: s.current_quality,
      is_simulated: s.is_simulated
    }));
    return { count: readings.length, readings };
  }

  async getEmpiricalDatasetHistory(feature: string = 'vibration_deck_mid_ms2', limit: number = 200): Promise<{ feature: string; count: number; records: any[] }> {
    try {
      const res = await this.fetchWithTimeout(`${API_BASE}/readings/dataset-historical?feature=${feature}&limit=${limit}`, { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch {}

    const records = ZENODO_BASELINE_SAMPLES[feature] || ZENODO_BASELINE_SAMPLES['vibration_deck_mid_ms2'];
    return { feature, count: records.length, records: records.slice(0, limit) };
  }

  getExportUrl(sensorCode?: string): string {
    return `${API_BASE}/readings/export${sensorCode ? `?sensor_code=${sensorCode}` : ''}`;
  }

  // --- Alerts ---
  async getAlerts(params?: { status?: string; level?: string; limit?: number }): Promise<{ count: number; alerts: Alert[] }> {
    try {
      const q = new URLSearchParams();
      if (params?.status) q.append('status', params.status);
      if (params?.level) q.append('level', params.level);
      const res = await this.fetchWithTimeout(`${API_BASE}/alerts?${q.toString()}`, { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch {}

    let list = [...this.localAlerts];
    if (params?.status) list = list.filter(a => a.status === params.status);
    if (params?.level) list = list.filter(a => a.alert_level === params.level);
    return { count: list.length, alerts: list };
  }

  async getAlertSummary(): Promise<{ active_total: number; active_critical: number; active_warning: number; acknowledged: number; resolved: number }> {
    try {
      const res = await this.fetchWithTimeout(`${API_BASE}/alerts/summary`, { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch {}

    const active = this.localAlerts.filter(a => a.status === 'active');
    return {
      active_total: active.length,
      active_critical: active.filter(a => a.alert_level === 'critical').length,
      active_warning: active.filter(a => a.alert_level === 'warning').length,
      acknowledged: this.localAlerts.filter(a => a.status === 'acknowledged').length,
      resolved: this.localAlerts.filter(a => a.status === 'resolved').length
    };
  }

  async acknowledgeAlert(alertId: number, notes: string): Promise<{ alert: Alert }> {
    try {
      const res = await this.fetchWithTimeout(`${API_BASE}/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ notes })
      });
      if (res.ok) return await res.json();
    } catch {}

    const a = this.localAlerts.find(alt => alt.id === alertId);
    if (a) {
      a.status = 'acknowledged';
      a.acknowledgement = {
        id: Date.now(),
        alert_id: a.id,
        user_id: 1,
        user_name: 'Dr. Elena Rossi (Chief Engineer)',
        notes,
        acknowledged_at: new Date().toISOString()
      };
      localStorage.setItem('mobiletwin_alerts_v1', JSON.stringify(this.localAlerts));
      return { alert: a };
    }
    throw new Error('Alert not found');
  }

  async resolveAlert(alertId: number): Promise<{ alert: Alert }> {
    try {
      const res = await this.fetchWithTimeout(`${API_BASE}/alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: this.getHeaders()
      });
      if (res.ok) return await res.json();
    } catch {}

    const a = this.localAlerts.find(alt => alt.id === alertId);
    if (a) {
      a.status = 'resolved';
      a.resolved_at = new Date().toISOString();
      localStorage.setItem('mobiletwin_alerts_v1', JSON.stringify(this.localAlerts));
      return { alert: a };
    }
    throw new Error('Alert not found');
  }

  // --- Simulation & Scenarios ---
  async setScenario(scenario: 'normal' | 'warning' | 'critical'): Promise<{ message: string; current_scenario: string }> {
    this.currentScenario = scenario;
    try {
      const res = await this.fetchWithTimeout(`${API_BASE}/analytics/scenario`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ scenario })
      });
      if (res.ok) return await res.json();
    } catch {}

    // In local simulation mode, generate appropriate alerts
    if (scenario === 'critical') {
      const exists = this.localAlerts.find(a => a.status === 'active' && a.sensor_code === 'VIB-DECK-01');
      if (!exists) {
        this.localAlerts.unshift({
          id: Date.now(),
          sensor_id: 1,
          sensor_code: 'VIB-DECK-01',
          sensor_name: 'Deck Mid-Span Vertical Vibration',
          sensor_type: 'vibration',
          alert_level: 'critical',
          title: 'CRITICAL: Deck Vertical Vibration Exceeded Safe Limit',
          message: 'Vibration 0.089 m/s² exceeded critical design threshold (0.080 m/s²) during hydrometric surge.',
          value: 0.0892,
          threshold_triggered: 0.080,
          unit: 'm/s^2',
          status: 'active',
          created_at: new Date().toISOString()
        });
        localStorage.setItem('mobiletwin_alerts_v1', JSON.stringify(this.localAlerts));
      }
    } else if (scenario === 'warning') {
      const exists = this.localAlerts.find(a => a.status === 'active' && a.sensor_code === 'STR-CBL-01');
      if (!exists) {
        this.localAlerts.unshift({
          id: Date.now(),
          sensor_id: 3,
          sensor_code: 'STR-CBL-01',
          sensor_name: 'Stay Cable D6 Mid-Span Strain',
          sensor_type: 'strain',
          alert_level: 'warning',
          title: 'WARNING: Elevated Stay Cable Tensile Strain',
          message: 'Strain 495.2 ue exceeded warning threshold (480.0 ue). Inspect anchorage.',
          value: 495.2,
          threshold_triggered: 480.0,
          unit: 'ue',
          status: 'active',
          created_at: new Date().toISOString()
        });
        localStorage.setItem('mobiletwin_alerts_v1', JSON.stringify(this.localAlerts));
      }
    }

    return { message: `Scenario switched to ${scenario.toUpperCase()}`, current_scenario: scenario };
  }

  async getSimulatorStatus(): Promise<{ is_running: boolean; scenario: string; current_step: number; interval_sec: number }> {
    try {
      const res = await this.fetchWithTimeout(`${API_BASE}/analytics/simulator-status`, { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch {}

    return {
      is_running: true,
      scenario: this.currentScenario,
      current_step: 42,
      interval_sec: 2.0
    };
  }

  // --- Digital Twin 3D ---
  async getTwinStructure(): Promise<any> {
    try {
      const res = await this.fetchWithTimeout(`${API_BASE}/twin/structure`, { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch {}

    return {
      bridge_id: 1,
      name: 'Saline River Cable-Stayed Bridge',
      type: 'cable_stayed',
      sensor_markers: this.localSensors.map(s => ({
        sensor_id: s.id,
        sensor_code: s.sensor_code,
        name: s.name,
        type: s.type,
        unit: s.unit,
        position: [s.coordinates.x, s.coordinates.y, s.coordinates.z],
        physical_location: s.physical_location,
        is_simulated: s.is_simulated
      }))
    };
  }
}

export const api = new ApiService();

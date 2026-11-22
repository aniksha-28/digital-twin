export type SensorType = 'vibration' | 'strain' | 'temperature' | 'humidity' | 'tilt';
export type QualityFlag = 'GOOD' | 'WARNING' | 'CRITICAL' | 'SUSPECT' | 'UNKNOWN';
export type HealthStatus = 'healthy' | 'warning' | 'critical';
export type ScenarioType = 'normal' | 'warning' | 'critical';
export type UserRole = 'admin' | 'engineer';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface SensorThresholds {
  min: number;
  max: number;
  warning_min: number;
  warning_max: number;
  critical_min: number;
  critical_max: number;
}

export interface Sensor {
  id: number;
  sensor_code: string;
  name: string;
  type: SensorType;
  unit: string;
  coordinates: { x: number; y: number; z: number };
  physical_location: string;
  thresholds: SensorThresholds;
  is_active: boolean;
  is_simulated: boolean;
  source_channel: string;
  infrastructure_id: number;
  current_value: number | null;
  current_quality: QualityFlag;
  last_reading_time: string | null;
}

export interface SensorReading {
  id: number;
  sensor_id: number;
  sensor_code?: string;
  timestamp: string;
  value: number;
  raw_value?: number;
  is_simulated: boolean;
  quality_flag: QualityFlag;
}

export interface ComponentHealth {
  score: number;
  status: HealthStatus;
  weight: number;
  sensor_count?: number;
  explanation?: string;
}

export interface HealthResult {
  overall_score: number;
  status: HealthStatus;
  components: {
    vibration: ComponentHealth;
    strain: ComponentHealth;
    tilt: ComponentHealth;
    temperature: ComponentHealth;
    humidity: ComponentHealth;
  };
  deduction_summary: string[];
  disclaimer: string;
}

export interface AlertAcknowledgement {
  id: number;
  alert_id: number;
  user_id: number;
  user_name?: string;
  notes?: string;
  acknowledged_at: string;
}

export interface Alert {
  id: number;
  sensor_id: number;
  sensor_code?: string;
  sensor_name?: string;
  sensor_type?: SensorType;
  alert_level: 'warning' | 'critical';
  title: string;
  message: string;
  value: number;
  threshold_triggered: number;
  unit: string;
  status: 'active' | 'acknowledged' | 'resolved';
  created_at: string;
  resolved_at?: string;
  acknowledgement?: AlertAcknowledgement;
}

export interface Infrastructure {
  id: number;
  name: string;
  type: string;
  location: string;
  length_m: number;
  spans: number;
  construction_year: number;
  description: string;
  health_score: number;
  status: HealthStatus;
  sensor_count: number;
  updated_at: string;
}

export interface LiveStreamPayload {
  timestamp: string;
  scenario: ScenarioType;
  health: HealthResult;
  sensors: Array<{
    id: number;
    sensor_code: string;
    name: string;
    type: SensorType;
    unit: string;
    value: number;
    quality_flag: QualityFlag;
    alert_level?: 'warning' | 'critical' | null;
    is_simulated: boolean;
    coordinates: { x: number; y: number; z: number };
    timestamp: string;
  }>;
  step: number;
}

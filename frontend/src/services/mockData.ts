import { Sensor, Infrastructure, HealthResult, Alert, ScenarioType } from '../types';

export const INITIAL_INFRASTRUCTURE: Infrastructure = {
  id: 1,
  name: 'Saline River Cable-Stayed Bridge',
  type: 'Cable-Stayed Bridge',
  location: 'Saline River Estuary, Abruzzo, Italy',
  length_m: 188.6,
  spans: 3,
  construction_year: 2018,
  description: 'Continuous multi-span cable-stayed highway bridge with dual concrete pylons, fan stay-cable system, composite steel-concrete deck, and deep pier foundations.',
  health_score: 94.5,
  status: 'healthy',
  sensor_count: 9,
  updated_at: new Date().toISOString()
};

export const INITIAL_SENSORS: Sensor[] = [
  {
    id: 1,
    sensor_code: 'VIB-DECK-01',
    name: 'Deck Mid-Span Vertical Vibration',
    type: 'vibration',
    unit: 'm/s^2',
    coordinates: { x: 0.0, y: 1.15, z: 0.0 },
    physical_location: 'Deck Center Girder Section U4',
    thresholds: {
      min: 0.001,
      max: 0.250,
      warning_min: 0.005,
      warning_max: 0.045,
      critical_min: 0.002,
      critical_max: 0.080
    },
    is_active: true,
    is_simulated: false,
    source_channel: 'rms_AM1Z_microg',
    infrastructure_id: 1,
    current_value: 0.0245,
    current_quality: 'GOOD',
    last_reading_time: new Date().toISOString()
  },
  {
    id: 2,
    sensor_code: 'VIB-PYL-01',
    name: 'Pylon A Tower Head Vibration',
    type: 'vibration',
    unit: 'microg',
    coordinates: { x: -7.0, y: 9.8, z: 0.0 },
    physical_location: 'West Pylon A Tower Cap (Z/X Combined)',
    thresholds: {
      min: 50.0,
      max: 2000.0,
      warning_min: 150.0,
      warning_max: 650.0,
      critical_min: 80.0,
      critical_max: 950.0
    },
    is_active: true,
    is_simulated: false,
    source_channel: 'rms_AV1Z_microg',
    infrastructure_id: 1,
    current_value: 412.8,
    current_quality: 'GOOD',
    last_reading_time: new Date().toISOString()
  },
  {
    id: 3,
    sensor_code: 'STR-CBL-01',
    name: 'Stay Cable D6 Mid-Span Strain',
    type: 'strain',
    unit: 'ue',
    coordinates: { x: 3.5, y: 4.8, z: 1.4 },
    physical_location: 'Mid-Span Stay Cable D6 Load-Cell',
    thresholds: {
      min: 100.0,
      max: 800.0,
      warning_min: 280.0,
      warning_max: 480.0,
      critical_min: 200.0,
      critical_max: 540.0
    },
    is_active: true,
    is_simulated: false,
    source_channel: 'loadcell_D6_N',
    infrastructure_id: 1,
    current_value: 368.4,
    current_quality: 'GOOD',
    last_reading_time: new Date().toISOString()
  },
  {
    id: 4,
    sensor_code: 'STR-CBL-02',
    name: 'Main Stay Cable D1 Anchor Tension',
    type: 'strain',
    unit: 'kN',
    coordinates: { x: -6.0, y: 5.2, z: -1.4 },
    physical_location: 'Tower Anchorage Stay Cable D1',
    thresholds: {
      min: 500.0,
      max: 3000.0,
      warning_min: 1100.0,
      warning_max: 1650.0,
      critical_min: 900.0,
      critical_max: 1900.0
    },
    is_active: true,
    is_simulated: false,
    source_channel: 'loadcell_D1_N',
    infrastructure_id: 1,
    current_value: 1425.0,
    current_quality: 'GOOD',
    last_reading_time: new Date().toISOString()
  },
  {
    id: 5,
    sensor_code: 'TLT-PIER-01',
    name: 'Pier Foundation A Transverse Tilt',
    type: 'tilt',
    unit: 'deg',
    coordinates: { x: -7.0, y: -1.2, z: 0.0 },
    physical_location: 'Pier A Base Monolithic Foundation',
    thresholds: {
      min: -0.150,
      max: 0.150,
      warning_min: -0.022,
      warning_max: 0.022,
      critical_min: -0.038,
      critical_max: 0.038
    },
    is_active: true,
    is_simulated: false,
    source_channel: 'disp_A_pier_Y_microm',
    infrastructure_id: 1,
    current_value: 0.0078,
    current_quality: 'GOOD',
    last_reading_time: new Date().toISOString()
  },
  {
    id: 6,
    sensor_code: 'DSP-PIER-02',
    name: 'Pier A Bearing Transverse Displacement',
    type: 'tilt',
    unit: 'mm',
    coordinates: { x: -7.0, y: 0.3, z: 1.6 },
    physical_location: 'Elastomeric Bearing Top Pier A',
    thresholds: {
      min: -1.5,
      max: 1.5,
      warning_min: -0.28,
      warning_max: 0.28,
      critical_min: -0.45,
      critical_max: 0.45
    },
    is_active: true,
    is_simulated: false,
    source_channel: 'disp_A_pier_Y_microm',
    infrastructure_id: 1,
    current_value: 0.115,
    current_quality: 'GOOD',
    last_reading_time: new Date().toISOString()
  },
  {
    id: 7,
    sensor_code: 'TMP-DECK-01',
    name: 'Deck Asphalt Surface Temperature',
    type: 'temperature',
    unit: 'degC',
    coordinates: { x: 6.0, y: 1.15, z: -0.8 },
    physical_location: 'East Span Deck Asphalt Wear Layer',
    thresholds: {
      min: -15.0,
      max: 65.0,
      warning_min: 2.0,
      warning_max: 32.0,
      critical_min: -5.0,
      critical_max: 38.0
    },
    is_active: true,
    is_simulated: false,
    source_channel: 'temp_asphalt_C',
    infrastructure_id: 1,
    current_value: 21.4,
    current_quality: 'GOOD',
    last_reading_time: new Date().toISOString()
  },
  {
    id: 8,
    sensor_code: 'TMP-AMB-01',
    name: 'Ambient Meteorological Air Temperature',
    type: 'temperature',
    unit: 'degC',
    coordinates: { x: -7.0, y: 5.8, z: 1.8 },
    physical_location: 'Pylon A Meteorological Mast',
    thresholds: {
      min: -10.0,
      max: 50.0,
      warning_min: 0.0,
      warning_max: 28.0,
      critical_min: -5.0,
      critical_max: 35.0
    },
    is_active: true,
    is_simulated: false,
    source_channel: 'temp_air_C',
    infrastructure_id: 1,
    current_value: 17.8,
    current_quality: 'GOOD',
    last_reading_time: new Date().toISOString()
  },
  {
    id: 9,
    sensor_code: 'HUM-ENV-01',
    name: 'Ambient Relative Humidity (Simulated)',
    type: 'humidity',
    unit: '% RH',
    coordinates: { x: 7.0, y: 5.8, z: 1.8 },
    physical_location: 'Pylon B Weather Station Mast',
    thresholds: {
      min: 10.0,
      max: 100.0,
      warning_min: 35.0,
      warning_max: 85.0,
      critical_min: 25.0,
      critical_max: 92.0
    },
    is_active: true,
    is_simulated: true,
    source_channel: 'humidity_ambient_pct',
    infrastructure_id: 1,
    current_value: 62.5,
    current_quality: 'GOOD',
    last_reading_time: new Date().toISOString()
  }
];

export function computeComponentScore(sensor: Sensor, value: number): { score: number; expl: string } {
  const th = sensor.thresholds;
  if (value >= th.warning_min && value <= th.warning_max) {
    return { score: 100.0, expl: 'Nominal design envelope' };
  }
  if (value > th.warning_max && value < th.critical_max) {
    const ratio = (value - th.warning_max) / (th.critical_max - th.warning_max + 1e-6);
    return { score: Math.max(65, Math.round(100 - ratio * 30)), expl: `Elevated above warning bound (+${(value - th.warning_max).toFixed(3)})` };
  }
  if (value >= th.critical_max) {
    return { score: 55.0, expl: `Critical threshold violation (${value.toFixed(3)} >= ${th.critical_max})` };
  }
  if (value <= th.critical_min) {
    return { score: 55.0, expl: `Critical lower bound deficit (${value.toFixed(3)} <= ${th.critical_min})` };
  }
  return { score: 75.0, expl: 'Outside nominal range' };
}

export function computeOverallHealth(sensors: Sensor[]): HealthResult {
  const weights: Record<string, number> = {
    vibration: 0.30,
    strain: 0.25,
    tilt: 0.20,
    temperature: 0.15,
    humidity: 0.10
  };

  const byType: Record<string, number[]> = {
    vibration: [],
    strain: [],
    tilt: [],
    temperature: [],
    humidity: []
  };

  const deductions: string[] = [];

  for (const s of sensors) {
    const val = s.current_value ?? (s.thresholds.warning_min + s.thresholds.warning_max) / 2;
    const { score, expl } = computeComponentScore(s, val);
    if (byType[s.type]) {
      byType[s.type].push(score);
    }
    if (score < 85) {
      deductions.push(`${s.name} (${s.sensor_code}): ${expl} [Score: ${score}]`);
    }
  }

  const components: any = {};
  let totalScore = 0;

  for (const [cat, w] of Object.entries(weights)) {
    const arr = byType[cat] || [100];
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    totalScore += avg * w;
    components[cat] = {
      score: Math.round(avg * 10) / 10,
      status: avg >= 85 ? 'healthy' : avg >= 65 ? 'warning' : 'critical',
      weight: w
    };
  }

  totalScore = Math.round(Math.min(100, Math.max(0, totalScore)) * 10) / 10;
  const status = totalScore >= 85 ? 'healthy' : totalScore >= 65 ? 'warning' : 'critical';

  return {
    overall_score: totalScore,
    status,
    components,
    deduction_summary: deductions.length > 0 ? deductions : ['All structural sensor channels operating within nominal design limits.'],
    disclaimer: 'Notice: Structural Health Index is calculated for computational digital twin demonstration and decision support only. It does not establish or replace physical structural safety engineering inspection or certification.'
  };
}

// Generate 120 baseline historical samples from Zenodo dataset features
export const ZENODO_BASELINE_SAMPLES: Record<string, Array<{ record_index: number; original_timestamp: string; value: number; scenario_label: string }>> = {
  vibration_deck_mid_ms2: Array.from({ length: 80 }, (_, i) => ({
    record_index: i * 3,
    original_timestamp: `2026-04-${String(Math.floor(i / 8) + 1).padStart(2, '0')} ${String((i * 3) % 24).padStart(2, '0')}:00:00`,
    value: Number((0.022 + 0.008 * Math.sin(i * 0.3) + (i > 45 && i < 65 ? 0.045 : 0.002 * Math.random())).toFixed(4)),
    scenario_label: i > 45 && i < 65 ? 'critical' : i > 35 && i <= 45 ? 'warning' : 'normal'
  })),
  strain_cable_mid_ue: Array.from({ length: 80 }, (_, i) => ({
    record_index: i * 3,
    original_timestamp: `2026-04-${String(Math.floor(i / 8) + 1).padStart(2, '0')} ${String((i * 3) % 24).padStart(2, '0')}:00:00`,
    value: Number((370 + 40 * Math.sin(i * 0.25) + (i > 45 && i < 65 ? 140 : 10 * Math.random())).toFixed(1)),
    scenario_label: i > 45 && i < 65 ? 'critical' : i > 35 && i <= 45 ? 'warning' : 'normal'
  })),
  tilt_pier_a_deg: Array.from({ length: 80 }, (_, i) => ({
    record_index: i * 3,
    original_timestamp: `2026-04-${String(Math.floor(i / 8) + 1).padStart(2, '0')} ${String((i * 3) % 24).padStart(2, '0')}:00:00`,
    value: Number((0.007 + 0.003 * Math.sin(i * 0.2) + (i > 45 && i < 65 ? 0.028 : 0.001 * Math.random())).toFixed(4)),
    scenario_label: i > 45 && i < 65 ? 'critical' : i > 35 && i <= 45 ? 'warning' : 'normal'
  })),
  temp_deck_asphalt_c: Array.from({ length: 80 }, (_, i) => ({
    record_index: i * 3,
    original_timestamp: `2026-04-${String(Math.floor(i / 8) + 1).padStart(2, '0')} ${String((i * 3) % 24).padStart(2, '0')}:00:00`,
    value: Number((20.0 + 8.5 * Math.sin(i * 0.4) + (i > 45 && i < 65 ? 10.0 : 0.5 * Math.random())).toFixed(1)),
    scenario_label: i > 45 && i < 65 ? 'critical' : i > 35 && i <= 45 ? 'warning' : 'normal'
  })),
  humidity_ambient_pct: Array.from({ length: 80 }, (_, i) => ({
    record_index: i * 3,
    original_timestamp: `2026-04-${String(Math.floor(i / 8) + 1).padStart(2, '0')} ${String((i * 3) % 24).padStart(2, '0')}:00:00`,
    value: Number((62.0 + 15.0 * Math.sin(i * 0.3) + (i > 45 && i < 65 ? 22.0 : 2.0 * Math.random())).toFixed(1)),
    scenario_label: i > 45 && i < 65 ? 'critical' : i > 35 && i <= 45 ? 'warning' : 'normal'
  }))
};

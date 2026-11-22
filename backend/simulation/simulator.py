"""
MobileTwin IoT Sensor Simulation Engine
Streams dynamic sensor readings at configurable intervals (default 2s),
integrates historical empirical dataset replay, generates active alerts,
updates SQLite database, and emits live WebSocket packets to digital twin clients.
"""

import os
import time
import math
import random
import threading
import pandas as pd
from datetime import datetime

from models import db, Sensor, SensorReading, Infrastructure, Alert
from simulation.anomaly_detector import AnomalyDetector
from simulation.health_calculator import HealthCalculator

PROCESSED_CSV = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "processed", "shm_cleaned_features.csv")

class SensorSimulator:
    def __init__(self, app, socketio, interval_sec=2.0):
        self.app = app
        self.socketio = socketio
        self.interval = interval_sec
        self.is_running = False
        self.thread = None
        self.scenario = 'normal'  # 'normal', 'warning', 'critical'
        self.current_step = 0
        self.df_historical = None
        self.anomaly_detector = None
        self.load_dataset()

    def load_dataset(self):
        """Load preprocessed historical dataset."""
        if os.path.exists(PROCESSED_CSV):
            try:
                self.df_historical = pd.read_csv(PROCESSED_CSV)
                print(f"[Simulator] Loaded {len(self.df_historical)} historical records for replay.")
                self.anomaly_detector = AnomalyDetector(PROCESSED_CSV)
            except Exception as e:
                print(f"[Simulator] Error loading historical dataset: {e}")
                self.df_historical = None
        else:
            print("[Simulator] Warning: Processed historical CSV not found. Reverting to mathematical models.")

    def set_scenario(self, scenario_name):
        """Switch simulation scenario: 'normal', 'warning', 'critical'."""
        if scenario_name in ['normal', 'warning', 'critical']:
            self.scenario = scenario_name
            print(f"[Simulator] Operational Scenario set to: {self.scenario.upper()}")
            return True
        return False

    def start(self):
        """Start the background simulation thread."""
        if not self.is_running:
            self.is_running = True
            self.thread = threading.Thread(target=self._run_loop, daemon=True)
            self.thread.start()
            print("[Simulator] Background simulation loop started.")

    def stop(self):
        """Stop the background simulation loop."""
        self.is_running = False
        if self.thread:
            self.thread.join(timeout=3.0)
            print("[Simulator] Simulation loop stopped.")

    def _get_sensor_value(self, sensor, step):
        """
        Produce a realistic sensor value based on scenario and historical record replay.
        """
        base_val = 0.0

        # Scenario Multipliers and Offsets
        if self.scenario == 'normal':
            mult = 1.0
            shift = 0.0
        elif self.scenario == 'warning':
            mult = 1.6
            shift = 0.25
        else:  # critical
            mult = 2.4
            shift = 0.65

        # Replay from historical dataframe if mapped
        if self.df_historical is not None and len(self.df_historical) > 0:
            rec_idx = (step * 3) % len(self.df_historical)
            row = self.df_historical.iloc[rec_idx]

            if sensor.sensor_code == 'VIB-DECK-01':
                raw = float(row.get('vibration_deck_mid_ms2', 0.025))
                # Add micro-traffic vibration oscillation
                osc = 0.005 * math.sin(step * 0.4) + random.uniform(-0.002, 0.002)
                base_val = raw * mult + (0.045 if self.scenario == 'critical' else (0.020 if self.scenario == 'warning' else 0.0)) + osc
            elif sensor.sensor_code == 'VIB-PYL-01':
                raw = float(row.get('vibration_pylon_rms_microg', 450.0))
                base_val = raw * mult + random.uniform(-20, 20)
            elif sensor.sensor_code == 'STR-CBL-01':
                raw = float(row.get('strain_cable_mid_ue', 380.0))
                base_val = raw * (1.0 + shift * 0.45) + random.uniform(-5.0, 5.0)
            elif sensor.sensor_code == 'STR-CBL-02':
                raw = float(row.get('cable_tension_d1_kn', 1450.0))
                base_val = raw * (1.0 + shift * 0.4) + random.uniform(-10.0, 10.0)
            elif sensor.sensor_code == 'TLT-PIER-01':
                raw = float(row.get('tilt_pier_a_deg', 0.008))
                base_val = raw * mult + (0.035 if self.scenario == 'critical' else (0.015 if self.scenario == 'warning' else 0.0)) + random.uniform(-0.001, 0.001)
            elif sensor.sensor_code == 'DSP-PIER-02':
                raw = float(row.get('pier_a_disp_y_mm', 0.12))
                base_val = raw * mult + random.uniform(-0.02, 0.02)
            elif sensor.sensor_code == 'TMP-DECK-01':
                raw = float(row.get('temp_deck_asphalt_c', 21.5))
                base_val = raw + (12.0 if self.scenario == 'critical' else (6.0 if self.scenario == 'warning' else 0.0)) + math.sin(step * 0.05)
            elif sensor.sensor_code == 'TMP-AMB-01':
                raw = float(row.get('temp_air_c', 17.5))
                base_val = raw + (8.0 if self.scenario == 'critical' else (4.0 if self.scenario == 'warning' else 0.0))
            elif sensor.sensor_code == 'HUM-ENV-01':
                raw = float(row.get('humidity_ambient_pct', 62.0))
                base_val = min(98.5, raw + (28.0 if self.scenario == 'critical' else (16.0 if self.scenario == 'warning' else 0.0)) + random.uniform(-1.5, 1.5))
            else:
                base_val = (sensor.warning_min + sensor.warning_max) / 2.0
        else:
            # Synthetic procedural fallback
            mid = (sensor.warning_min + sensor.warning_max) / 2.0
            span = (sensor.warning_max - sensor.warning_min) / 2.0
            base_val = mid + span * 0.3 * math.sin(step * 0.2) + span * shift

        return round(float(base_val), 4)

    def _run_loop(self):
        """Continuous execution loop."""
        print("[Simulator] Simulation loop entering polling cycle.")
        while self.is_running:
            try:
                with self.app.app_context():
                    self._tick()
            except Exception as e:
                print(f"[Simulator] Error in simulation tick: {e}")
            time.sleep(self.interval)

    def _tick(self):
        """Execute one simulation cycle."""
        self.current_step += 1
        now = datetime.utcnow()

        sensors = Sensor.query.filter_by(is_active=True).all()
        if not sensors:
            return

        readings_snapshot = {}
        sensor_updates = []
        sensors_dict = {}

        for sensor in sensors:
            val = self._get_sensor_value(sensor, self.current_step)
            sensors_dict[sensor] = val
            readings_snapshot[sensor.sensor_code] = val

            # Anomaly & Threshold Evaluation
            quality_flag, alert_level, expl = self.anomaly_detector.evaluate_threshold(sensor, val) if self.anomaly_detector else ('GOOD', None, 'Nominal')

            # Create SensorReading record
            reading = SensorReading(
                sensor_id=sensor.id,
                timestamp=now,
                value=val,
                raw_value=val,
                is_simulated=sensor.is_simulated or (self.scenario != 'normal'),
                quality_flag=quality_flag
            )
            db.session.add(reading)

            # Manage Alerts
            if alert_level:
                # Check if an unresolved active alert already exists for this sensor
                existing_alert = Alert.query.filter_by(
                    sensor_id=sensor.id,
                    status='active'
                ).first()

                if not existing_alert:
                    new_alert = Alert(
                        sensor_id=sensor.id,
                        alert_level=alert_level,
                        title=f"{alert_level.upper()}: {sensor.name} Threshold Exceeded",
                        message=expl,
                        value=val,
                        threshold_triggered=sensor.critical_max if alert_level == 'critical' else sensor.warning_max,
                        status='active',
                        created_at=now
                    )
                    db.session.add(new_alert)

            sensor_updates.append({
                'id': sensor.id,
                'sensor_code': sensor.sensor_code,
                'name': sensor.name,
                'type': sensor.type,
                'unit': sensor.unit,
                'value': val,
                'quality_flag': quality_flag,
                'alert_level': alert_level,
                'is_simulated': sensor.is_simulated,
                'coordinates': {'x': sensor.x_pos, 'y': sensor.y_pos, 'z': sensor.z_pos},
                'timestamp': now.isoformat()
            })

        # Calculate Overall Bridge Health
        health_result = HealthCalculator.calculate_overall_health(sensors_dict)

        # Update Infrastructure status in DB
        infra = Infrastructure.query.first()
        if infra:
            infra.health_score = health_result['overall_score']
            infra.status = health_result['status']
            infra.updated_at = now

        db.session.commit()

        # Emit Real-Time WebSocket broadcast
        payload = {
            'timestamp': now.isoformat(),
            'scenario': self.scenario,
            'health': health_result,
            'sensors': sensor_updates,
            'step': self.current_step
        }
        self.socketio.emit('sensor_stream', payload)

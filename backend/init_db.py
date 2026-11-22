"""
MobileTwin Database Seeder and Schema Initializer
Creates tables, default users, infrastructure entity, sensor specifications,
and populates baseline historical readings from the Zenodo SHM dataset.
"""

import os
import pandas as pd
from datetime import datetime, timedelta
from flask import Flask

from config import Config
from models import db, User, Infrastructure, Sensor, SensorReading, HistoricalDataset, Alert

def initialize_database():
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)

    with app.app_context():
        print(f"Creating database tables in {Config.SQLALCHEMY_DATABASE_URI}...")
        db.drop_all()
        db.create_all()

        # 1. Seed Users
        admin_user = User(
            username='admin',
            email='admin@infrastructure.gov',
            full_name='Dr. Elena Rossi (Chief Bridge Engineer)',
            role='admin'
        )
        admin_user.set_password('admin123')

        engineer_user = User(
            username='engineer',
            email='engineer@monitoring.org',
            full_name='Marco Bianchi (Field Monitoring Specialist)',
            role='engineer'
        )
        engineer_user.set_password('engineer123')

        db.session.add_all([admin_user, engineer_user])
        db.session.commit()
        print("Default users created: 'admin' (pass: admin123) and 'engineer' (pass: engineer123)")

        # 2. Seed Infrastructure Entity
        bridge = Infrastructure(
            name='Saline River Cable-Stayed Bridge',
            type='Cable-Stayed Bridge',
            location='Saline River Estuary, Abruzzo, Italy',
            length_m=188.6,
            spans=3,
            construction_year=2018,
            description='Continuous multi-span cable-stayed highway bridge with dual concrete pylons, fan stay-cable system, composite steel-concrete deck, and deep pier foundations.',
            health_score=94.5,
            status='healthy'
        )
        db.session.add(bridge)
        db.session.commit()
        print(f"Infrastructure seeded: {bridge.name}")

        # 3. Seed Sensors (Mapped to 3D Digital Twin Coordinates & Zenodo Channels)
        sensors_data = [
            {
                'sensor_code': 'VIB-DECK-01',
                'name': 'Deck Mid-Span Vertical Vibration',
                'type': 'vibration',
                'unit': 'm/s^2',
                'x_pos': 0.0, 'y_pos': 1.15, 'z_pos': 0.0,
                'physical_location': 'Deck Center Girder Section U4',
                'min_threshold': 0.001, 'max_threshold': 0.250,
                'warning_min': 0.005, 'warning_max': 0.045,
                'critical_min': 0.002, 'critical_max': 0.080,
                'is_simulated': False,
                'source_channel': 'rms_AM1Z_microg'
            },
            {
                'sensor_code': 'VIB-PYL-01',
                'name': 'Pylon A Tower Head Vibration',
                'type': 'vibration',
                'unit': 'microg',
                'x_pos': -7.0, 'y_pos': 9.8, 'z_pos': 0.0,
                'physical_location': 'West Pylon A Tower Cap (Z/X Combined)',
                'min_threshold': 50.0, 'max_threshold': 2000.0,
                'warning_min': 150.0, 'warning_max': 650.0,
                'critical_min': 80.0, 'critical_max': 950.0,
                'is_simulated': False,
                'source_channel': 'rms_AV1Z_microg'
            },
            {
                'sensor_code': 'STR-CBL-01',
                'name': 'Stay Cable D6 Mid-Span Strain',
                'type': 'strain',
                'unit': 'ue',
                'x_pos': 3.5, 'y_pos': 4.8, 'z_pos': 1.4,
                'physical_location': 'Mid-Span Stay Cable D6 Load-Cell',
                'min_threshold': 100.0, 'max_threshold': 800.0,
                'warning_min': 280.0, 'warning_max': 480.0,
                'critical_min': 200.0, 'critical_max': 540.0,
                'is_simulated': False,
                'source_channel': 'loadcell_D6_N'
            },
            {
                'sensor_code': 'STR-CBL-02',
                'name': 'Main Stay Cable D1 Anchor Tension',
                'type': 'strain',
                'unit': 'kN',
                'x_pos': -6.0, 'y_pos': 5.2, 'z_pos': -1.4,
                'physical_location': 'Tower Anchorage Stay Cable D1',
                'min_threshold': 500.0, 'max_threshold': 3000.0,
                'warning_min': 1100.0, 'warning_max': 1650.0,
                'critical_min': 900.0, 'critical_max': 1900.0,
                'is_simulated': False,
                'source_channel': 'loadcell_D1_N'
            },
            {
                'sensor_code': 'TLT-PIER-01',
                'name': 'Pier Foundation A Transverse Tilt',
                'type': 'tilt',
                'unit': 'deg',
                'x_pos': -7.0, 'y_pos': -1.2, 'z_pos': 0.0,
                'physical_location': 'Pier A Base Monolithic Foundation',
                'min_threshold': -0.150, 'max_threshold': 0.150,
                'warning_min': -0.022, 'warning_max': 0.022,
                'critical_min': -0.038, 'critical_max': 0.038,
                'is_simulated': False,
                'source_channel': 'disp_A_pier_Y_microm'
            },
            {
                'sensor_code': 'DSP-PIER-02',
                'name': 'Pier A Bearing Transverse Displacement',
                'type': 'tilt',
                'unit': 'mm',
                'x_pos': -7.0, 'y_pos': 0.3, 'z_pos': 1.6,
                'physical_location': 'Elastomeric Bearing Top Pier A',
                'min_threshold': -1.5, 'max_threshold': 1.5,
                'warning_min': -0.28, 'warning_max': 0.28,
                'critical_min': -0.45, 'critical_max': 0.45,
                'is_simulated': False,
                'source_channel': 'disp_A_pier_Y_microm'
            },
            {
                'sensor_code': 'TMP-DECK-01',
                'name': 'Deck Asphalt Surface Temperature',
                'type': 'temperature',
                'unit': 'degC',
                'x_pos': 6.0, 'y_pos': 1.15, 'z_pos': -0.8,
                'physical_location': 'East Span Deck Asphalt Wear Layer',
                'min_threshold': -15.0, 'max_threshold': 65.0,
                'warning_min': 2.0, 'warning_max': 32.0,
                'critical_min': -5.0, 'critical_max': 38.0,
                'is_simulated': False,
                'source_channel': 'temp_asphalt_C'
            },
            {
                'sensor_code': 'TMP-AMB-01',
                'name': 'Ambient Meteorological Air Temperature',
                'type': 'temperature',
                'unit': 'degC',
                'x_pos': -7.0, 'y_pos': 5.8, 'z_pos': 1.8,
                'physical_location': 'Pylon A Meteorological Mast',
                'min_threshold': -10.0, 'max_threshold': 50.0,
                'warning_min': 0.0, 'warning_max': 28.0,
                'critical_min': -5.0, 'critical_max': 35.0,
                'is_simulated': False,
                'source_channel': 'temp_air_C'
            },
            {
                'sensor_code': 'HUM-ENV-01',
                'name': 'Ambient Relative Humidity (Simulated)',
                'type': 'humidity',
                'unit': '% RH',
                'x_pos': 7.0, 'y_pos': 5.8, 'z_pos': 1.8,
                'physical_location': 'Pylon B Weather Station Mast',
                'min_threshold': 10.0, 'max_threshold': 100.0,
                'warning_min': 35.0, 'warning_max': 85.0,
                'critical_min': 25.0, 'critical_max': 92.0,
                'is_simulated': True,
                'source_channel': 'humidity_ambient_pct'
            }
        ]

        sensor_objs = {}
        for s_data in sensors_data:
            sensor = Sensor(
                sensor_code=s_data['sensor_code'],
                name=s_data['name'],
                type=s_data['type'],
                unit=s_data['unit'],
                x_pos=s_data['x_pos'],
                y_pos=s_data['y_pos'],
                z_pos=s_data['z_pos'],
                physical_location=s_data['physical_location'],
                min_threshold=s_data['min_threshold'],
                max_threshold=s_data['max_threshold'],
                warning_min=s_data['warning_min'],
                warning_max=s_data['warning_max'],
                critical_min=s_data['critical_min'],
                critical_max=s_data['critical_max'],
                is_simulated=s_data['is_simulated'],
                source_channel=s_data['source_channel'],
                infrastructure_id=bridge.id
            )
            db.session.add(sensor)
            sensor_objs[s_data['sensor_code']] = sensor

        db.session.commit()
        print(f"Seeded {len(sensors_data)} structural sensors.")

        # 4. Populate Historical Baseline Dataset Records from Cleaned CSV
        csv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "processed", "shm_cleaned_features.csv")
        if os.path.exists(csv_path):
            print(f"Loading empirical baseline records from {csv_path}...")
            df = pd.read_csv(csv_path)
            hist_records = []
            
            # Map key features
            feature_sensor_map = [
                ('vibration_deck_mid_ms2', 'm/s^2', True),
                ('vibration_pylon_rms_microg', 'microg', True),
                ('strain_cable_mid_ue', 'ue', True),
                ('cable_tension_d1_kn', 'kN', True),
                ('tilt_pier_a_deg', 'deg', True),
                ('temp_deck_asphalt_c', 'degC', True),
                ('humidity_ambient_pct', '% RH', False)
            ]

            # Sample every 3rd row for 200 high-resolution historical steps
            df_sample = df.iloc[::3].head(200)

            for idx, row in df_sample.iterrows():
                for feat_name, unit, is_real in feature_sensor_map:
                    if feat_name in row and pd.notnull(row[feat_name]):
                        hist = HistoricalDataset(
                            record_index=int(idx),
                            original_timestamp=str(row['timestamp']),
                            feature_name=feat_name,
                            value=float(row[feat_name]),
                            unit=unit,
                            is_real=is_real,
                            scenario_label=str(row.get('scenario', 'normal'))
                        )
                        hist_records.append(hist)

            db.session.bulk_save_objects(hist_records)
            db.session.commit()
            print(f"Seeded {len(hist_records)} empirical historical records.")

            # 5. Populate initial recent readings so charts show smooth 30-point initial history
            initial_readings = []
            now = datetime.utcnow()
            for i in range(30):
                t = now - timedelta(seconds=(30 - i) * 2)
                row = df.iloc[i % len(df)]
                for code, sensor in sensor_objs.items():
                    val = 0.0
                    if code == 'VIB-DECK-01': val = float(row.get('vibration_deck_mid_ms2', 0.022))
                    elif code == 'VIB-PYL-01': val = float(row.get('vibration_pylon_rms_microg', 420.0))
                    elif code == 'STR-CBL-01': val = float(row.get('strain_cable_mid_ue', 375.0))
                    elif code == 'STR-CBL-02': val = float(row.get('cable_tension_d1_kn', 1420.0))
                    elif code == 'TLT-PIER-01': val = float(row.get('tilt_pier_a_deg', 0.007))
                    elif code == 'DSP-PIER-02': val = float(row.get('pier_a_disp_y_mm', 0.11))
                    elif code == 'TMP-DECK-01': val = float(row.get('temp_deck_asphalt_c', 21.0))
                    elif code == 'TMP-AMB-01': val = float(row.get('temp_air_c', 17.0))
                    elif code == 'HUM-ENV-01': val = float(row.get('humidity_ambient_pct', 62.0))

                    rd = SensorReading(
                        sensor_id=sensor.id,
                        timestamp=t,
                        value=round(val, 4),
                        raw_value=round(val, 4),
                        is_simulated=sensor.is_simulated,
                        quality_flag='GOOD'
                    )
                    initial_readings.append(rd)

            db.session.bulk_save_objects(initial_readings)
            db.session.commit()
            print(f"Seeded {len(initial_readings)} recent telemetry readings.")

        print("Database initialization successfully completed!")

if __name__ == '__main__':
    initialize_database()

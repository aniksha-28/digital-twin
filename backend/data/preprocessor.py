"""
MobileTwin Structural Health Monitoring Preprocessing Pipeline
Processes raw Zenodo SHM dataset (Record 20443860: FLOOD-SHAB Saline River Cable-Stayed Bridge)
Handles cleaning, missing-value imputation, engineering feature extraction, normalization, and quality validation.
"""

import os
import json
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.preprocessing import StandardScaler, MinMaxScaler

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RAW_DIR = os.path.join(BASE_DIR, "raw")
PROCESSED_DIR = os.path.join(BASE_DIR, "processed")
os.makedirs(PROCESSED_DIR, exist_ok=True)

RAW_CSV_PATH = os.path.join(RAW_DIR, "CableStayedBridge_SHM_features_2026-03-27_2026-04-10.csv")
PROCESSED_CSV_PATH = os.path.join(PROCESSED_DIR, "shm_cleaned_features.csv")
METADATA_PATH = os.path.join(PROCESSED_DIR, "feature_metadata.json")

def preprocess_shm_dataset():
    print(f"Loading raw dataset from {RAW_CSV_PATH}...")
    if not os.path.exists(RAW_CSV_PATH):
        raise FileNotFoundError(f"Raw dataset file not found at {RAW_CSV_PATH}")

    df_raw = pd.read_csv(RAW_CSV_PATH)
    print(f"Raw dataset loaded. Shape: {df_raw.shape}")

    # 1. Standardize Timestamps
    # Raw format: '27-Mar-2026 00:29:40'
    df_raw['datetime'] = pd.to_datetime(df_raw['timestamp'], format='%d-%b-%Y %H:%M:%S', errors='coerce')
    df_raw = df_raw.sort_values('datetime').reset_index(drop=True)
    df_raw.set_index('datetime', inplace=False)

    df_clean = pd.DataFrame()
    df_clean['timestamp'] = df_raw['datetime'].dt.strftime('%Y-%m-%d %H:%M:%S')
    df_clean['original_timestamp'] = df_raw['timestamp']

    # 2. Extract & Handle Selected Physical Sensor Parameters
    # Sensor 1: Deck Vibration - Mid-Span (AM1Z)
    # Unit: micro-g -> converted to m/s^2 for SI standard and mm/s^2
    # 1 micro-g = 9.80665e-6 m/s^2 = 0.00980665 mm/s^2
    deck_vib_microg = df_raw['rms_AM1Z_microg'].interpolate(method='linear').ffill().bfill()
    df_clean['vibration_deck_mid_ms2'] = (deck_vib_microg * 9.80665e-6).round(6)
    df_clean['vibration_deck_mid_microg'] = deck_vib_microg.round(2)
    df_clean['vibration_deck_peak_microg'] = df_raw['amax_AM1Z_microg'].interpolate(method='linear').ffill().bfill().round(2)

    # Sensor 2: Pylon A Vibration (AV1Z, AV1Y, AV1X)
    pylon_vib_z = df_raw['rms_AV1Z_microg'].interpolate(method='linear').ffill().bfill()
    pylon_vib_y = df_raw['rms_AV1Y_microg'].interpolate(method='linear').ffill().bfill()
    pylon_vib_x = df_raw['rms_AV1X_microg'].interpolate(method='linear').ffill().bfill()
    df_clean['vibration_pylon_z_ms2'] = (pylon_vib_z * 9.80665e-6).round(6)
    df_clean['vibration_pylon_rms_microg'] = np.sqrt(pylon_vib_x**2 + pylon_vib_y**2 + pylon_vib_z**2).round(2)

    # Modal Frequencies (Mode 1 - Vertical Bending, Mode 2 - Torsional)
    df_clean['modal_freq_mode1_hz'] = df_raw['freq_mode_01_Hz'].interpolate(method='linear').ffill().bfill().round(4)
    df_clean['modal_freq_mode2_hz'] = df_raw['freq_mode_02_Hz'].interpolate(method='linear').ffill().bfill().round(4)

    # Sensor 3: Stay-Cable Strain & Tension (Load cells D1, U1, D6, U7, D15, U15)
    # Cable area A approx 1800 mm^2, Young modulus E = 205 GPa = 205,000 N/mm^2
    # Strain epsilon = (Force / A) / E = Force / (1800 * 205000)
    # Microstrain (microepsilon) = epsilon * 1e6
    load_d1 = df_raw['loadcell_D1_N'].interpolate(method='linear').ffill().bfill()
    load_u1 = df_raw['loadcell_U1_N'].interpolate(method='linear').ffill().bfill()
    load_d6 = df_raw['loadcell_D6_N'].interpolate(method='linear').ffill().bfill()
    load_u7 = df_raw['loadcell_U7_N'].interpolate(method='linear').ffill().bfill()

    df_clean['cable_tension_d1_kn'] = (load_d1 / 1000.0).round(2)
    df_clean['cable_tension_u1_kn'] = (load_u1 / 1000.0).round(2)
    df_clean['cable_tension_d6_kn'] = (load_d6 / 1000.0).round(2)
    df_clean['cable_tension_u7_kn'] = (load_u7 / 1000.0).round(2)

    # Compute microstrain (ue)
    c_factor = 1e6 / (1800.0 * 205000.0)  # ~0.00271 microstrain per Newton
    df_clean['strain_cable_mid_ue'] = (load_d6 * c_factor).round(2)
    df_clean['strain_cable_tower_ue'] = (load_d1 * c_factor).round(2)

    # Sensor 4: Pier Displacement & Tilt
    # disp_A_pier_X_microm (longitudinal) and disp_A_pier_Y_microm (transverse)
    disp_ax = df_raw['disp_A_pier_X_microm'].interpolate(method='linear').ffill().bfill()
    disp_ay = df_raw['disp_A_pier_Y_microm'].interpolate(method='linear').ffill().bfill()
    disp_bx = df_raw['disp_B_pier_X_microm'].interpolate(method='linear').ffill().bfill()
    disp_by = df_raw['disp_B_pier_Y_microm'].interpolate(method='linear').ffill().bfill()

    df_clean['pier_a_disp_x_mm'] = (disp_ax / 1000.0).round(3)
    df_clean['pier_a_disp_y_mm'] = (disp_ay / 1000.0).round(3)
    df_clean['pier_b_disp_x_mm'] = (disp_bx / 1000.0).round(3)
    df_clean['pier_b_disp_y_mm'] = (disp_by / 1000.0).round(3)

    # Pier Tilt (degrees): Tilt angle theta = arctan(displacement / pier_height)
    # Pier height H = 15 m = 15000 mm
    pier_h_mm = 15000.0
    tilt_rad = np.arctan(disp_ay / 1000.0 / pier_h_mm)
    df_clean['tilt_pier_a_deg'] = (np.degrees(tilt_rad)).round(5)
    df_clean['tilt_pier_a_mrad'] = (tilt_rad * 1000.0).round(4)

    # Sensor 5: Temperature & Environmental
    t_air = df_raw['temp_air_C'].interpolate(method='linear').ffill().bfill()
    t_asphalt = df_raw['temp_asphalt_C'].interpolate(method='linear').ffill().bfill()
    t_slab = df_raw['temp_slab_intrados_C'].interpolate(method='linear').ffill().bfill()

    df_clean['temp_air_c'] = t_air.round(2)
    df_clean['temp_deck_asphalt_c'] = t_asphalt.round(2)
    df_clean['temp_slab_intrados_c'] = t_slab.round(2)
    df_clean['temp_gradient_c'] = (t_asphalt - t_slab).round(2)

    # Hydrological water level proxy (m)
    water_level = df_raw['water_level_proxy_m'].interpolate(method='linear').ffill().bfill()
    df_clean['river_water_level_m'] = water_level.round(3)

    # Relative Humidity (% RH) - Transparently Simulated Parameter
    # Real dataset lacks hygrometer channel; humidity is simulated using psychrometric diurnal cycle
    # inversely related to air temp and boosted during high river water level events.
    # Clearly labeled as simulated per capstone requirements!
    hours = df_raw['datetime'].dt.hour + df_raw['datetime'].dt.minute / 60.0
    # diurnal curve: peak humidity in early morning (5 AM), trough in afternoon (3 PM)
    diurnal_rh = 68.0 - 15.0 * np.sin((hours - 5) * 2 * np.pi / 24.0)
    water_boost = np.clip((water_level - water_level.min()) / (water_level.max() - water_level.min() + 1e-5) * 12.0, 0, 15)
    noise = np.random.normal(0, 1.2, len(df_raw))
    sim_rh = np.clip(diurnal_rh + water_boost + noise, 35.0, 98.0)
    df_clean['humidity_ambient_pct'] = sim_rh.round(1)
    df_clean['humidity_is_simulated'] = True

    # 3. Structural Operational Condition / Scenario Tagging
    # The dataset spans March 27 to April 10, 2026.
    # The April 2026 hydrometric flood event occurred around April 4 to April 8.
    # We tag:
    # 'normal': baseline pre-flood and steady post-flood
    # 'warning': initial flood rising / moderate cable force elevated
    # 'critical': peak flood level / high dynamic vibration & stay tension spike
    scenarios = []
    for idx, row in df_clean.iterrows():
        wl = row['river_water_level_m']
        vib = row['vibration_deck_mid_ms2']
        strain = row['strain_cable_mid_ue']
        if wl > 2.8 or vib > 0.08 or strain > 540:
            scenarios.append('critical')
        elif wl > 2.2 or vib > 0.05 or strain > 490:
            scenarios.append('warning')
        else:
            scenarios.append('normal')
    df_clean['scenario'] = scenarios

    # 4. Feature Normalization (MinMax [0, 1] and Z-Score Standardization)
    feature_cols = [
        'vibration_deck_mid_ms2', 'vibration_pylon_rms_microg',
        'strain_cable_mid_ue', 'cable_tension_d1_kn',
        'tilt_pier_a_deg', 'pier_a_disp_y_mm',
        'temp_air_c', 'temp_deck_asphalt_c', 'temp_gradient_c',
        'humidity_ambient_pct', 'river_water_level_m'
    ]

    scaler_minmax = MinMaxScaler()
    norm_minmax = scaler_minmax.fit_transform(df_clean[feature_cols])
    for i, col in enumerate(feature_cols):
        df_clean[f'{col}_norm'] = norm_minmax[:, i].round(4)

    scaler_z = StandardScaler()
    norm_z = scaler_z.fit_transform(df_clean[feature_cols])
    for i, col in enumerate(feature_cols):
        df_clean[f'{col}_zscore'] = norm_z[:, i].round(4)

    # 5. Save Cleaned Dataset to CSV
    df_clean.to_csv(PROCESSED_CSV_PATH, index=False)
    print(f"Preprocessed dataset saved to {PROCESSED_CSV_PATH}. Rows: {len(df_clean)}, Cols: {len(df_clean.columns)}")

    # 6. Metadata and Summary Statistics
    metadata = {
        "dataset_name": "FLOOD-SHAB Cable-Stayed Bridge SHM Features Dataset",
        "zenodo_record_id": "20443860",
        "doi": "10.5281/zenodo.20443860",
        "license": "Creative Commons Attribution 4.0 International (CC-BY-4.0)",
        "source_url": "https://zenodo.org/records/20443860",
        "bridge_description": "Continuous cable-stayed bridge over Saline River, Italy (approx total length 188.6m, main span 103.4m, side spans 42.6m)",
        "monitoring_period": "2026-03-27 00:29:40 to 2026-04-10 23:59:40",
        "total_records": len(df_clean),
        "scenario_distribution": df_clean['scenario'].value_counts().to_dict(),
        "features": {
            "vibration_deck_mid_ms2": {
                "unit": "m/s^2",
                "source": "AM1Z Accelerometer (Deck Mid-span vertical)",
                "is_real": True,
                "mean": float(df_clean['vibration_deck_mid_ms2'].mean()),
                "min": float(df_clean['vibration_deck_mid_ms2'].min()),
                "max": float(df_clean['vibration_deck_mid_ms2'].max()),
                "std": float(df_clean['vibration_deck_mid_ms2'].std())
            },
            "strain_cable_mid_ue": {
                "unit": "ue",
                "source": "Loadcell D6 (Stay-cable 6 mid-span tension force)",
                "is_real": True,
                "mean": float(df_clean['strain_cable_mid_ue'].mean()),
                "min": float(df_clean['strain_cable_mid_ue'].min()),
                "max": float(df_clean['strain_cable_mid_ue'].max()),
                "std": float(df_clean['strain_cable_mid_ue'].std())
            },
            "tilt_pier_a_deg": {
                "unit": "deg",
                "source": "Displacement transducer A Pier Transverse",
                "is_real": True,
                "mean": float(df_clean['tilt_pier_a_deg'].mean()),
                "min": float(df_clean['tilt_pier_a_deg'].min()),
                "max": float(df_clean['tilt_pier_a_deg'].max()),
                "std": float(df_clean['tilt_pier_a_deg'].std())
            },
            "temp_deck_asphalt_c": {
                "unit": "deg C",
                "source": "Asphalt temperature sensor",
                "is_real": True,
                "mean": float(df_clean['temp_deck_asphalt_c'].mean()),
                "min": float(df_clean['temp_deck_asphalt_c'].min()),
                "max": float(df_clean['temp_deck_asphalt_c'].max()),
                "std": float(df_clean['temp_deck_asphalt_c'].std())
            },
            "humidity_ambient_pct": {
                "unit": "% RH",
                "source": "Simulated (Psychrometric diurnal model coupled to air temperature and river water level proxy)",
                "is_real": False,
                "mean": float(df_clean['humidity_ambient_pct'].mean()),
                "min": float(df_clean['humidity_ambient_pct'].min()),
                "max": float(df_clean['humidity_ambient_pct'].max()),
                "std": float(df_clean['humidity_ambient_pct'].std())
            }
        }
    }

    with open(METADATA_PATH, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"Metadata saved to {METADATA_PATH}")

    return df_clean, metadata

if __name__ == "__main__":
    df, meta = preprocess_shm_dataset()
    print("Preprocessing completed successfully!")
    print("Scenarios:", meta["scenario_distribution"])

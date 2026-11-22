# Structural Health Monitoring (SHM) Dataset Documentation

## Overview

The **MobileTwin** capstone platform utilizes verified empirical Structural Health Monitoring (SHM) data gathered from a continuous cable-stayed bridge and integrates it with software-based IoT real-time streaming simulations.

Per project guidelines:
- **No hardware or physical IoT sensors** were deployed.
- **Empirical baseline telemetry** was sourced from peer-reviewed public scientific research repositories (Zenodo).
- **Simulated parameters** (such as relative ambient humidity) are explicitly and transparently distinguished from empirical sensor measurements.
- Original raw files are preserved in `backend/data/raw/` and processed using NumPy and Pandas scripts in `backend/data/preprocessor.py`.

---

## 1. Primary Empirical Dataset: FLOOD-SHAB Cable-Stayed Bridge

| Attribute | Specification |
| :--- | :--- |
| **Dataset Title** | FLOOD-SHAB: Cable-stayed bridge case-study SHM monitoring features dataset during the April 2026 hydrometric event |
| **Repository** | Zenodo Open Science Repository |
| **Record ID** | [20443860](https://zenodo.org/records/20443860) |
| **Persistent DOI** | `10.5281/zenodo.20443860` |
| **Principal Investigators** | Karina Buka-Vaivade, Vanni Nicoletti, Simone Quarchioni, Fabrizio Gara |
| **Affiliations / Funding** | European Commission Horizon Europe MSCA FLOOD-SHAB Initiative |
| **License** | **Creative Commons Attribution 4.0 International (CC-BY-4.0)** |
| **Monitored Structure** | Full-scale continuous cable-stayed road bridge over the Saline River, Italy |
| **Bridge Dimensions** | Approx. 188.6 m total length (103.4 m main span, two 42.6 m approach side spans) |
| **Pylon Configuration** | Twin concrete/steel vertical towers with stay cable fans |
| **Monitoring Window** | March 27, 2026 00:29:40 to April 10, 2026 23:59:40 |
| **Sampling Interval** | 30-minute automated windowed spectral & static extractions (718 temporal records) |

---

## 2. Preserved Files in `backend/data/raw/`

1. **`CableStayedBridge_SHM_features_2026-03-27_2026-04-10.csv`** (2.52 MB):
   - 718 chronological rows $\times$ 329 features.
   - Contains acceleration RMS, peak amplitudes, modal frequencies, stay cable loads, pier displacements, temperatures, and water levels.
2. **`CableStayedBridge_SHM_features_data_dictionary.csv`** (38 KB):
   - Detailed definitions, units, sensor groupings, and statistical derivation methods for all 329 raw variables.
3. **`CableStayedBridge_sensor_channel_mapping.csv`** (6.8 KB):
   - Spatial layout matching channel IDs to structural components (deck sections U4, D4, pylon caps, piers A & B, stay cables 1 to 20).
4. **`README_CableStayedBridge_SHM_event_dataset.txt`** (12 KB):
   - Research documentation outlining instrument specifications and hydrometric flood chronology.
5. **`CableStayedBridge_monitoring_system_layout.png`** (324 KB):
   - Engineering schematic illustrating physical accelerometer, load cell, and displacement transducer placement.

---

## 3. Extracted Sensor Channels & Physical Mapping

The following real sensor parameters were isolated, cleaned, and mapped to the 3D digital twin:

| Sensor Code | Parameter Name | Physical Location | Raw Column | Processed Field | Empirical Unit | Is Real? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **VIB-DECK-01** | Deck Mid-Span Vibration | Mid-Span Roadway Deck (U4) | `rms_AM1Z_microg` | `vibration_deck_mid_ms2` | $\text{m/s}^2$ | **Real** |
| **VIB-PYL-01** | Pylon A Top Vibration | Pylon A Cap (Top) | `rms_AV1Z_microg`, `rms_AV1X_microg` | `vibration_pylon_rms_microg` | $\mu g$ | **Real** |
| **STR-CBL-01** | Stay Cable Tension / Strain | Mid-Span Cable D6 | `loadcell_D6_N` | `strain_cable_mid_ue` | $\mu\epsilon$ (microstrain) | **Real** |
| **STR-CBL-02** | Main Stay Cable Tension | Anchor Cable D1 | `loadcell_D1_N` | `cable_tension_d1_kn` | $\text{kN}$ | **Real** |
| **TLT-PIER-01** | Pier A Transverse Tilt | Pier A Support Base | `disp_A_pier_Y_microm` | `tilt_pier_a_deg` | $\text{deg}$ ($^{\circ}$) | **Real** |
| **DSP-PIER-02** | Pier A Transverse Displacement | Pier A Top Bearings | `disp_A_pier_Y_microm` | `pier_a_disp_y_mm` | $\text{mm}$ | **Real** |
| **TMP-DECK-01** | Deck Asphalt Surface Temp | Roadway Deck Surface | `temp_asphalt_C` | `temp_deck_asphalt_c` | $^{\circ}\text{C}$ | **Real** |
| **TMP-AMB-01** | Ambient Air Temperature | Meteorological Mast | `temp_air_C` | `temp_air_c` | $^{\circ}\text{C}$ | **Real** |
| **HUM-ENV-01** | Ambient Relative Humidity | Pylon Meteorological Station | *Synthetic Coupling* | `humidity_ambient_pct` | $\%$ RH | **Simulated** |

---

## 4. Transparent Simulation Justification

- **Parameter**: Ambient Relative Humidity (`HUM-ENV-01`, `% RH`).
- **Reason for Simulation**: The original bridge data acquisition system recorded air, asphalt, and concrete slab temperatures along with river water level proxies, but lacked a dedicated electronic capacitive hygrometer.
- **Formulation**: Humidity is simulated using an inverse diurnal psychrometric curve coupled with empirical air temperature ($T_{\text{air}}$) and river water stage height ($h_{\text{water}}$):
  $$\text{RH}(t) = \text{clip}\left(68.0 - 15.0 \cdot \sin\left(\frac{(t_{\text{hour}} - 5) \cdot 2\pi}{24}\right) + 12 \cdot \frac{h_{\text{water}} - h_{\min}}{h_{\max} - h_{\min}} + \epsilon, 35\%, 98\%\right)$$
  where $\epsilon \sim \mathcal{N}(0, 1.2)$ represents atmospheric variance.
- **Identification**: Marked with `is_simulated = True` in the SQLite database, REST APIs, and UI cards with a distinct purple "SIMULATED" badge.

---

## 5. Preprocessing & Feature Engineering Pipeline

The script `backend/data/preprocessor.py` executes:
1. **Timestamp Normalization**: Parses ISO 8601 strings and validates continuous monotonic time ordering.
2. **Missing-Value Imputation**: Applies time-weighted linear interpolation (`df.interpolate(method='linear')`) followed by boundary padding (`ffill().bfill()`).
3. **Engineering Conversions**:
   - Acceleration: Micro-g ($\mu g$) converted to SI standard acceleration:
     $$a_{\text{SI}} (\text{m/s}^2) = a_{\mu g} \times 9.80665 \times 10^{-6}$$
   - Microstrain ($\mu\epsilon$): Derived from tensile load ($F$ in Newtons) using bridge stay cable cross-sectional area ($A = 1800 \text{ mm}^2$) and steel elasticity modulus ($E = 205 \text{ GPa}$):
     $$\epsilon = \frac{F}{A \cdot E} \times 10^6$$
   - Pier Tilt ($\theta$ in degrees): Derived from displacement $\Delta y$ over effective pier height $H = 15 \text{ m}$:
     $$\theta = \arctan\left(\frac{\Delta y}{H}\right) \times \frac{180}{\pi}$$
4. **Feature Normalization**: Computes both MinMax normalization $[0, 1]$ and Z-score standardization ($\mu=0, \sigma=1$) across all physical features.
5. **Operational Scenarios**: Labels historical time frames into `normal`, `warning`, and `critical` phases based on river hydrometric flood surge boundaries.

---

## 6. How to Run Preprocessing

```bash
cd backend
python data/dataset_downloader.py
python data/preprocessor.py
```

Generated outputs:
- `backend/data/processed/shm_cleaned_features.csv` (718 records $\times$ 51 features)
- `backend/data/processed/feature_metadata.json` (Summary statistics, distribution bounds, sensor metadata)

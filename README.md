# MobileTwin: Digital Twin-Based Mobile Monitoring System for Smart Infrastructure

[![Python 3.14](https://img.shields.io/badge/Python-3.14-blue.svg)](https://www.python.org/)
[![React 18](https://img.shields.io/badge/React-18.3-cyan.svg)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-black.svg)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![License: CC BY 4.0](https://img.shields.io/badge/Dataset_License-CC_BY_4.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)

---

## 1. Executive Summary & Project Overview

**MobileTwin** is a complete, production-grade functional capstone software platform engineered for real-time Structural Health Monitoring (SHM) of civil smart infrastructure. It pairs a high-performance **interactive 3D digital twin** in WebGL (Three.js) with real-world empirical baseline telemetry and software-based IoT streaming simulation.

### Core Highlights
* **Zero Hardware Dependency**: Operates entirely on empirical scientific datasets combined with software-based IoT sensor simulation.
* **Empirical Scientific Grounding**: Integrates verified field monitoring features from **Zenodo Record 20443860** (*FLOOD-SHAB Cable-Stayed Bridge Case-Study*, DOI: `10.5281/zenodo.20443860`, CC-BY-4.0).
* **Interactive 3D Digital Twin**: Full procedural WebGL 3D model of a continuous 188.6m cable-stayed bridge featuring composite deck, roadway markings, safety guardrails, twin pylons, 24 harp stay cables, river piers, undulating water surface, and 3D pulsing virtual sensor pins.
* **Real-Time Live Telemetry Engine**: Multi-threaded Python simulation engine broadcasting 0.5 Hz live readings over WebSockets (`Flask-SocketIO`), updating SQLite database records and synchronizing 3D pin colors in real time.
* **Transparent Multi-Tier Analytics**:
  1. Multi-tier physical safety bounds (`Normal`, `Warning`, `Critical`).
  2. Rolling statistical Z-score deviation analysis.
  3. Machine Learning (`Scikit-Learn IsolationForest`) multivariate outlier detection trained on empirical baseline telemetry.
  4. Composite **Infrastructure Health Index (IHI)** (0 to 100) with weighted sub-index breakdown.
* **Field Engineer & Admin Workflow**: Role-based access control, interactive safety threshold configuration, instant alert acknowledgment with engineer field dispatch notes, and historical time-series analytics.

---

## 2. System Architecture

```
+-----------------------------------------------------------------------------------------+
|                                    MOBILETIWN SYSTEM                                     |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|   +---------------------------------------------------------------------------------+   |
|   |                       FRONTEND: REACT 18 + TYPESCRIPT + VITE                    |   |
|   |  - Three.js Interactive 3D Cable-Stayed Bridge Twin (OrbitControls, Raycaster)   |   |
|   |  - Executive Health Score Circular Gauge (SVG Animated Breakdown)                |   |
|   |  - Real-Time Streaming Telemetry Charts (Recharts Time-Series & Bounds)          |   |
|   |  - Alerts & Incident Management with Engineer Acknowledgment Modal              |   |
|   |  - Historical Baseline Analytics & Scikit-Learn IsolationForest Scatter View    |   |
|   |  - Admin Safety Threshold Configuration Form with Live Validation                |   |
|   +---------------------------------------^-----------------------------------------+   |
|                                           | WebSocket Telemetry Stream (0.5 Hz)         |
|                                           | REST API Requests (JSON / Auth Headers)     |
|   +---------------------------------------v-----------------------------------------+   |
|   |                       BACKEND: PYTHON FLASK + FLASK-SOCKETIO                    |   |
|   |  - Threaded Background IoT Simulation Engine (Normal / Warning / Critical)      |   |
|   |  - Composite Infrastructure Health Index (IHI) Calculator (0 - 100 Score)       |   |
|   |  - Multi-tier Threshold Evaluator & Scikit-Learn IsolationForest Anomaly Model  |   |
|   |  - SQLite Database with SQLAlchemy ORM (7 Relational Models)                    |   |
|   +---------------------------------------^-----------------------------------------+   |
|                                           | Preprocessed CSV Features                   |
|   +---------------------------------------v-----------------------------------------+   |
|   |                        DATASET & PREPROCESSING PIPELINE                         |   |
|   |  - Raw Zenodo Open Science Repository (Record 20443860: FLOOD-SHAB Bridge)       |   |
|   |  - NumPy & Pandas Cleaning, Timestamp Alignment, Imputation, SI Conversions     |   |
|   |  - Normalization (MinMax [0, 1] & Z-Score Standardization)                      |   |
|   +---------------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------------+
```

---

## 3. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 18, TypeScript, Vite 5, Tailwind CSS |
| **3D Digital Twin Engine** | Three.js (WebGL), OrbitControls, Raycaster |
| **Data Visualization** | Recharts (Line Charts, Scatter Plots, Reference Lines), SVG Gauges |
| **Real-Time Communication** | Socket.IO Client (`socket.io-client`), WebSockets |
| **Iconography** | Lucide-React |
| **Backend Web Framework** | Python 3.14, Flask, Flask-CORS |
| **Real-Time Telemetry Server** | Flask-SocketIO, Simple-WebSocket, Threading |
| **Database & ORM** | SQLite 3, SQLAlchemy, Flask-SQLAlchemy |
| **Data Science & ML** | NumPy, Pandas, Scikit-learn (IsolationForest, Scalers), SciPy |
| **Security** | Werkzeug Security (PBKDF2 Password Hashing), Role-Based Access Control |

---

## 4. Empirical Dataset & Provenance

* **Dataset Name**: FLOOD-SHAB: Cable-stayed bridge case-study SHM monitoring features dataset during the April 2026 hydrometric event
* **Repository**: Zenodo Open Science Repository
* **Record ID**: [20443860](https://zenodo.org/records/20443860) | **DOI**: `10.5281/zenodo.20443860`
* **Authors**: Karina Buka-Vaivade, Vanni Nicoletti, Simone Quarchioni, Fabrizio Gara
* **License**: **Creative Commons Attribution 4.0 International (CC-BY-4.0)**
* **Structure Monitored**: Saline River Cable-Stayed Road Bridge, Abruzzo, Italy (approx. 188.6 m length)
* **Preserved Raw Data**: Stored in `backend/data/raw/` (2.52 MB CSV with 718 records $\times$ 329 features).

### Monitored Sensor Channels

| Sensor Code | Parameter Name | Physical Location | Source Channel | Unit | Type | Is Real? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **VIB-DECK-01** | Deck Mid-Span Vertical Vibration | Deck Center Girder (U4) | `rms_AM1Z_microg` | $\text{m/s}^2$ | Vibration | **Empirical Real** |
| **VIB-PYL-01** | Pylon A Head Vibration | Pylon A Cap (Top) | `rms_AV1Z_microg` | $\mu g$ | Vibration | **Empirical Real** |
| **STR-CBL-01** | Stay Cable D6 Mid-Span Strain | Stay Cable D6 Load-Cell | `loadcell_D6_N` | $\mu\epsilon$ | Strain | **Empirical Real** |
| **STR-CBL-02** | Main Stay Cable D1 Tension | Tower Anchorage Cable D1 | `loadcell_D1_N` | $\text{kN}$ | Strain | **Empirical Real** |
| **TLT-PIER-01** | Pier Foundation A Transverse Tilt | Pier Foundation Base | `disp_A_pier_Y_microm` | $\text{deg}$ ($^{\circ}$) | Tilt | **Empirical Real** |
| **DSP-PIER-02** | Pier A Bearing Displacement | Pier A Elastomeric Bearing | `disp_A_pier_Y_microm` | $\text{mm}$ | Displacement | **Empirical Real** |
| **TMP-DECK-01** | Deck Asphalt Surface Temp | Roadway Asphalt Layer | `temp_asphalt_C` | $^{\circ}\text{C}$ | Temperature | **Empirical Real** |
| **TMP-AMB-01** | Ambient Air Temperature | Meteorological Mast | `temp_air_C` | $^{\circ}\text{C}$ | Temperature | **Empirical Real** |
| **HUM-ENV-01** | Ambient Relative Humidity | Pylon Weather Mast | *Synthetic Coupling* | $\%$ RH | Humidity | **Simulated** |

> **Transparent Simulation Notice**: The empirical dataset lacked an electronic hygrometer channel. Relative humidity (`HUM-ENV-01`) is simulated using an inverse psychrometric diurnal curve coupled with air temperature and river water level, clearly identified with purple **`SIMULATED`** badges across the UI and database.

---

## 5. Modules Breakdown

### Module 1: Digital Twin Modelling & Data Acquisition
1. **Interactive 3D WebGL Bridge**:
   - Continuous composite deck with asphalt wear surface, lane dividers, and safety guardrails.
   - Twin vertical concrete/steel pylons with upper and lower cross-struts.
   - 24 stay cables in harp/fan configuration with dynamic tension shading.
   - Cylindrical foundation piers resting in animated river water with surface reflection.
   - 3D pulsing virtual sensor markers color-coded to live quality flags (`Green = Nominal`, `Amber = Warning`, `Red = Critical`).
   - Interactive raycasting: hover displays live metric tooltip; click opens inspector drawer.
   - Camera presets: Isometric Overview, Deck Level, Pylon A, Pylon B, Stay Cables.
   - Toggles: FEA Wireframe mode and Stress Heatmap mode.
2. **Python IoT Simulation Engine**:
   - Replays consecutive historical event windows from `shm_cleaned_features.csv`.
   - Generates live readings at regular intervals (default: 2.0s / 0.5 Hz).
   - Supports 3 operational scenarios:
     * **Normal**: Nominal traffic oscillation within safe design envelope.
     * **Warning**: Elevated stay cable force, thermal loading, and moderate vibration surge.
     * **Critical**: Severe hydrometric flood peak, high vibration, extreme cable tension, and pier tilt.
   - Auto-generates `Alert` records in SQLite when thresholds are violated.
   - Emits live WebSocket packets via `socketio.emit('sensor_stream', payload)`.

### Module 2: Mobile Monitoring & Real-Time Visualization
1. **Responsive Executive Dashboard**:
   - Circular animated composite Health Score gauge (0-100) with 5 sub-index progress bars.
   - Real-time telemetry cards with units, min/max bounds, status pills, and sparkline indicators.
   - Live streaming Recharts line graph with auto-scrolling window and threshold reference lines.
   - Scenario switcher bar with instant 1-click injection.
2. **Dedicated Pages**:
   - **3D Digital Twin View**: Full-screen 3D model with camera presets and click-to-inspect sensor panel.
   - **Sensor Monitoring Array**: Grid/list of all 9 sensors with search, type filters, and 60-point recent telemetry modal.
   - **Historical Analytics**: Historical baseline charts, empirical Zenodo dataset viewer, CSV export download, and Scikit-learn IsolationForest anomaly scatter plot.
   - **Alerts & Incidents Management**: Status filtering (`active`, `acknowledged`, `resolved`), severity filtering (`critical`, `warning`), and 1-click engineer acknowledgment dialog with field dispatch notes.
   - **Threshold Settings**: Admin-controlled form to modify Warning and Critical upper/lower limits per sensor with instant database persistence and validation.
   - **Profile & Architecture**: Active session privileges, role permission matrix, dataset provenance, and engineering disclaimers.
3. **Mobile & Desktop Responsive Design**:
   - Desktop sleek navy blue collapsible sidebar.
   - Mobile touch-friendly bottom navigation bar and responsive header.

---

## 6. Database Schema (SQLite & SQLAlchemy)

* **`users`**: `id`, `username`, `email`, `password_hash`, `role` (`admin` / `engineer`), `full_name`, `created_at`.
* **`infrastructures`**: `id`, `name`, `type`, `location`, `length_m`, `spans`, `construction_year`, `description`, `health_score`, `status`, `created_at`, `updated_at`.
* **`sensors`**: `id`, `sensor_code`, `name`, `type`, `unit`, `x_pos`, `y_pos`, `z_pos`, `physical_location`, `min_threshold`, `max_threshold`, `warning_min`, `warning_max`, `critical_min`, `critical_max`, `is_active`, `is_simulated`, `source_channel`, `infrastructure_id`.
* **`sensor_readings`**: `id`, `sensor_id`, `timestamp`, `value`, `raw_value`, `is_simulated`, `quality_flag`, `created_at`.
* **`historical_datasets`**: `id`, `record_index`, `original_timestamp`, `feature_name`, `value`, `unit`, `is_real`, `scenario_label`, `created_at`.
* **`alerts`**: `id`, `sensor_id`, `alert_level`, `title`, `message`, `value`, `threshold_triggered`, `status`, `created_at`, `resolved_at`.
* **`alert_acknowledgements`**: `id`, `alert_id`, `user_id`, `notes`, `acknowledged_at`.

---

## 7. REST API Documentation

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user (returns JWT token and profile) |
| `GET` | `/api/auth/me` | Retrieve currently authenticated user profile |
| `GET` | `/api/sensors` | List all 9 sensors with current readings and thresholds |
| `GET` | `/api/sensors/<id>` | Retrieve sensor details with 60-point recent telemetry |
| `PUT` | `/api/sensors/<id>/thresholds` | Update warning and critical limits (Admin role) |
| `GET` | `/api/readings/latest` | Real-time snapshot of latest readings across all channels |
| `GET` | `/api/readings/historical` | Filtered historical time-series with date and code parameters |
| `GET` | `/api/readings/dataset-historical`| Fetch empirical baseline records from Zenodo SHM dataset |
| `GET` | `/api/readings/export` | Download CSV telemetry export file |
| `GET` | `/api/alerts` | List alerts with status and level filtering |
| `GET` | `/api/alerts/summary` | Summary counters of active, critical, and resolved alerts |
| `POST` | `/api/alerts/<id>/acknowledge`| Acknowledge alert with engineer notes |
| `POST` | `/api/alerts/<id>/resolve` | Mark acknowledged alert as resolved |
| `GET` | `/api/analytics/health` | Calculate composite Infrastructure Health Index (IHI) |
| `POST` | `/api/analytics/scenario` | Switch simulation scenario (`normal`, `warning`, `critical`) |
| `GET` | `/api/twin/structure` | 3D bridge dimensions, nodes, and sensor marker coordinates |
| `GET` | `/api/twin/state` | Current 3D marker colors and live sensor states |

---

## 8. Verification & Test Suite

The platform includes an automated unit and integration test suite:

```bash
cd backend
python -m unittest discover -s tests -v
```

### Test Results Summary
* **`test_preprocessor.py`**:
  - `test_processed_dataset_exists`: PASS
  - `test_metadata_exists`: PASS
  - `test_dataset_columns_and_rows`: PASS (718 records $\times$ 51 features verified)
  - `test_no_null_critical_features`: PASS
  - `test_metadata_attributes`: PASS
* **`test_database.py`**:
  - `test_users_exist`: PASS (`admin` and `engineer` accounts validated)
  - `test_infrastructure_exists`: PASS (Saline River Bridge verified)
  - `test_sensors_and_relationships`: PASS (All 9 channels linked with readings)
  - `test_historical_dataset_records`: PASS (>1400 empirical records seeded)
* **`test_simulation_and_anomaly.py`**:
  - `test_threshold_anomaly_evaluation`: PASS (Normal, Warning, Critical boundary logic verified)
  - `test_health_calculator`: PASS (Weighted composite health score verified)
* **`test_api_endpoints.py`**:
  - `test_healthcheck`: PASS
  - `test_login`: PASS (Auth and token issuance verified)
  - `test_get_sensors`: PASS
  - `test_get_readings_latest`: PASS
  - `test_get_health`: PASS
  - `test_get_twin_structure`: PASS
* **Overall Outcome**: **17 / 17 Tests Passed (100% Success)**.

---

## 9. Quickstart & Execution Guide

### Option A: One-Click Windows Launcher (Recommended)
Double-click:
```cmd
start_system.bat
```
This automatically initializes the SQLite database, launches the Flask backend on port 5000, and starts the Vite frontend on port 5173.

### Option B: Manual Execution

#### Step 1: Initialize Database & Run Backend
```powershell
cd "backend"
python data/dataset_downloader.py   # Verifies raw Zenodo dataset files
python data/preprocessor.py         # Executes preprocessing & feature extraction
python init_db.py                   # Creates SQLite database & seeds initial data
python app.py                       # Starts Flask-SocketIO server on http://localhost:5000
```

#### Step 2: Run Frontend Development Server
Open a separate terminal:
```powershell
cd "frontend"
npm run dev -- --host
```
Open **`http://localhost:5173`** in your browser.

### Default Demo Credentials
* **Administrator**: `admin` / `admin123` (Full safety threshold editing & scenario injection)
* **Field Engineer**: `engineer` / `engineer123` (Telemetry inspection & alert acknowledgment)

---

## 10. Engineering Disclaimer

All simulated measurements, statistical health scores, and machine learning anomaly predictions within **MobileTwin** are developed for computational digital twin demonstration, education, and decision support. They do not establish or replace physical structural safety engineering inspection or certification.

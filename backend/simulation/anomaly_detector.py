"""
MobileTwin Anomaly Detection Engine
Combines Multi-Tier Threshold Verification, Rolling Statistical Z-Scores,
and Scikit-Learn IsolationForest Unsupervised Multivariate Outlier Detection.
"""

import os
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

class AnomalyDetector:
    def __init__(self, processed_csv_path=None):
        self.isolation_forest = None
        self.feature_cols = [
            'vibration_deck_mid_ms2',
            'strain_cable_mid_ue',
            'tilt_pier_a_deg',
            'temp_deck_asphalt_c',
            'humidity_ambient_pct'
        ]
        self.baseline_stats = {}
        if processed_csv_path and os.path.exists(processed_csv_path):
            self.train_ml_model(processed_csv_path)

    def train_ml_model(self, csv_path):
        """Train IsolationForest on historical empirical baseline data."""
        try:
            df = pd.read_csv(csv_path)
            # Use normal baseline period for training
            df_normal = df[df['scenario'] == 'normal']
            if len(df_normal) < 50:
                df_normal = df  # fallback if scenario filter is too strict
            
            X = df_normal[self.feature_cols].dropna()
            self.isolation_forest = IsolationForest(
                n_estimators=100,
                contamination=0.04,
                random_state=42
            )
            self.isolation_forest.fit(X)

            # Store baseline statistics for rolling checks
            for col in self.feature_cols:
                self.baseline_stats[col] = {
                    'mean': float(df[col].mean()),
                    'std': float(df[col].std()) if df[col].std() > 0 else 1.0,
                    'min': float(df[col].min()),
                    'max': float(df[col].max())
                }
            print(f"[AnomalyDetector] IsolationForest trained on {len(X)} historical records.")
        except Exception as e:
            print(f"[AnomalyDetector] Warning: Could not train ML model: {e}")

    def evaluate_threshold(self, sensor, value):
        """
        Evaluate reading against configured physical bounds.
        Returns: (quality_flag, alert_level, explanation)
        """
        flag = 'GOOD'
        alert_level = None
        explanation = []

        # Check Critical
        if value >= sensor.critical_max:
            flag = 'CRITICAL'
            alert_level = 'critical'
            explanation.append(f"Value {value:.4f} {sensor.unit} exceeded Critical Upper Bound ({sensor.critical_max:.4f} {sensor.unit})")
        elif value <= sensor.critical_min:
            flag = 'CRITICAL'
            alert_level = 'critical'
            explanation.append(f"Value {value:.4f} {sensor.unit} fell below Critical Lower Bound ({sensor.critical_min:.4f} {sensor.unit})")
        # Check Warning
        elif value >= sensor.warning_max:
            flag = 'WARNING'
            alert_level = 'warning'
            explanation.append(f"Value {value:.4f} {sensor.unit} exceeded Warning Upper Bound ({sensor.warning_max:.4f} {sensor.unit})")
        elif value <= sensor.warning_min:
            flag = 'WARNING'
            alert_level = 'warning'
            explanation.append(f"Value {value:.4f} {sensor.unit} fell below Warning Lower Bound ({sensor.warning_min:.4f} {sensor.unit})")
        else:
            explanation.append(f"Nominal operating range ({sensor.warning_min:.2f} to {sensor.warning_max:.2f} {sensor.unit})")

        return flag, alert_level, "; ".join(explanation)

    def evaluate_multivariate_ml(self, readings_dict):
        """
        Evaluates a complete snapshot of all sensor readings with IsolationForest.
        readings_dict: { 'vibration_deck_mid_ms2': float, ... }
        Returns: (is_anomaly: bool, anomaly_score: float, explanation: str)
        """
        if not self.isolation_forest:
            return False, 0.0, "ML model not initialized."

        try:
            sample = []
            for col in self.feature_cols:
                val = readings_dict.get(col)
                if val is None:
                    val = self.baseline_stats.get(col, {}).get('mean', 0.0)
                sample.append(val)

            sample_arr = np.array([sample])
            pred = self.isolation_forest.predict(sample_arr)[0]  # 1: inlier, -1: outlier
            score = float(self.isolation_forest.decision_function(sample_arr)[0])  # lower = more anomalous

            is_anomaly = (pred == -1)
            reasons = []
            if is_anomaly:
                for col in self.feature_cols:
                    cur = readings_dict.get(col)
                    b_stat = self.baseline_stats.get(col)
                    if cur is not None and b_stat:
                        z = abs(cur - b_stat['mean']) / b_stat['std']
                        if z > 2.0:
                            reasons.append(f"{col} deviation z-score={z:.1f} (val: {cur:.2f})")
                expl = "Multivariate isolation anomaly detected. Factors: " + (", ".join(reasons) if reasons else "correlated cross-sensor divergence")
            else:
                expl = "Multi-sensor pattern conforms to historical structural baseline."

            return is_anomaly, score, expl
        except Exception as e:
            return False, 0.0, f"ML evaluation error: {e}"

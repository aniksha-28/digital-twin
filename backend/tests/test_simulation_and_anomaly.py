"""
Test Simulation Engine, Anomaly Detector, and Health Calculator
"""

import os
import unittest
from flask import Flask
from config import Config
from models import db, Sensor
from simulation.anomaly_detector import AnomalyDetector
from simulation.health_calculator import HealthCalculator

class TestSimulationAndAnomaly(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.app.config.from_object(Config)
        db.init_app(self.app)
        self.app_context = self.app.app_context()
        self.app_context.push()

    def tearDown(self):
        self.app_context.pop()

    def test_threshold_anomaly_evaluation(self):
        csv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "processed", "shm_cleaned_features.csv")
        detector = AnomalyDetector(csv_path)

        sensor = Sensor.query.filter_by(sensor_code='VIB-DECK-01').first()
        self.assertIsNotNone(sensor)

        # Normal value
        flag, alert_lvl, expl = detector.evaluate_threshold(sensor, 0.020)
        self.assertEqual(flag, 'GOOD')
        self.assertIsNone(alert_lvl)

        # Warning value
        flag_w, alert_w, expl_w = detector.evaluate_threshold(sensor, 0.055)
        self.assertEqual(flag_w, 'WARNING')
        self.assertEqual(alert_w, 'warning')

        # Critical value
        flag_c, alert_c, expl_c = detector.evaluate_threshold(sensor, 0.095)
        self.assertEqual(flag_c, 'CRITICAL')
        self.assertEqual(alert_c, 'critical')

    def test_health_calculator(self):
        sensors = Sensor.query.all()
        # Normal baseline mock values
        sensors_dict = {
            s: (s.warning_min + s.warning_max) / 2.0
            for s in sensors
        }
        res = HealthCalculator.calculate_overall_health(sensors_dict)
        self.assertGreaterEqual(res['overall_score'], 85.0)
        self.assertEqual(res['status'], 'healthy')
        self.assertIn('disclaimer', res)

        # Severe degraded condition
        for s in sensors:
            if s.type == 'vibration':
                sensors_dict[s] = s.critical_max * 1.5

        res_critical = HealthCalculator.calculate_overall_health(sensors_dict)
        self.assertLess(res_critical['overall_score'], 90.0)

if __name__ == '__main__':
    unittest.main()

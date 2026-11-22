"""
Test Database Schemas, Entities, and Foreign Key Relationships
"""

import os
import unittest
from flask import Flask
from config import Config
from models import db, User, Infrastructure, Sensor, SensorReading, HistoricalDataset, Alert, AlertAcknowledgement

class TestDatabase(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.app.config.from_object(Config)
        db.init_app(self.app)
        self.app_context = self.app.app_context()
        self.app_context.push()

    def tearDown(self):
        self.app_context.pop()

    def test_users_exist(self):
        admin = User.query.filter_by(username='admin').first()
        engineer = User.query.filter_by(username='engineer').first()
        self.assertIsNotNone(admin)
        self.assertIsNotNone(engineer)
        self.assertTrue(admin.check_password('admin123'))
        self.assertTrue(engineer.check_password('engineer123'))
        self.assertEqual(admin.role, 'admin')
        self.assertEqual(engineer.role, 'engineer')

    def test_infrastructure_exists(self):
        infra = Infrastructure.query.first()
        self.assertIsNotNone(infra)
        self.assertEqual(infra.name, 'Saline River Cable-Stayed Bridge')
        self.assertGreater(infra.length_m, 100.0)

    def test_sensors_and_relationships(self):
        sensors = Sensor.query.all()
        self.assertEqual(len(sensors), 9)
        codes = [s.sensor_code for s in sensors]
        self.assertIn('VIB-DECK-01', codes)
        self.assertIn('STR-CBL-01', codes)
        self.assertIn('TLT-PIER-01', codes)
        self.assertIn('TMP-DECK-01', codes)
        self.assertIn('HUM-ENV-01', codes)

        vib_sensor = Sensor.query.filter_by(sensor_code='VIB-DECK-01').first()
        self.assertGreater(vib_sensor.readings.count(), 0)

    def test_historical_dataset_records(self):
        count = HistoricalDataset.query.count()
        self.assertGreater(count, 500)

if __name__ == '__main__':
    unittest.main()

"""
Test REST API Endpoints
"""

import unittest
import json
from app import create_app
from models import db, User

class TestAPIEndpoints(unittest.TestCase):
    def setUp(self):
        self.app, self.socketio = create_app()
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()

    def tearDown(self):
        # Stop simulator background thread to allow clean exit
        sim = self.app.config.get('SIMULATOR')
        if sim:
            sim.stop()
        self.app_context.pop()

    def test_healthcheck(self):
        r = self.client.get('/api/healthcheck')
        self.assertEqual(r.status_code, 200)
        data = r.get_json()
        self.assertEqual(data['status'], 'online')

    def test_login(self):
        r = self.client.post('/api/auth/login', json={'username': 'admin', 'password': 'wrongpassword'})
        self.assertEqual(r.status_code, 401)

        r_ok = self.client.post('/api/auth/login', json={'username': 'admin', 'password': 'admin123'})
        self.assertEqual(r_ok.status_code, 200)
        data = r_ok.get_json()
        self.assertIn('token', data)
        self.assertEqual(data['user']['role'], 'admin')

    def test_get_sensors(self):
        r = self.client.get('/api/sensors')
        self.assertEqual(r.status_code, 200)
        data = r.get_json()
        self.assertEqual(data['count'], 9)

    def test_get_readings_latest(self):
        r = self.client.get('/api/readings/latest')
        self.assertEqual(r.status_code, 200)
        data = r.get_json()
        self.assertIn('readings', data)

    def test_get_health(self):
        r = self.client.get('/api/analytics/health')
        self.assertEqual(r.status_code, 200)
        data = r.get_json()
        self.assertIn('health', data)
        self.assertIn('overall_score', data['health'])

    def test_get_twin_structure(self):
        r = self.client.get('/api/twin/structure')
        self.assertEqual(r.status_code, 200)
        data = r.get_json()
        self.assertIn('sensor_markers', data)
        self.assertEqual(len(data['sensor_markers']), 9)

if __name__ == '__main__':
    unittest.main()

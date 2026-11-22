"""
MobileTwin Application Configuration
"""

import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'mobiletwin-capstone-secret-key-2026')
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        f"sqlite:///{os.path.join(DATA_DIR, 'mobiletwin.db').replace('\\', '/')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SIMULATION_INTERVAL_SEC = float(os.environ.get('SIMULATION_INTERVAL_SEC', 2.0))
    CORS_HEADERS = 'Content-Type'

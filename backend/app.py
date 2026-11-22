"""
MobileTwin Backend Application Entrypoint
Integrates Flask REST APIs, Flask-SocketIO live WebSocket telemetry,
SQLAlchemy database operations, and the IoT Simulation Engine.
"""

import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO

from config import Config
from models import db
from routes.auth import auth_bp
from routes.sensors import sensors_bp
from routes.readings import readings_bp
from routes.alerts import alerts_bp
from routes.analytics import analytics_bp
from routes.digital_twin import digital_twin_bp
from simulation.simulator import SensorSimulator

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Enable Cross-Origin Resource Sharing
    CORS(app, resources={r"/*": {"origins": "*"}})

    # Initialize Database
    db.init_app(app)

    # Initialize Socket.IO
    socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

    # Register API Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(sensors_bp)
    app.register_blueprint(readings_bp)
    app.register_blueprint(alerts_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(digital_twin_bp)

    @app.route('/api/healthcheck', methods=['GET'])
    def healthcheck():
        return jsonify({
            'status': 'online',
            'system': 'MobileTwin Digital Twin Monitoring Platform',
            'version': '1.0.0'
        })

    # WebSocket connection handlers
    @socketio.on('connect')
    def handle_connect():
        print("[WebSocket] Client connected to digital twin telemetry stream.")
        socketio.emit('connection_status', {'status': 'connected', 'message': 'Subscribed to MobileTwin live feed'})

    @socketio.on('disconnect')
    def handle_disconnect():
        print("[WebSocket] Client disconnected from telemetry stream.")

    # Initialize and attach simulation engine
    simulator = SensorSimulator(app, socketio, interval_sec=app.config['SIMULATION_INTERVAL_SEC'])
    app.config['SIMULATOR'] = simulator
    simulator.start()

    return app, socketio

app, socketio = create_app()

if __name__ == '__main__':
    # Auto-initialize database if not present
    db_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "mobiletwin.db")
    if not os.path.exists(db_file):
        print("Database not detected. Running initial seeder...")
        from init_db import initialize_database
        initialize_database()

    print("==================================================================")
    print("  MobileTwin Structural Health Monitoring Server Starting")
    print("  REST API & WebSockets: http://localhost:5000")
    print("==================================================================")
    socketio.run(app, host='0.0.0.0', port=5000, debug=False, allow_unsafe_werkzeug=True)

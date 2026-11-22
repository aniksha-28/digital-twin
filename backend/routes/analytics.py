"""
MobileTwin Analytics, Health Score Breakdown, and Scenario Simulation Routes
"""

from flask import Blueprint, request, jsonify, current_app
from models import db, Infrastructure, Sensor, SensorReading
from simulation.health_calculator import HealthCalculator

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')

@analytics_bp.route('/health', methods=['GET'])
def get_health_score():
    infra = Infrastructure.query.first()
    sensors = Sensor.query.filter_by(is_active=True).all()

    sensors_dict = {}
    for s in sensors:
        latest = SensorReading.query.filter_by(sensor_id=s.id).order_by(SensorReading.timestamp.desc()).first()
        val = latest.value if latest else (s.warning_min + s.warning_max) / 2.0
        sensors_dict[s] = val

    health_data = HealthCalculator.calculate_overall_health(sensors_dict)

    return jsonify({
        'infrastructure': infra.to_dict() if infra else None,
        'health': health_data
    })

@analytics_bp.route('/scenario', methods=['POST'])
def set_scenario():
    data = request.get_json() or {}
    scenario = data.get('scenario', 'normal')

    simulator = current_app.config.get('SIMULATOR')
    if not simulator:
        return jsonify({'error': 'Simulator instance not available'}), 500

    success = simulator.set_scenario(scenario)
    if not success:
        return jsonify({'error': 'Invalid scenario. Choose normal, warning, or critical'}), 400

    return jsonify({
        'message': f'Scenario switched to {scenario.upper()}',
        'current_scenario': scenario
    })

@analytics_bp.route('/simulator-status', methods=['GET'])
def get_simulator_status():
    simulator = current_app.config.get('SIMULATOR')
    if not simulator:
        return jsonify({'status': 'stopped', 'scenario': 'unknown'})

    return jsonify({
        'is_running': simulator.is_running,
        'scenario': simulator.scenario,
        'current_step': simulator.current_step,
        'interval_sec': simulator.interval
    })

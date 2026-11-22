"""
MobileTwin Sensor Management & Configuration Routes
"""

from flask import Blueprint, request, jsonify
from models import db, Sensor, SensorReading

sensors_bp = Blueprint('sensors', __name__, url_prefix='/api/sensors')

@sensors_bp.route('', methods=['GET'])
def get_sensors():
    sensors = Sensor.query.order_by(Sensor.id).all()
    return jsonify({
        'count': len(sensors),
        'sensors': [s.to_dict() for s in sensors]
    })

@sensors_bp.route('/<int:sensor_id>', methods=['GET'])
def get_sensor(sensor_id):
    sensor = Sensor.query.get_or_404(sensor_id)
    recent_readings = SensorReading.query.filter_by(sensor_id=sensor_id)\
        .order_by(SensorReading.timestamp.desc())\
        .limit(60).all()

    return jsonify({
        'sensor': sensor.to_dict(),
        'recent_readings': [r.to_dict() for r in reversed(recent_readings)]
    })

@sensors_bp.route('/<int:sensor_id>/thresholds', methods=['PUT'])
def update_thresholds(sensor_id):
    sensor = Sensor.query.get_or_404(sensor_id)
    data = request.get_json() or {}

    try:
        if 'warning_min' in data:
            sensor.warning_min = float(data['warning_min'])
        if 'warning_max' in data:
            sensor.warning_max = float(data['warning_max'])
        if 'critical_min' in data:
            sensor.critical_min = float(data['critical_min'])
        if 'critical_max' in data:
            sensor.critical_max = float(data['critical_max'])

        # Sanity validation
        if sensor.warning_min < sensor.critical_min or sensor.warning_max > sensor.critical_max:
            return jsonify({'error': 'Warning limits must lie strictly within Critical bounds'}), 400

        db.session.commit()
        return jsonify({
            'message': 'Thresholds successfully updated',
            'sensor': sensor.to_dict()
        })
    except ValueError as e:
        return jsonify({'error': f'Invalid numeric threshold format: {e}'}), 400

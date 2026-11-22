"""
MobileTwin Digital Twin Structural Model & Spatial Synchronization Routes
Provides geometry nodes, cable connection endpoints, and 3D sensor coordinates.
"""

from flask import Blueprint, jsonify
from models import Sensor, SensorReading, Infrastructure

digital_twin_bp = Blueprint('digital_twin', __name__, url_prefix='/api/twin')

@digital_twin_bp.route('/structure', methods=['GET'])
def get_twin_structure():
    infra = Infrastructure.query.first()
    sensors = Sensor.query.filter_by(is_active=True).all()

    # Structural Dimensions (in 3D world units, scaled 1 unit = ~5 meters)
    # Cable-stayed bridge: Total length ~188.6m -> ~38 world units
    structure = {
        'bridge_id': infra.id if infra else 1,
        'name': infra.name if infra else 'Saline River Cable-Stayed Bridge',
        'type': 'cable_stayed',
        'dimensions': {
            'deck_length': 38.0,
            'deck_width': 3.2,
            'deck_thickness': 0.5,
            'deck_y': 0.8,
            'pylon_height': 9.5,
            'pylon_x_offset': 7.0,  # Twin pylons at X = -7.0 and X = +7.0
            'pier_height': 3.5,
            'water_y': -2.5
        },
        'pylons': [
            {'id': 'pylon_a', 'name': 'Pylon A (West)', 'x': -7.0, 'y': 0.8, 'z': 0.0, 'height': 9.5},
            {'id': 'pylon_b', 'name': 'Pylon B (East)', 'x': 7.0, 'y': 0.8, 'z': 0.0, 'height': 9.5}
        ],
        'piers': [
            {'id': 'pier_a', 'name': 'Pier Foundation A', 'x': -7.0, 'y': -1.2, 'z': 0.0},
            {'id': 'pier_b', 'name': 'Pier Foundation B', 'x': 7.0, 'y': -1.2, 'z': 0.0}
        ],
        # Interactive virtual sensor positions
        'sensor_markers': [
            {
                'sensor_id': s.id,
                'sensor_code': s.sensor_code,
                'name': s.name,
                'type': s.type,
                'unit': s.unit,
                'position': [s.x_pos, s.y_pos, s.z_pos],
                'physical_location': s.physical_location,
                'is_simulated': s.is_simulated
            }
            for s in sensors
        ]
    }

    return jsonify(structure)

@digital_twin_bp.route('/state', methods=['GET'])
def get_twin_live_state():
    """Returns current live sensor states for 3D marker coloring and deformation shaders."""
    sensors = Sensor.query.filter_by(is_active=True).all()
    marker_states = []

    for s in sensors:
        latest = SensorReading.query.filter_by(sensor_id=s.id).order_by(SensorReading.timestamp.desc()).first()
        val = latest.value if latest else 0.0
        flag = latest.quality_flag if latest else 'GOOD'

        # Color mapping for 3D pulsing markers
        if flag == 'CRITICAL':
            color = '#ef4444'  # Red
        elif flag == 'WARNING':
            color = '#f59e0b'  # Amber
        else:
            color = '#10b981'  # Emerald Green

        marker_states.append({
            'sensor_id': s.id,
            'sensor_code': s.sensor_code,
            'name': s.name,
            'type': s.type,
            'unit': s.unit,
            'value': val,
            'quality_flag': flag,
            'status_color': color,
            'position': [s.x_pos, s.y_pos, s.z_pos]
        })

    return jsonify({
        'markers': marker_states
    })

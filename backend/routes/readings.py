"""
MobileTwin Sensor Readings & Historical Time-Series Routes
"""

from flask import Blueprint, request, jsonify, Response
from datetime import datetime, timedelta
import io
import csv
from models import db, Sensor, SensorReading, HistoricalDataset

readings_bp = Blueprint('readings', __name__, url_prefix='/api/readings')

@readings_bp.route('/latest', methods=['GET'])
def get_latest_readings():
    sensors = Sensor.query.filter_by(is_active=True).all()
    results = []
    for s in sensors:
        latest = SensorReading.query.filter_by(sensor_id=s.id).order_by(SensorReading.timestamp.desc()).first()
        if latest:
            results.append({
                'sensor_id': s.id,
                'sensor_code': s.sensor_code,
                'name': s.name,
                'type': s.type,
                'unit': s.unit,
                'value': latest.value,
                'quality_flag': latest.quality_flag,
                'is_simulated': latest.is_simulated,
                'timestamp': latest.timestamp.isoformat()
            })
    return jsonify({'readings': results})

@readings_bp.route('/historical', methods=['GET'])
def get_historical_readings():
    sensor_code = request.args.get('sensor_code')
    sensor_type = request.args.get('type')
    limit = int(request.args.get('limit', 150))
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    query = SensorReading.query.join(Sensor)

    if sensor_code:
        query = query.filter(Sensor.sensor_code == sensor_code)
    if sensor_type:
        query = query.filter(Sensor.type == sensor_type)

    if start_date:
        try:
            s_dt = datetime.fromisoformat(start_date)
            query = query.filter(SensorReading.timestamp >= s_dt)
        except ValueError:
            pass

    if end_date:
        try:
            e_dt = datetime.fromisoformat(end_date)
            query = query.filter(SensorReading.timestamp <= e_dt)
        except ValueError:
            pass

    records = query.order_by(SensorReading.timestamp.desc()).limit(limit).all()

    return jsonify({
        'count': len(records),
        'readings': [r.to_dict() for r in reversed(records)]
    })

@readings_bp.route('/dataset-historical', methods=['GET'])
def get_empirical_dataset_history():
    """Retrieve preprocessed historical baseline records from Zenodo SHM dataset."""
    feature = request.args.get('feature', 'vibration_deck_mid_ms2')
    limit = int(request.args.get('limit', 200))

    records = HistoricalDataset.query.filter_by(feature_name=feature)\
        .order_by(HistoricalDataset.record_index.asc())\
        .limit(limit).all()

    return jsonify({
        'feature': feature,
        'count': len(records),
        'records': [r.to_dict() for r in records]
    })

@readings_bp.route('/export', methods=['GET'])
def export_readings_csv():
    """Export sensor readings to CSV."""
    sensor_code = request.args.get('sensor_code')
    query = SensorReading.query.join(Sensor)
    if sensor_code:
        query = query.filter(Sensor.sensor_code == sensor_code)

    records = query.order_by(SensorReading.timestamp.desc()).limit(1000).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['ID', 'Sensor Code', 'Sensor Name', 'Type', 'Timestamp', 'Value', 'Unit', 'Quality Flag', 'Is Simulated'])

    for r in records:
        writer.writerow([
            r.id,
            r.sensor.sensor_code,
            r.sensor.name,
            r.sensor.type,
            r.timestamp.isoformat(),
            r.value,
            r.sensor.unit,
            r.quality_flag,
            r.is_simulated
        ])

    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=mobiletwin_telemetry.csv"}
    )

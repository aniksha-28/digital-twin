"""
MobileTwin SQLAlchemy Models
Defines complete relational schemas with proper keys, foreign keys, constraints, and timestamps.
"""

from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='engineer')  # 'admin' or 'engineer'
    full_name = db.Column(db.String(120), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    acknowledgements = db.relationship('AlertAcknowledgement', backref='user', lazy='dynamic')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'full_name': self.full_name,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Infrastructure(db.Model):
    __tablename__ = 'infrastructures'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    type = db.Column(db.String(64), default='Cable-Stayed Bridge', nullable=False)
    location = db.Column(db.String(120), nullable=False)
    length_m = db.Column(db.Float, default=188.6)
    spans = db.Column(db.Integer, default=3)
    construction_year = db.Column(db.Integer, default=2018)
    description = db.Column(db.Text)
    health_score = db.Column(db.Float, default=95.0, nullable=False)
    status = db.Column(db.String(20), default='healthy', nullable=False)  # 'healthy', 'warning', 'critical'
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    sensors = db.relationship('Sensor', backref='infrastructure', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'type': self.type,
            'location': self.location,
            'length_m': self.length_m,
            'spans': self.spans,
            'construction_year': self.construction_year,
            'description': self.description,
            'health_score': round(self.health_score, 1),
            'status': self.status,
            'sensor_count': self.sensors.count(),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Sensor(db.Model):
    __tablename__ = 'sensors'

    id = db.Column(db.Integer, primary_key=True)
    sensor_code = db.Column(db.String(32), unique=True, nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)
    type = db.Column(db.String(32), nullable=False)  # vibration, strain, temperature, humidity, tilt
    unit = db.Column(db.String(20), nullable=False)
    x_pos = db.Column(db.Float, nullable=False, default=0.0)
    y_pos = db.Column(db.Float, nullable=False, default=0.0)
    z_pos = db.Column(db.Float, nullable=False, default=0.0)
    physical_location = db.Column(db.String(120), nullable=False)
    
    # Thresholds
    min_threshold = db.Column(db.Float, nullable=False)
    max_threshold = db.Column(db.Float, nullable=False)
    warning_min = db.Column(db.Float, nullable=False)
    warning_max = db.Column(db.Float, nullable=False)
    critical_min = db.Column(db.Float, nullable=False)
    critical_max = db.Column(db.Float, nullable=False)

    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_simulated = db.Column(db.Boolean, default=False, nullable=False)
    source_channel = db.Column(db.String(64), nullable=False)
    infrastructure_id = db.Column(db.Integer, db.ForeignKey('infrastructures.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    readings = db.relationship('SensorReading', backref='sensor', lazy='dynamic', cascade='all, delete-orphan')
    alerts = db.relationship('Alert', backref='sensor', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        latest = self.readings.order_by(SensorReading.timestamp.desc()).first()
        return {
            'id': self.id,
            'sensor_code': self.sensor_code,
            'name': self.name,
            'type': self.type,
            'unit': self.unit,
            'coordinates': {'x': self.x_pos, 'y': self.y_pos, 'z': self.z_pos},
            'physical_location': self.physical_location,
            'thresholds': {
                'min': self.min_threshold,
                'max': self.max_threshold,
                'warning_min': self.warning_min,
                'warning_max': self.warning_max,
                'critical_min': self.critical_min,
                'critical_max': self.critical_max
            },
            'is_active': self.is_active,
            'is_simulated': self.is_simulated,
            'source_channel': self.source_channel,
            'infrastructure_id': self.infrastructure_id,
            'current_value': round(latest.value, 4) if latest else None,
            'current_quality': latest.quality_flag if latest else 'UNKNOWN',
            'last_reading_time': latest.timestamp.isoformat() if latest else None
        }


class SensorReading(db.Model):
    __tablename__ = 'sensor_readings'

    id = db.Column(db.Integer, primary_key=True)
    sensor_id = db.Column(db.Integer, db.ForeignKey('sensors.id'), nullable=False, index=True)
    timestamp = db.Column(db.DateTime, nullable=False, index=True)
    value = db.Column(db.Float, nullable=False)
    raw_value = db.Column(db.Float, nullable=True)
    is_simulated = db.Column(db.Boolean, default=False, nullable=False)
    quality_flag = db.Column(db.String(20), default='GOOD', nullable=False)  # GOOD, WARNING, CRITICAL, SUSPECT
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'sensor_id': self.sensor_id,
            'sensor_code': self.sensor.sensor_code if self.sensor else None,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'value': round(self.value, 4),
            'raw_value': round(self.raw_value, 4) if self.raw_value is not None else None,
            'is_simulated': self.is_simulated,
            'quality_flag': self.quality_flag
        }


class HistoricalDataset(db.Model):
    __tablename__ = 'historical_datasets'

    id = db.Column(db.Integer, primary_key=True)
    record_index = db.Column(db.Integer, nullable=False, index=True)
    original_timestamp = db.Column(db.String(64), nullable=False)
    feature_name = db.Column(db.String(64), nullable=False, index=True)
    value = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(20), nullable=True)
    is_real = db.Column(db.Boolean, default=True, nullable=False)
    scenario_label = db.Column(db.String(20), default='normal', nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'record_index': self.record_index,
            'original_timestamp': self.original_timestamp,
            'feature_name': self.feature_name,
            'value': self.value,
            'unit': self.unit,
            'is_real': self.is_real,
            'scenario_label': self.scenario_label
        }


class Alert(db.Model):
    __tablename__ = 'alerts'

    id = db.Column(db.Integer, primary_key=True)
    sensor_id = db.Column(db.Integer, db.ForeignKey('sensors.id'), nullable=False, index=True)
    alert_level = db.Column(db.String(20), nullable=False)  # 'warning' or 'critical'
    title = db.Column(db.String(120), nullable=False)
    message = db.Column(db.Text, nullable=False)
    value = db.Column(db.Float, nullable=False)
    threshold_triggered = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='active', nullable=False)  # 'active', 'acknowledged', 'resolved'
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    resolved_at = db.Column(db.DateTime, nullable=True)

    acknowledgements = db.relationship('AlertAcknowledgement', backref='alert', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        ack = self.acknowledgements.first()
        return {
            'id': self.id,
            'sensor_id': self.sensor_id,
            'sensor_code': self.sensor.sensor_code if self.sensor else None,
            'sensor_name': self.sensor.name if self.sensor else None,
            'sensor_type': self.sensor.type if self.sensor else None,
            'alert_level': self.alert_level,
            'title': self.title,
            'message': self.message,
            'value': round(self.value, 4),
            'threshold_triggered': round(self.threshold_triggered, 4),
            'unit': self.sensor.unit if self.sensor else '',
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'acknowledgement': ack.to_dict() if ack else None
        }


class AlertAcknowledgement(db.Model):
    __tablename__ = 'alert_acknowledgements'

    id = db.Column(db.Integer, primary_key=True)
    alert_id = db.Column(db.Integer, db.ForeignKey('alerts.id'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    notes = db.Column(db.Text, nullable=True)
    acknowledged_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'alert_id': self.alert_id,
            'user_id': self.user_id,
            'user_name': self.user.full_name if self.user else None,
            'notes': self.notes,
            'acknowledged_at': self.acknowledged_at.isoformat() if self.acknowledged_at else None
        }

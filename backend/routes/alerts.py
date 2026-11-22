"""
MobileTwin Alert Management and Acknowledgment Routes
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from models import db, Alert, AlertAcknowledgement, User

alerts_bp = Blueprint('alerts', __name__, url_prefix='/api/alerts')

@alerts_bp.route('', methods=['GET'])
def get_alerts():
    status = request.args.get('status')
    level = request.args.get('level')
    limit = int(request.args.get('limit', 50))

    query = Alert.query

    if status:
        query = query.filter(Alert.status == status)
    if level:
        query = query.filter(Alert.alert_level == level)

    alerts = query.order_by(Alert.created_at.desc()).limit(limit).all()

    return jsonify({
        'count': len(alerts),
        'alerts': [a.to_dict() for a in alerts]
    })

@alerts_bp.route('/summary', methods=['GET'])
def get_alert_summary():
    total_active = Alert.query.filter_by(status='active').count()
    critical_active = Alert.query.filter_by(status='active', alert_level='critical').count()
    warning_active = Alert.query.filter_by(status='active', alert_level='warning').count()
    acknowledged = Alert.query.filter_by(status='acknowledged').count()
    resolved = Alert.query.filter_by(status='resolved').count()

    return jsonify({
        'active_total': total_active,
        'active_critical': critical_active,
        'active_warning': warning_active,
        'acknowledged': acknowledged,
        'resolved': resolved
    })

@alerts_bp.route('/<int:alert_id>/acknowledge', methods=['POST'])
def acknowledge_alert(alert_id):
    alert = Alert.query.get_or_404(alert_id)
    data = request.get_json() or {}
    notes = data.get('notes', 'Acknowledged by monitoring engineer').strip()
    user_id = data.get('user_id')

    if not user_id:
        user = User.query.first()
        user_id = user.id if user else 1

    alert.status = 'acknowledged'

    ack = AlertAcknowledgement(
        alert_id=alert.id,
        user_id=user_id,
        notes=notes,
        acknowledged_at=datetime.utcnow()
    )
    db.session.add(ack)
    db.session.commit()

    return jsonify({
        'message': 'Alert acknowledged successfully',
        'alert': alert.to_dict()
    })

@alerts_bp.route('/<int:alert_id>/resolve', methods=['POST'])
def resolve_alert(alert_id):
    alert = Alert.query.get_or_404(alert_id)
    alert.status = 'resolved'
    alert.resolved_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        'message': 'Alert marked resolved',
        'alert': alert.to_dict()
    })

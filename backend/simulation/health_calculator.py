"""
MobileTwin Infrastructure Health Index (IHI) Calculator
Calculates a transparent composite health score (0 - 100) based on weighted sensor sub-indices:
- Vibration Dynamics (30%)
- Stay Cable Strain & Tension (25%)
- Pier Tilt & Displacement (20%)
- Thermal Gradient (15%)
- Environmental Exposure (10%)
"""

class HealthCalculator:
    WEIGHTS = {
        'vibration': 0.30,
        'strain': 0.25,
        'tilt': 0.20,
        'temperature': 0.15,
        'humidity': 0.10
    }

    @classmethod
    def calculate_component_score(cls, sensor, value):
        """
        Calculate an individual component health score (0 - 100).
        Deducts points based on proximity to and violation of warning/critical limits.
        """
        if sensor is None or value is None:
            return 100.0, "Nominal default"

        # Safe bounds
        w_min = sensor.warning_min
        w_max = sensor.warning_max
        c_min = sensor.critical_min
        c_max = sensor.critical_max

        # Nominal safe zone
        if w_min <= value <= w_max:
            return 100.0, "Within optimal design envelope"

        # Warning zone upper
        if w_max < value < c_max:
            ratio = (value - w_max) / (c_max - w_max + 1e-6)
            score = 100.0 - (ratio * 30.0)  # 100 -> 70
            return max(65.0, round(score, 1)), f"Elevated above warning threshold (+{(value - w_max):.3f})"

        # Warning zone lower
        if c_min < value < w_min:
            ratio = (w_min - value) / (w_min - c_min + 1e-6)
            score = 100.0 - (ratio * 30.0)
            return max(65.0, round(score, 1)), f"Depressed below warning threshold (-{(w_min - value):.3f})"

        # Critical zone upper
        if value >= c_max:
            excess = value - c_max
            score = 65.0 - min(45.0, excess * 25.0)
            return max(15.0, round(score, 1)), f"Critical threshold violation ({value:.3f} >= {c_max:.3f})"

        # Critical zone lower
        if value <= c_min:
            deficit = c_min - value
            score = 65.0 - min(45.0, deficit * 25.0)
            return max(15.0, round(score, 1)), f"Critical deficit violation ({value:.3f} <= {c_min:.3f})"

        return 95.0, "Nominal"

    @classmethod
    def calculate_overall_health(cls, sensors_with_values):
        """
        Calculates composite bridge health index.
        sensors_with_values: dict { sensor_obj: current_value }
        Returns: {
            'overall_score': float (0-100),
            'status': 'healthy' | 'warning' | 'critical',
            'components': { 'vibration': {...}, ... },
            'deduction_summary': list of str,
            'disclaimer': str
        }
        """
        component_scores = {}
        component_details = {}
        deductions = []

        # Group sensors by category
        by_type = {}
        for sensor, val in sensors_with_values.items():
            t = sensor.type
            if t not in by_type:
                by_type[t] = []
            by_type[t].append((sensor, val))

        for category, weight in cls.WEIGHTS.items():
            sensors_in_cat = by_type.get(category, [])
            if not sensors_in_cat:
                component_scores[category] = 100.0
                component_details[category] = {
                    'score': 100.0,
                    'status': 'healthy',
                    'weight': weight,
                    'explanation': 'No active sensor channels in group'
                }
                continue

            # Average score across sensors of same category
            cat_scores = []
            for s, val in sensors_in_cat:
                s_score, s_expl = cls.calculate_component_score(s, val)
                cat_scores.append(s_score)
                if s_score < 85.0:
                    deductions.append(f"{s.name} ({s.sensor_code}): {s_expl} [Score: {s_score}]")

            avg_cat_score = sum(cat_scores) / len(cat_scores)
            cat_status = 'healthy' if avg_cat_score >= 85.0 else ('warning' if avg_cat_score >= 65.0 else 'critical')

            component_scores[category] = avg_cat_score
            component_details[category] = {
                'score': round(avg_cat_score, 1),
                'status': cat_status,
                'weight': weight,
                'sensor_count': len(sensors_in_cat)
            }

        # Weighted aggregate
        total_score = sum(component_scores[cat] * cls.WEIGHTS[cat] for cat in cls.WEIGHTS)
        total_score = round(max(0.0, min(100.0, total_score)), 1)

        if total_score >= 85.0:
            overall_status = 'healthy'
        elif total_score >= 65.0:
            overall_status = 'warning'
        else:
            overall_status = 'critical'

        return {
            'overall_score': total_score,
            'status': overall_status,
            'components': component_details,
            'deduction_summary': deductions if deductions else ["All structural sensor parameters within nominal design limits."],
            'disclaimer': "Notice: Structural Health Index is calculated for computational digital twin demonstration and decision support only. It does not establish or replace physical structural safety engineering inspection or certification."
        }

"""
Route Optimizer — Pure Optimal vs UX-First (Hick's Law Heuristic)
Python Reference Implementation for JAIN University B.Tech Experiential Learning Project
Author: Ameya

Hick's Law & Cognitive Ergonomics:
T_decision = b * log2(n + 1)
Under panic conditions, each decision point / turn adds non-linear latency and wrong-turn probability.
The threshold rule ensures we only select a complex 'optimal' route if it beats the simple route by > T%.
"""

from typing import List, Dict, Any, Optional

class RouteOptimizer:
    def __init__(self, threshold_percent: float = 15.0):
        self.threshold_percent = float(threshold_percent)

    def evaluate_routes(
        self,
        origin_zone_id: str,
        hazard_zone_id: str,
        zones: List[Dict[str, Any]],
        exits: List[Dict[str, Any]],
        paths: List[Dict[str, Any]],
        affected_occupancy: int = 45,
        threshold_override: Optional[float] = None
    ) -> Dict[str, Any]:
        threshold = self.threshold_percent if threshold_override is None else float(threshold_override)
        walk_speed = 1.2  # meters per second
        turn_penalty = 3.2  # seconds per turn under stress

        # Safe exits (not inside hazard zone)
        safe_exits = [e for e in exits if e.get('zone_id') != hazard_zone_id and e.get('status') != 'blocked']
        safe_exit_ids = {e['id'] for e in safe_exits}

        # Filter candidate paths avoiding the hazard zone
        usable_paths = [
            p for p in paths
            if p.get('origin') == origin_zone_id
            and hazard_zone_id not in p.get('zone_sequence', [])
            and p.get('exit_id') in safe_exit_ids
        ]

        if not usable_paths:
            # Detour fallback
            usable_paths = [p for p in paths if p.get('origin') == origin_zone_id and p.get('exit_id') in safe_exit_ids]

        if not usable_paths:
            return {
                'selected_strategy': 'none',
                'rationale': 'No safe route found to uncompromised exits.'
            }

        scored_paths = []
        for p in usable_paths:
            exit_obj = next((e for e in exits if e['id'] == p['exit_id']), {'name': 'Exit', 'max_flow_rate': 20})
            flow_rate = max(5, int(exit_obj.get('max_flow_rate', 20)))
            
            travel_time = p['distance_meters'] / walk_speed
            queue_time = affected_occupancy / flow_rate
            theoretical_time = round(travel_time + queue_time, 1)
            
            # Hick's Law cognitive load score (1 to 10 scale)
            cog_load = min(10.0, round(1.5 + (p['turns'] * 1.8) + (0 if p.get('is_intuitive', True) else 2.5), 1))
            stress_time = round(travel_time + queue_time + (p['turns'] * turn_penalty), 1)

            scored = dict(p)
            scored.update({
                'exit_name': exit_obj.get('name'),
                'theoretical_time': theoretical_time,
                'stress_adjusted_time': stress_time,
                'cognitive_load_index': cog_load
            })
            scored_paths.append(scored)

        optimal_candidate = min(scored_paths, key=lambda x: x['theoretical_time'])
        ux_candidate = min(scored_paths, key=lambda x: (x['turns'], x['cognitive_load_index'], x['stress_adjusted_time']))

        time_saved = max(0.0, ux_candidate['theoretical_time'] - optimal_candidate['theoretical_time'])
        speedup_percent = round((time_saved / ux_candidate['theoretical_time'] * 100), 1) if ux_candidate['theoretical_time'] > 0 else 0.0

        if optimal_candidate['id'] == ux_candidate['id']:
            selected = 'ux-first'
            chosen = ux_candidate
            rationale = f"Optimal and UX-First agree on the safest route ({ux_candidate['turns']} turns, {ux_candidate['theoretical_time']}s)."
        elif speedup_percent > threshold:
            selected = 'optimal'
            chosen = optimal_candidate
            rationale = f"Optimal route chosen: saves {time_saved}s ({speedup_percent}% faster), exceeding threshold of {threshold}%."
        else:
            selected = 'ux-first'
            chosen = ux_candidate
            rationale = f"UX-First route chosen: saves {optimal_candidate['turns'] - ux_candidate['turns']} turn(s) with lower cognitive load ({ux_candidate['cognitive_load_index']}/10 vs {optimal_candidate['cognitive_load_index']}/10). Optimal speedup of {speedup_percent}% does not beat the {threshold}% threshold."

        return {
            'selected_strategy': selected,
            'threshold': threshold,
            'speedup_percent': speedup_percent,
            'time_saved': time_saved,
            'rationale': rationale,
            'recommended_route': chosen,
            'optimal_route': optimal_candidate,
            'ux_first_route': ux_candidate
        }

if __name__ == '__main__':
    optimizer = RouteOptimizer(threshold_percent=15.0)
    print("RouteOptimizer Python Reference Engine loaded.")

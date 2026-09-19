"""
Principle of Inclusion–Exclusion (PIE) Engine (Python Reference Implementation)
For Experiential Learning Project — B.Tech CSE (AI-Driven DevOps), JAIN University
Author: Ameya

Mathematical Formulation:
For n sets A_1, A_2, ..., A_n:
|⋃_{i=1}^n A_i| = ∑_{k=1}^n (-1)^{k-1} ∑_{1 ≤ i_1 < ... < i_k ≤ n} |⋂_{j=1}^k A_{i_j}|
"""

from itertools import combinations
from typing import List, Dict, Any

class PIECalculator:
    @staticmethod
    def get_overlap_occupancy(subset: tuple, overlaps: List[Dict[str, Any]]) -> int:
        """Find shared occupancy for an exact subset of zone IDs."""
        sorted_subset = sorted(list(subset))
        for o in overlaps:
            sorted_o = sorted(o.get('zone_ids', []))
            if sorted_o == sorted_subset:
                return int(o.get('shared_occupancy', 0))
        return 0

    @classmethod
    def calculate(cls, zones: List[Dict[str, Any]], overlaps: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Compute true evacuation occupancy using the Principle of Inclusion-Exclusion.
        
        Args:
            zones: List of zone dictionaries [{'id': 'zone_a', 'name': 'Lab A', 'current_occupancy': 40}, ...]
            overlaps: List of overlaps [{'id': 'ov_1', 'zone_ids': ['zone_a', 'zone_b'], 'shared_occupancy': 15}, ...]
            
        Returns:
            Dictionary with rawSum, correctedOccupancy, overcountingError, and breakdown.
        """
        if not zones:
            return {
                'raw_sum': 0,
                'corrected_occupancy': 0,
                'overcounting_error': 0,
                'error_percentage': 0.0,
                'formula': 'Total = 0'
            }

        if overlaps is None:
            overlaps = []

        zone_map = {z['id']: z for z in zones}
        zone_ids = [z['id'] for z in zones]
        n = len(zones)

        # 1. Level 1: Individual sets (Raw Sum)
        raw_sum = sum(int(z.get('current_occupancy', 0)) for z in zones)
        corrected_occupancy = raw_sum

        formula_parts = [" + ".join(f"|{z.get('name', z['id'])}|" for z in zones)]
        level_details = []

        # 2. Levels 2 through n: Alternating intersections
        for k in range(2, n + 1):
            sign = (-1) ** (k - 1)
            sign_str = '+' if sign > 0 else '−'
            combos = list(combinations(zone_ids, k))
            level_items = []
            level_total = 0

            for combo in combos:
                shared = cls.get_overlap_occupancy(combo, overlaps)
                if shared > 0:
                    names = [zone_map[zid].get('name', zid) for zid in combo]
                    label = f"|{' ∩ '.join(names)}|"
                    level_total += shared
                    level_items.append((label, shared))

            if level_items:
                corrected_occupancy += sign * level_total
                joined_labels = " + ".join(f"{lbl}" for lbl, _ in level_items)
                formula_parts.append(f"{sign_str} ({joined_labels})")
                level_details.append({
                    'k': k,
                    'sign': sign_str,
                    'total': level_total,
                    'items': level_items
                })

        corrected_occupancy = max(0, corrected_occupancy)
        overcounting_error = raw_sum - corrected_occupancy
        error_percentage = round((overcounting_error / raw_sum * 100), 1) if raw_sum > 0 else 0.0

        return {
            'raw_sum': raw_sum,
            'corrected_occupancy': corrected_occupancy,
            'overcounting_error': overcounting_error,
            'error_percentage': error_percentage,
            'formula': " ".join(formula_parts),
            'level_details': level_details
        }

if __name__ == '__main__':
    # Demonstration / Unit Verification
    test_zones = [
        {'id': 'A', 'name': 'Room A', 'current_occupancy': 50},
        {'id': 'B', 'name': 'Room B', 'current_occupancy': 40},
        {'id': 'C', 'name': 'Corridor C', 'current_occupancy': 35}
    ]
    test_overlaps = [
        {'zone_ids': ['A', 'B'], 'shared_occupancy': 15},
        {'zone_ids': ['A', 'C'], 'shared_occupancy': 10},
        {'zone_ids': ['B', 'C'], 'shared_occupancy': 12},
        {'zone_ids': ['A', 'B', 'C'], 'shared_occupancy': 5}
    ]
    result = PIECalculator.calculate(test_zones, test_overlaps)
    print("--- Principle of Inclusion-Exclusion Verification ---")
    print(f"Raw Sum: {result['raw_sum']}")
    print(f"PIE Corrected: {result['corrected_occupancy']} (Expected: 93)")
    print(f"Overcounting Prevented: {result['overcounting_error']} ({result['error_percentage']}%)")
    print(f"Formula: {result['formula']}")

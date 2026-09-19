/**
 * Principle of Inclusion–Exclusion (PIE) Engine
 * 
 * Mathematical Formulation:
 * For n sets A_1, A_2, ..., A_n:
 * |⋃_{i=1}^n A_i| = ∑_{k=1}^n (-1)^{k-1} ∑_{1 ≤ i_1 < ... < i_k ≤ n} |⋂_{j=1}^k A_{i_j}|
 * 
 * For 2 zones: |A ∪ B| = |A| + |B| - |A ∩ B|
 * For 3 zones: |A ∪ B ∪ C| = |A| + |B| + |C| - (|A ∩ B| + |A ∩ C| + |B ∩ C|) + |A ∩ B ∩ C|
 */

class PIECalculator {
  /**
   * Helper to generate all combinations of array elements of length k
   */
  static getCombinations(arr, k) {
    if (k === 0) return [[]];
    if (arr.length === 0) return [];
    const head = arr[0];
    const tail = arr.slice(1);
    const withHead = PIECalculator.getCombinations(tail, k - 1).map(c => [head, ...c]);
    const withoutHead = PIECalculator.getCombinations(tail, k);
    return [...withHead, ...withoutHead];
  }

  /**
   * Look up shared occupancy for a given subset of zone IDs from overlaps definition.
   * @param {string[]} subset - array of zone IDs e.g. ['zone_a', 'zone_b']
   * @param {Array} overlaps - list of overlap objects { id, zone_ids: [...], shared_occupancy }
   * @returns {number} shared occupancy
   */
  static getOverlapOccupancy(subset, overlaps) {
    if (subset.length < 2) return 0;
    const sortedSubset = [...subset].sort();
    
    // Find overlap matching exactly this subset
    const match = overlaps.find(o => {
      const sortedO = [...o.zone_ids].sort();
      return (
        sortedO.length === sortedSubset.length &&
        sortedO.every((id, idx) => id === sortedSubset[idx])
      );
    });

    return match ? (match.shared_occupancy || 0) : 0;
  }

  /**
   * Compute true occupancy across given zones using PIE
   * @param {Array} zones - array of zone objects { id, name, current_occupancy, ... }
   * @param {Array} overlaps - array of overlap objects { id, zone_ids, shared_occupancy }
   * @returns {Object} Full breakdown of calculation, terms, raw sum, corrected occupancy, and error
   */
  static calculate(zones, overlaps = []) {
    if (!zones || zones.length === 0) {
      return {
        rawSum: 0,
        correctedOccupancy: 0,
        overcountingError: 0,
        errorPercentage: 0,
        terms: [],
        stepByStepFormula: "Total = 0",
        breakdownHtml: "No active zones selected.",
        setSizes: {},
        intersections: []
      };
    }

    const n = zones.length;
    const zoneMap = new Map(zones.map(z => [z.id, z]));
    const zoneIds = zones.map(z => z.id);

    // 1. Raw sum (Level 1 terms)
    let rawSum = 0;
    const level1Terms = [];
    const setSizes = {};

    zones.forEach(z => {
      const count = Number(z.current_occupancy) || 0;
      rawSum += count;
      setSizes[z.id] = { name: z.name, count };
      level1Terms.push({
        zoneId: z.id,
        name: z.name,
        count
      });
    });

    // 2. Inclusion-Exclusion general expansion
    let correctedOccupancy = 0;
    const termsByLevel = [];
    const intersections = [];
    const formulaParts = [];

    // Level 1: Individual Sets (k=1, positive)
    let level1Total = rawSum;
    correctedOccupancy += level1Total;
    termsByLevel.push({
      k: 1,
      sign: '+',
      title: "Individual Zone Occupancies (Raw Sum)",
      subtotal: level1Total,
      items: level1Terms.map(t => `|${t.name}| = ${t.count}`)
    });
    formulaParts.push(level1Terms.map(t => `|${t.name}|`).join(' + '));

    // Levels 2 to n: Intersections
    let totalSubtracted = 0;
    let totalAddedBack = 0;

    for (let k = 2; k <= n; k++) {
      const combinations = PIECalculator.getCombinations(zoneIds, k);
      const sign = (k % 2 === 1) ? '+' : '−';
      let levelTotal = 0;
      const levelItems = [];

      combinations.forEach(combo => {
        const shared = PIECalculator.getOverlapOccupancy(combo, overlaps);
        if (shared > 0) {
          const names = combo.map(id => zoneMap.get(id)?.name || id);
          const termLabel = `|${names.join(' ∩ ')}|`;
          levelTotal += shared;
          levelItems.push({
            zones: combo,
            names,
            label: termLabel,
            count: shared
          });

          intersections.push({
            k,
            zones: combo,
            names,
            label: termLabel,
            count: shared,
            sign
          });
        }
      });

      if (levelItems.length > 0) {
        if (sign === '−') {
          correctedOccupancy -= levelTotal;
          totalSubtracted += levelTotal;
          formulaParts.push(`− (${levelItems.map(item => item.label).join(' + ')})`);
        } else {
          correctedOccupancy += levelTotal;
          totalAddedBack += levelTotal;
          formulaParts.push(`+ (${levelItems.map(item => item.label).join(' + ')})`);
        }

        termsByLevel.push({
          k,
          sign,
          title: k === 2 
            ? "Pairwise Overlaps (Subtracted to eliminate double-counting)" 
            : `${k}-Way Overlaps (Added back to correct over-subtraction)`,
          subtotal: levelTotal,
          items: levelItems.map(item => `${item.label} = ${item.count}`)
        });
      }
    }

    // Guard against negative occupancy from synthetic bad test inputs
    correctedOccupancy = Math.max(0, correctedOccupancy);

    const overcountingError = rawSum - correctedOccupancy;
    const errorPercentage = rawSum > 0 
      ? Number(((overcountingError / rawSum) * 100).toFixed(1)) 
      : 0;

    const stepByStepFormula = formulaParts.join(' ');

    return {
      rawSum,
      correctedOccupancy,
      overcountingError,
      errorPercentage,
      totalSubtracted,
      totalAddedBack,
      termsByLevel,
      intersections,
      stepByStepFormula,
      setSizes
    };
  }
}

module.exports = PIECalculator;

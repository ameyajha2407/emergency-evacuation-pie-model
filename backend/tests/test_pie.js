/**
 * Mathematical Verification Tests for PIE & Route Optimizer
 * Ensures complete formula:
 * |A ∪ B ∪ C| = |A| + |B| + |C| − |A∩B| − |A∩C| − |B∩C| + |A∩B∩C|
 * and verifies all 3 system scenarios.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const PIECalculator = require('../engine/pie_calculator');
const RouteOptimizer = require('../engine/route_optimizer');
const buildingModel = require('../models/building_model');

console.log('=== RUNNING MATHEMATICAL UNIT TESTS ===\n');

// ----------------------------------------------------
// TEST 1: Two Overlapping Zones (Pairwise Correction)
// ----------------------------------------------------
{
  console.log('Test 1: Two Overlapping Zones (Room A + Shared Corridor C)');
  const zones = [
    { id: 'zone_a', name: 'Computer Lab A', current_occupancy: 45 },
    { id: 'zone_c', name: 'Corridor C', current_occupancy: 35 }
  ];
  const overlaps = [
    { id: 'ov_ac', zone_ids: ['zone_a', 'zone_c'], shared_occupancy: 14 }
  ];

  const res = PIECalculator.calculate(zones, overlaps);

  console.log(`  Raw Sum: ${res.rawSum}`);
  console.log(`  PIE Corrected: ${res.correctedOccupancy}`);
  console.log(`  Overcounting Prevented: ${res.overcountingError} (${res.errorPercentage}%)`);

  assert.strictEqual(res.rawSum, 80, 'Raw sum should be 45 + 35 = 80');
  assert.strictEqual(res.correctedOccupancy, 66, 'PIE corrected should be 45 + 35 - 14 = 66');
  assert.strictEqual(res.overcountingError, 14, 'Error should be 14');
  console.log('  -> PASS: 2-zone worked example verified (45 + 35 - 14 = 66).\n');
}

// ----------------------------------------------------
// TEST 2: Complete 3-Set PIE Formula (Pairwise + Triple)
// |A ∪ B ∪ C| = |A| + |B| + |C| − |A∩B| − |A∩C| − |B∩C| + |A∩B∩C|
// ----------------------------------------------------
{
  console.log('Test 2: Complete 3-Set PIE Formula (|A∪B∪C| = |A|+|B|+|C| − |A∩B| − |A∩C| − |B∩C| + |A∩B∩C|)');
  const zones = [
    { id: 'zone_a', name: 'Lab A', current_occupancy: 50 },
    { id: 'zone_b', name: 'Hall B', current_occupancy: 42 },
    { id: 'zone_c', name: 'Corridor C', current_occupancy: 30 }
  ];
  const overlaps = [
    { id: 'ov_ab', zone_ids: ['zone_a', 'zone_b'], shared_occupancy: 6 },
    { id: 'ov_ac', zone_ids: ['zone_a', 'zone_c'], shared_occupancy: 14 },
    { id: 'ov_bc', zone_ids: ['zone_b', 'zone_c'], shared_occupancy: 12 },
    { id: 'ov_abc', zone_ids: ['zone_a', 'zone_b', 'zone_c'], shared_occupancy: 5 }
  ];

  // Mathematical integrity checks:
  // Triple intersection |A∩B∩C| must be <= each pairwise intersection:
  assert.ok(5 <= 6, '|A∩B∩C| must be <= |A∩B|');
  assert.ok(5 <= 14, '|A∩B∩C| must be <= |A∩C|');
  assert.ok(5 <= 12, '|A∩B∩C| must be <= |B∩C|');

  const res = PIECalculator.calculate(zones, overlaps);

  console.log(`  Raw Sum: ${res.rawSum}`);
  console.log(`  PIE Corrected: ${res.correctedOccupancy}`);
  console.log(`  Formula: ${res.stepByStepFormula}`);
  console.log(`  Overcounting Prevented: ${res.overcountingError} (${res.errorPercentage}%)`);

  // |A ∪ B ∪ C| = 50 + 42 + 30 - 6 - 14 - 12 + 5 = 122 - 32 + 5 = 95
  assert.strictEqual(res.rawSum, 122, 'Raw sum should be 122');
  assert.strictEqual(res.correctedOccupancy, 95, 'PIE corrected should be 95');
  assert.strictEqual(res.overcountingError, 27, 'Overcounting error should be 27');
  assert.strictEqual(res.errorPercentage, 22.1, 'Error percentage should be 22.1%');
  console.log('  -> PASS: Complete 3-set PIE formula verified.\n');
}

// ----------------------------------------------------
// TEST 3: Disjoint Zones (Zero Overlap)
// ----------------------------------------------------
{
  console.log('Test 3: Disjoint Zones (Zero Overlap)');
  const zones = [
    { id: 'zone_1', name: 'Isolated Room 1', current_occupancy: 25 },
    { id: 'zone_2', name: 'Isolated Room 2', current_occupancy: 35 }
  ];
  const overlaps = [];

  const res = PIECalculator.calculate(zones, overlaps);

  assert.strictEqual(res.rawSum, 60);
  assert.strictEqual(res.correctedOccupancy, 60);
  assert.strictEqual(res.overcountingError, 0);
  console.log('  -> PASS: Disjoint sets correctly yield exact sum with zero error.\n');
}

// ----------------------------------------------------
// TEST 4: Scenario 1 Real Building Model Verification
// ----------------------------------------------------
{
  console.log('Test 4: Scenario 1 Real Building Model (Corridor Smoke - All 5 Zones)');
  buildingModel.loadInitialState();
  const sim = buildingModel.loadScenario('scenario_corridor_smoke');

  console.log(`  Raw Sum: ${sim.pie.rawSum}`);
  console.log(`  PIE Corrected: ${sim.pie.correctedOccupancy}`);
  console.log(`  Overcounting: ${sim.pie.overcountingError} (${sim.pie.errorPercentage}%)`);

  // Sum = 45+40+35+30+50 = 200
  // Level 2 subtracted = 6 + 14 + 12 + 9 + 5 + 15 = 61
  // Level 3 added back = 5 + 4 = 9
  // Corrected = 200 - 61 + 9 = 148
  assert.strictEqual(sim.pie.rawSum, 200, 'Scenario 1 raw sum must be 200');
  assert.strictEqual(sim.pie.correctedOccupancy, 148, 'Scenario 1 corrected must be 148');
  assert.strictEqual(sim.pie.overcountingError, 52, 'Scenario 1 overcount must be 52');
  assert.strictEqual(sim.pie.errorPercentage, 26.0, 'Scenario 1 error % must be 26.0%');

  // Verify exit loads reflect PIE corrected value
  const activeExit = buildingModel.exits.find(e => e.id === sim.routing.recommendedRoute.exitId);
  assert.strictEqual(activeExit.current_load, 148, 'Exit load must equal PIE corrected count');
  assert.strictEqual(activeExit.naive_load, 200, 'Exit naive load must equal raw sum');
  console.log('  -> PASS: Scenario 1 verified with 148 true evacuees and 26% overcount.\n');
}

// ----------------------------------------------------
// TEST 5: Scenario 2 Real Building Model Verification
// ----------------------------------------------------
{
  console.log('Test 5: Scenario 2 Real Building Model (Lab A Fire - 3 Zones: A, B, C)');
  buildingModel.loadInitialState();
  const sim = buildingModel.loadScenario('scenario_north_bottleneck');

  console.log(`  Raw Sum: ${sim.pie.rawSum}`);
  console.log(`  PIE Corrected: ${sim.pie.correctedOccupancy}`);
  console.log(`  Overcounting: ${sim.pie.overcountingError} (${sim.pie.errorPercentage}%)`);

  // Sum = 50 + 42 + 30 = 122
  // Subtracted = 6 + 14 + 12 = 32
  // Added back = 5
  // Corrected = 122 - 32 + 5 = 95
  assert.strictEqual(sim.pie.rawSum, 122, 'Scenario 2 raw sum must be 122');
  assert.strictEqual(sim.pie.correctedOccupancy, 95, 'Scenario 2 corrected must be 95');
  assert.strictEqual(sim.pie.overcountingError, 27, 'Scenario 2 overcount must be 27');
  assert.strictEqual(sim.pie.errorPercentage, 22.1, 'Scenario 2 error % must be 22.1%');
  console.log('  -> PASS: Scenario 2 verified with 95 true evacuees and 22.1% overcount.\n');
}

// ----------------------------------------------------
// TEST 6: Scenario 3 Real Building Model Verification & Threshold Switching
// ----------------------------------------------------
{
  console.log('Test 6: Scenario 3 Real Building Model (Auditorium E - 3 Zones: C, D, E)');
  buildingModel.loadInitialState();
  const sim = buildingModel.loadScenario('scenario_hicks_law');

  console.log(`  Raw Sum: ${sim.pie.rawSum}`);
  console.log(`  PIE Corrected: ${sim.pie.correctedOccupancy}`);
  console.log(`  Overcounting: ${sim.pie.overcountingError} (${sim.pie.errorPercentage}%)`);

  // Sum = 20 + 35 + 70 = 125
  // Subtracted = 9 + 5 + 15 = 29
  // Added back = 4
  // Corrected = 125 - 29 + 4 = 100
  assert.strictEqual(sim.pie.rawSum, 125, 'Scenario 3 raw sum must be 125');
  assert.strictEqual(sim.pie.correctedOccupancy, 100, 'Scenario 3 corrected must be 100');
  assert.strictEqual(sim.pie.overcountingError, 25, 'Scenario 3 overcount must be 25');
  assert.strictEqual(sim.pie.errorPercentage, 20.0, 'Scenario 3 error % must be 20.0%');

  // Verify speedup and threshold switching
  const routing = sim.routing;
  console.log(`  Optimal theoretical time: ${routing.optimalRoute.theoreticalTime} s (${routing.optimalRoute.turns} turns)`);
  console.log(`  UX-First theoretical time: ${routing.uxFirstRoute.theoreticalTime} s (${routing.uxFirstRoute.turns} turns)`);
  console.log(`  Time saved: ${routing.timeSaved} s`);
  console.log(`  Speedup percent: ${routing.speedupPercent}%`);
  console.log(`  At default 15% threshold: strategy = ${routing.selectedStrategy}`);

  assert.strictEqual(routing.speedupPercent, 8.2, 'Speedup must be exactly 8.2%');
  assert.strictEqual(routing.timeSaved, 2.3, 'Time saved must be 2.3 s');
  assert.strictEqual(routing.selectedStrategy, 'ux-first', 'At 15% threshold, UX-First must be chosen');

  // Change threshold below 8.2% (e.g. 8%)
  buildingModel.setThreshold(8);
  const switchedSim = buildingModel.latestSimulation;
  console.log(`  At 8% threshold: strategy = ${switchedSim.routing.selectedStrategy}`);
  assert.strictEqual(switchedSim.routing.selectedStrategy, 'optimal', 'Below 8.2% threshold (8%), Optimal must be chosen');

  // Reset threshold back to 15%
  buildingModel.setThreshold(15);
  const restoredSim = buildingModel.latestSimulation;
  console.log('  -> PASS: Scenario 3 verified with 8.2% speed advantage and threshold switching.\n');
}

// ----------------------------------------------------
// TEST 7: Structural Data Integrity & Deduplication Audit
// ----------------------------------------------------
{
  console.log('Test 7: Structural Data Integrity & Deduplication Audit');
  buildingModel.loadInitialState();

  // 1. Check unique zone IDs
  const zoneIds = buildingModel.zones.map(z => z.id);
  const uniqueZoneIds = new Set(zoneIds);
  assert.strictEqual(zoneIds.length, uniqueZoneIds.size, 'All zone IDs in layout must be strictly unique');

  // 2. Check unique overlap IDs
  const overlapIds = buildingModel.overlaps.map(o => o.id);
  const uniqueOverlapIds = new Set(overlapIds);
  assert.strictEqual(overlapIds.length, uniqueOverlapIds.size, 'All overlap IDs in layout must be strictly unique');

  // 3. Check for duplicate overlap subsets (e.g. ['A', 'B'] vs ['B', 'A'])
  const normalizedSubsets = buildingModel.overlaps.map(o => [...o.zone_ids].sort().join(':'));
  const uniqueSubsets = new Set(normalizedSubsets);
  assert.strictEqual(normalizedSubsets.length, uniqueSubsets.size, 'No duplicate overlap subsets allowed');

  // 4. Mathematical subset boundedness: for every 3-way overlap, all 3 pairwise overlaps must exist and be >= triple
  const triples = buildingModel.overlaps.filter(o => o.zone_ids.length === 3);
  triples.forEach(triple => {
    const [z1, z2, z3] = triple.zone_ids;
    const pairs = [
      [z1, z2],
      [z1, z3],
      [z2, z3]
    ];
    pairs.forEach(pair => {
      const pairKey = [...pair].sort().join(':');
      const foundPair = buildingModel.overlaps.find(o => [...o.zone_ids].sort().join(':') === pairKey);
      assert.ok(foundPair, `Pairwise overlap ${pairKey} must exist for triple overlap ${triple.id}`);
      assert.ok(
        foundPair.shared_occupancy >= triple.shared_occupancy,
        `Pairwise ${pairKey} occupancy (${foundPair.shared_occupancy}) must be >= triple (${triple.shared_occupancy})`
      );
    });
  });

  // 5. Check all scenario presets
  buildingModel.scenarios.forEach(sc => {
    const scKeys = Object.keys(sc.occupancyOverrides || {});
    const uniqueScKeys = new Set(scKeys);
    assert.strictEqual(scKeys.length, uniqueScKeys.size, `Scenario ${sc.id} has duplicate occupancy override keys`);
    scKeys.forEach(k => {
      assert.ok(uniqueZoneIds.has(k), `Scenario ${sc.id} overrides non-existent zone ${k}`);
    });
  });

  console.log('  -> PASS: All zones, overlaps, and scenarios verified strictly unique and bounded.\n');
}

console.log('=== ALL 7 MATHEMATICAL SUITES PASSED SUCCESSFULLY ===');


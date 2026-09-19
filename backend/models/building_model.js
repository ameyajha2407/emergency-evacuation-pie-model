const fs = require('fs');
const path = require('path');
const PIECalculator = require('../engine/pie_calculator');
const RouteOptimizer = require('../engine/route_optimizer');

class BuildingModel {
  constructor() {
    this.dataPath = path.join(__dirname, '../data/default_layout.json');
    this.optimizer = new RouteOptimizer(15);
    this.logs = [];
    this.loadInitialState();
  }

  loadInitialState() {
    const raw = fs.readFileSync(this.dataPath, 'utf-8');
    const data = JSON.parse(raw);
    this.building = data.building;
    this.zones = JSON.parse(JSON.stringify(data.zones));
    this.overlaps = JSON.parse(JSON.stringify(data.overlaps));
    this.exits = JSON.parse(JSON.stringify(data.exits));
    this.paths = JSON.parse(JSON.stringify(data.paths));
    this.scenarios = JSON.parse(JSON.stringify(data.scenarios));
    this.activeHazard = null;
    this.activeOriginZoneId = this.zones[0].id;
    this.latestSimulation = null;
    this.addLog('SYSTEM_INIT', 'Building model initialized with default layout.');
  }

  addLog(action, details, relatedIncident = null) {
    const entry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString(),
      action,
      details,
      relatedIncident
    };
    this.logs.unshift(entry);
    if (this.logs.length > 50) this.logs.pop();
    return entry;
  }

  getModel() {
    return {
      building: this.building,
      zones: this.zones,
      overlaps: this.overlaps,
      exits: this.exits,
      paths: this.paths,
      scenarios: this.scenarios,
      activeHazard: this.activeHazard,
      activeOriginZoneId: this.activeOriginZoneId,
      thresholdPercent: this.optimizer.thresholdPercent,
      latestSimulation: this.latestSimulation,
      logs: this.logs
    };
  }

  setThreshold(thresholdPercent) {
    const updated = this.optimizer.setThreshold(thresholdPercent);
    this.addLog('THRESHOLD_UPDATE', `Optimality threshold updated to ${updated}%`);
    // If a simulation is active, re-evaluate routes with new threshold
    if (this.activeHazard) {
      this.runSimulation({
        hazardZoneId: this.activeHazard.zoneId,
        originZoneId: this.activeOriginZoneId,
        severity: this.activeHazard.severity
      });
    }
    return updated;
  }

  updateZoneOccupancy(zoneId, newOccupancy) {
    const zone = this.zones.find(z => z.id === zoneId);
    if (!zone) throw new Error(`Zone ${zoneId} not found`);
    const prev = zone.current_occupancy;
    zone.current_occupancy = Math.max(0, parseInt(newOccupancy, 10) || 0);
    this.addLog('ZONE_OCCUPANCY_UPDATE', `${zone.name} occupancy adjusted from ${prev} to ${zone.current_occupancy}`);
    if (this.activeHazard) {
      this.runSimulation({
        hazardZoneId: this.activeHazard.zoneId,
        originZoneId: this.activeOriginZoneId,
        severity: this.activeHazard.severity
      });
    }
    return zone;
  }

  loadScenario(scenarioId) {
    const sc = this.scenarios.find(s => s.id === scenarioId);
    if (!sc) throw new Error(`Scenario ${scenarioId} not found`);

    // Reset zone occupancies to defaults or scenario overrides
    if (sc.occupancyOverrides) {
      this.zones.forEach(z => {
        if (sc.occupancyOverrides[z.id] !== undefined) {
          z.current_occupancy = sc.occupancyOverrides[z.id];
        }
      });
    }

    if (sc.defaultThreshold !== undefined) {
      this.optimizer.setThreshold(sc.defaultThreshold);
    }

    this.activeOriginZoneId = sc.originZoneId || this.zones[0].id;
    this.addLog('SCENARIO_LOADED', `Loaded scenario: "${sc.title}"`);

    return this.runSimulation({
      hazardZoneId: sc.hazardZoneId,
      originZoneId: this.activeOriginZoneId,
      severity: sc.severity || 'critical'
    });
  }

  runSimulation({ hazardZoneId, originZoneId, severity = 'critical' }) {
    const hazardZone = this.zones.find(z => z.id === hazardZoneId);
    if (!hazardZone) throw new Error(`Hazard zone ${hazardZoneId} not found`);

    if (originZoneId) {
      this.activeOriginZoneId = originZoneId;
    }

    // Set hazard
    this.activeHazard = {
      zoneId: hazardZoneId,
      zoneName: hazardZone.name,
      severity,
      triggeredAt: new Date().toLocaleTimeString()
    };

    // Update risk levels of zones
    this.zones.forEach(z => {
      if (z.id === hazardZoneId) {
        z.risk_level = severity === 'critical' ? 'critical_hazard' : 'hazard';
      } else {
        // Check if directly overlapping with hazard
        const isAdjacent = this.overlaps.some(o => 
          o.zone_ids.includes(hazardZoneId) && o.zone_ids.includes(z.id)
        );
        z.risk_level = isAdjacent ? 'warning' : 'safe';
      }
    });

    // Determine affected zones for evacuation calculation:
    // If hazard is in a corridor (e.g. zone_c), all connected rooms + corridor need urgent evacuation
    // If in a room, that room + its shared corridor zone are affected
    const affectedZoneIds = new Set([hazardZoneId]);
    this.overlaps.forEach(o => {
      if (o.zone_ids.includes(hazardZoneId)) {
        o.zone_ids.forEach(zid => affectedZoneIds.add(zid));
      }
    });

    // Also include the origin zone if not already included
    if (this.activeOriginZoneId) {
      affectedZoneIds.add(this.activeOriginZoneId);
    }

    const affectedZonesList = this.zones.filter(z => affectedZoneIds.has(z.id));

    // 1. Calculate PIE for affected zones
    const pieResult = PIECalculator.calculate(affectedZonesList, this.overlaps);

    // 2. Evaluate candidate evacuation routes
    const routeResult = this.optimizer.evaluateRoutes({
      originZoneId: this.activeOriginZoneId,
      hazardZoneId,
      hazardSeverity: severity,
      zones: this.zones,
      exits: this.exits,
      paths: this.paths,
      affectedOccupancy: pieResult.correctedOccupancy,
      thresholdPercent: this.optimizer.thresholdPercent
    });

    // 3. Update Exit Loads based on PIE corrected count
    this.exits.forEach(e => {
      if (routeResult.recommendedRoute && routeResult.recommendedRoute.exitId === e.id) {
        e.current_load = pieResult.correctedOccupancy;
        e.naive_load = pieResult.rawSum; // For comparison
      } else {
        e.current_load = 0;
        e.naive_load = 0;
      }
    });

    this.latestSimulation = {
      incident: this.activeHazard,
      affectedZones: affectedZonesList.map(z => ({ id: z.id, name: z.name, count: z.current_occupancy })),
      pie: pieResult,
      routing: routeResult,
      evaluatedAt: new Date().toLocaleTimeString()
    };

    this.addLog(
      'HAZARD_SIMULATED',
      `Hazard in ${hazardZone.name}. Affected: ${pieResult.correctedOccupancy} evacuees (PIE corrected from raw ${pieResult.rawSum}). Route chosen: ${routeResult.selectedStrategy.toUpperCase()}`
    );

    return this.latestSimulation;
  }

  resetSimulation() {
    this.activeHazard = null;
    this.latestSimulation = null;
    this.zones.forEach(z => {
      z.risk_level = 'normal';
    });
    this.exits.forEach(e => {
      e.current_load = 0;
      e.naive_load = 0;
    });
    this.addLog('SIMULATION_RESET', 'Hazard cleared and building status returned to normal.');
    return this.getModel();
  }
}

module.exports = new BuildingModel();

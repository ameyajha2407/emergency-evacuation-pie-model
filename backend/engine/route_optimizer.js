/**
 * Route Optimizer — Pure Optimal vs UX-First (Hick's Law Heuristic)
 * 
 * Strategy:
 * - Pure "Optimal": Minimizes distance / pure clearance time, even with high turns or counter-intuitive routing.
 * - UX-First: Minimizes turns, decision points, and hesitation (Hick's Law).
 * - Threshold Rule: Only switch to "Optimal" if it is faster by more than thresholdPercent (default 15%).
 */

class RouteOptimizer {
  constructor(thresholdPercent = 15) {
    this.thresholdPercent = thresholdPercent;
  }

  setThreshold(newThreshold) {
    this.thresholdPercent = Math.max(0, Math.min(100, Number(newThreshold)));
    return this.thresholdPercent;
  }

  /**
   * Evaluate routes from an origin zone to safe exits given hazard zone and affected zones.
   */
  evaluateRoutes({
    originZoneId,
    hazardZoneId,
    hazardSeverity = 'moderate',
    zones = [],
    exits = [],
    paths = [],
    affectedOccupancy = 45,
    thresholdPercent = null
  }) {
    const threshold = thresholdPercent !== null ? Number(thresholdPercent) : this.thresholdPercent;
    const originZone = zones.find(z => z.id === originZoneId) || zones[0];
    const hazardZone = zones.find(z => z.id === hazardZoneId);

    // Filter available exits (exclude any exit directly located in hazard zone)
    const availableExits = exits.filter(e => e.zone_id !== hazardZoneId && e.status !== 'blocked');

    // Find candidate paths from originZoneId to safe exits
    // Each path in the building graph has: { id, origin, exitId, zoneSequence, distanceMeters, turns, description, isIntuitive }
    const candidatePaths = paths.filter(p => 
      p.origin === originZoneId && 
      !p.zoneSequence.includes(hazardZoneId) &&
      availableExits.some(e => e.id === p.exitId)
    );

    // If all direct paths pass through hazard, consider alternate detour paths
    const usablePaths = candidatePaths.length > 0 ? candidatePaths : paths.filter(p => 
      p.origin === originZoneId && 
      availableExits.some(e => e.id === p.exitId)
    );

    if (usablePaths.length === 0) {
      return {
        selectedStrategy: 'none',
        reason: 'No safe evacuation route found! All exits blocked or hazardous.',
        recommendedRoute: null,
        optimalRoute: null,
        uxFirstRoute: null,
        comparison: null
      };
    }

    // Walking speed: 1.2 m/s
    const walkSpeed = 1.2;
    // Hick's Law cognitive decision penalty per turn under emergency panic: 3.2 seconds
    const turnHesitationPenalty = 3.2;

    const scoredPaths = usablePaths.map(path => {
      const exit = exits.find(e => e.id === path.exitId) || { max_flow_rate: 20, name: 'Unknown Exit' };
      const flowRate = Math.max(5, exit.max_flow_rate || 20);

      // Travel time along path
      const travelTime = path.distanceMeters / walkSpeed;
      
      // Exit bottleneck queuing time based on corrected evacuee occupancy
      const queueTime = affectedOccupancy / flowRate;

      // Pure physical time
      const theoreticalTime = Number((travelTime + queueTime).toFixed(1));

      // Hick's Law cognitive load index:
      // More turns = more decision points = higher hesitation and wrong turn probability
      const cognitiveLoadIndex = Math.min(10, Number((1.5 + (path.turns * 1.8) + (path.isIntuitive ? 0 : 2.5)).toFixed(1)));
      
      // Stressed clearance time includes hesitation at decision junctions
      const stressAdjustedTime = Number((travelTime + queueTime + (path.turns * turnHesitationPenalty)).toFixed(1));

      return {
        ...path,
        exitName: exit.name,
        exitFlowRate: flowRate,
        theoreticalTime,
        stressAdjustedTime,
        cognitiveLoadIndex,
        queueTime: Number(queueTime.toFixed(1)),
        travelTime: Number(travelTime.toFixed(1))
      };
    });

    // 1. Pure Optimal: Shortest theoretical clearance time
    const optimalCandidate = [...scoredPaths].sort((a, b) => a.theoreticalTime - b.theoreticalTime)[0];

    // 2. UX-First: Minimizes turns & cognitive load, favors intuitive straight paths
    const uxCandidate = [...scoredPaths].sort((a, b) => {
      if (a.turns !== b.turns) return a.turns - b.turns;
      if (a.cognitiveLoadIndex !== b.cognitiveLoadIndex) return a.cognitiveLoadIndex - b.cognitiveLoadIndex;
      return a.stressAdjustedTime - b.stressAdjustedTime;
    })[0];

    // Calculate percentage difference: how much faster is Optimal on paper compared to UX-First?
    const timeSaved = Number(Math.max(0, uxCandidate.theoreticalTime - optimalCandidate.theoreticalTime).toFixed(1));
    const speedupPercent = uxCandidate.theoreticalTime > 0 
      ? Number(((timeSaved / uxCandidate.theoreticalTime) * 100).toFixed(1))
      : 0;

    let selectedStrategy = 'ux-first';
    let chosenRoute = uxCandidate;
    let rationale = '';

    if (optimalCandidate.id === uxCandidate.id) {
      selectedStrategy = 'ux-first';
      chosenRoute = uxCandidate;
      rationale = `Optimal and UX-First agree: This route offers the fastest clearance time (${uxCandidate.theoreticalTime} s) while having the lowest turn complexity (${uxCandidate.turns} turns).`;
    } else if (speedupPercent > threshold) {
      // Optimal route exceeds the threshold speedup
      selectedStrategy = 'optimal';
      chosenRoute = optimalCandidate;
      rationale = `Optimal route selected over UX-First: Pure route saves ${timeSaved} s (${speedupPercent}% faster), which exceeds your configured simplicity threshold of ${threshold}%.`;
    } else {
      // UX-First selected because speedup is not enough to justify confusion
      selectedStrategy = 'ux-first';
      chosenRoute = uxCandidate;
      rationale = `UX-First route chosen: Saves ${Math.abs(optimalCandidate.turns - uxCandidate.turns)} direction change(s) with lower cognitive load (${uxCandidate.cognitiveLoadIndex}/10 vs ${optimalCandidate.cognitiveLoadIndex}/10). The optimal route is only ${speedupPercent}% faster, which does not exceed the ${threshold}% simplicity threshold. Hick's Law: fewer decision points prevent crowd hesitation.`;
    }

    return {
      selectedStrategy,
      threshold,
      rationale,
      speedupPercent,
      timeSaved,
      recommendedRoute: {
        ...chosenRoute,
        strategy: selectedStrategy
      },
      optimalRoute: {
        ...optimalCandidate,
        strategy: 'optimal'
      },
      uxFirstRoute: {
        ...uxCandidate,
        strategy: 'ux-first'
      },
      allCandidates: scoredPaths
    };
  }
}

module.exports = RouteOptimizer;

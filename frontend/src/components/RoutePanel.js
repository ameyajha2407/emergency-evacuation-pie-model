/**
 * RoutePanel Component
 * Displays the core UX-First vs Optimal route evaluation,
 * Hick's Law cognitive complexity score, threshold comparison,
 * and plain-language decision rationale for evaluators.
 */

class RoutePanel {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  render(simulationData) {
    if (!this.container) return;

    if (!simulationData || !simulationData.routing) {
      this.container.innerHTML = `
        <div class="panel-card">
          <div class="card-header">
            <h3 class="card-title"><span class="icon">🧭</span> Evacuation Route Strategy</h3>
            <span class="badge-tag">Hick's Law</span>
          </div>
          <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px;">
            <p>Awaiting hazard simulation to generate route recommendations.</p>
          </div>
        </div>
      `;
      return;
    }

    const { routing } = simulationData;
    const { selectedStrategy, threshold, rationale, speedupPercent, timeSaved, recommendedRoute, optimalRoute, uxFirstRoute } = routing;

    const isUXSelected = selectedStrategy === 'ux-first';
    const isOptimalSelected = selectedStrategy === 'optimal';

    this.container.innerHTML = `
      <div class="panel-card">
        <div class="card-header">
          <h3 class="card-title"><span class="icon">🧭</span> Route Strategy: UX-First vs Optimal</h3>
          <span class="badge-tag ${isUXSelected ? 'badge-emerald' : 'badge-cyan'}">
            ${isUXSelected ? 'UX-First Selected' : 'Optimal Override'}
          </span>
        </div>

        <!-- Rationale Banner for Evaluators -->
        <div class="rationale-banner ${isOptimalSelected ? 'optimal-chosen' : ''}">
          <div style="font-size: 20px;">${isUXSelected ? '🛡️' : '⚡'}</div>
          <div>
            <div style="font-weight: 700; margin-bottom: 2px;">
              ${isUXSelected ? "Why UX-First Route Was Chosen:" : "Why Optimal Route Overrode UX-First:"}
            </div>
            <div>${rationale}</div>
          </div>
        </div>

        <!-- Side-by-Side Comparison Cards -->
        <div class="route-cards-grid" style="margin-top: 14px;">
          <!-- UX-FIRST CARD -->
          <div class="route-card ${isUXSelected ? 'selected' : ''}">
            <div class="route-card-header">
              <span class="route-strategy-name" style="color: #34d399;">UX-First Strategy</span>
              ${isUXSelected ? '<span class="badge-tag badge-emerald">ACTIVE</span>' : ''}
            </div>

            <div class="route-metrics-list">
              <div class="route-metric-item">
                <span>Direction Changes</span>
                <span class="val" style="color: #34d399;">${uxFirstRoute?.turns || 0} turn(s)</span>
              </div>
              <div class="route-metric-item">
                <span>Hick's Cognitive Load</span>
                <span class="val">${uxFirstRoute?.cognitiveLoadIndex || 0} / 10 (Low)</span>
              </div>
              <div class="route-metric-item">
                <span>Direct Line of Sight</span>
                <span class="val" style="color: #34d399;">Yes</span>
              </div>
              <div class="route-metric-item">
                <span>Theoretical Clearance</span>
                <span class="val">${uxFirstRoute?.theoreticalTime || 0} s</span>
              </div>
              <div class="route-metric-item">
                <span>Target Exit</span>
                <span class="val" style="color: #f8fafc;">${uxFirstRoute?.exitName || 'N/A'}</span>
              </div>
            </div>
          </div>

          <!-- OPTIMAL CARD -->
          <div class="route-card ${isOptimalSelected ? 'selected strategy-optimal' : ''}">
            <div class="route-card-header">
              <span class="route-strategy-name" style="color: #38bdf8;">Pure Optimal Strategy</span>
              ${isOptimalSelected ? '<span class="badge-tag badge-cyan">ACTIVE</span>' : ''}
            </div>

            <div class="route-metrics-list">
              <div class="route-metric-item">
                <span>Direction Changes</span>
                <span class="val" style="color: #f87171;">${optimalRoute?.turns || 0} turn(s)</span>
              </div>
              <div class="route-metric-item">
                <span>Hick's Cognitive Load</span>
                <span class="val" style="color: #fbbf24;">${optimalRoute?.cognitiveLoadIndex || 0} / 10 (High)</span>
              </div>
              <div class="route-metric-item">
                <span>Speedup on Paper</span>
                <span class="val" style="color: #38bdf8;">+${speedupPercent}% (${timeSaved} s)</span>
              </div>
              <div class="route-metric-item">
                <span>Theoretical Clearance</span>
                <span class="val">${optimalRoute?.theoreticalTime || 0} s</span>
              </div>
              <div class="route-metric-item">
                <span>Target Exit</span>
                <span class="val" style="color: #f8fafc;">${optimalRoute?.exitName || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Evacuee Instruction Guidance -->
        <div class="turn-instructions">
          <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
            <span>📢 Evacuee Broadcast Instruction:</span>
          </div>
          <p style="color: #e2e8f0; font-size: 12px; line-height: 1.5;">
            "${recommendedRoute?.description || 'Follow emergency exit signs immediately.'}"
          </p>
        </div>
      </div>
    `;
  }
}

window.RoutePanel = RoutePanel;

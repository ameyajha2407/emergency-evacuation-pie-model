/**
 * ExitLoadMeter Component
 * Visualizes the real-time capacity and congestion load per exit.
 * Demonstrates how PIE prevents false exit overloading alerts.
 */

class ExitLoadMeter {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  render(model) {
    if (!this.container || !model) return;

    const exits = model.exits || [];
    const simulation = model.latestSimulation;

    let metersHtml = `
      <div class="panel-card" style="margin-top: 16px;">
        <div class="card-header">
          <h3 class="card-title"><span class="icon">🚪</span> Exit Door Flow & Capacity Meters</h3>
          <span class="badge-tag badge-emerald">Real-time Telemetry</span>
        </div>
        <div class="exit-meters-grid">
    `;

    exits.forEach(exit => {
      const load = exit.current_load || 0;
      const naiveLoad = exit.naive_load || 0;
      const maxRate = exit.max_flow_rate || 20;
      // Flow utilization relative to a 2-minute safety window (flow * 120s)
      const maxCapacity = maxRate * 5; // e.g. 100-125 evacuees
      const percent = Math.min(100, Math.round((load / maxCapacity) * 100));

      let fillClass = 'fill-nominal';
      let statusTag = '<span style="color: #34d399;">Nominal</span>';
      if (percent > 80) {
        fillClass = 'fill-critical';
        statusTag = '<span style="color: #f87171;">Critical Congestion</span>';
      } else if (percent > 50) {
        fillClass = 'fill-moderate';
        statusTag = '<span style="color: #fbbf24;">Moderate Flow</span>';
      }

      metersHtml += `
        <div class="exit-meter-card">
          <div class="exit-meter-header">
            <span>${exit.name}</span>
            <span>${statusTag}</span>
          </div>

          <div class="exit-progress-bar-bg">
            <div class="exit-progress-fill ${fillClass}" style="width: ${percent}%;"></div>
          </div>

          <div class="exit-meter-footer">
            <span>Evacuee Load: <strong>${load}</strong> / ${maxCapacity}</span>
            <span>Max Flow: ${maxRate} p/s</span>
          </div>

          ${(naiveLoad > load && load > 0) ? `
            <div style="margin-top: 4px; font-size: 10px; color: #a78bfa; font-family: var(--font-mono);">
              Naive count would be: ${naiveLoad} (+${Math.round(((naiveLoad - load)/load)*100)}% false alarm)
            </div>
          ` : ''}
        </div>
      `;
    });

    metersHtml += `
        </div>
      </div>
    `;

    this.container.innerHTML = metersHtml;
  }
}

window.ExitLoadMeter = ExitLoadMeter;

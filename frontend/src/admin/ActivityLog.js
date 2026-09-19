/**
 * ActivityLog Component
 * Displays real-time decision and simulation activity stream.
 */

class ActivityLog {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  render(logs = []) {
    if (!this.container) return;

    const latest = logs[0] || {
      timestamp: new Date().toLocaleTimeString(),
      action: 'SYSTEM_READY',
      details: 'Simulation engine standing by.'
    };

    this.container.innerHTML = `
      <div class="audit-drawer">
        <div class="audit-stream">
          <span class="audit-tag">${latest.timestamp}</span>
          <strong style="color: #38bdf8;">[${latest.action}]</strong>
          <span>${latest.details}</span>
        </div>
        <div style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted);">
          JAIN University • B.Tech Experiential Learning Model
        </div>
      </div>
    `;
  }
}

window.ActivityLog = ActivityLog;

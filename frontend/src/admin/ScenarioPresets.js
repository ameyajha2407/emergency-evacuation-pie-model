/**
 * ScenarioPresets Component
 * Provides 1-click evaluation scenario presets designed for evaluator demonstrations.
 */

class ScenarioPresets {
  constructor(containerId, onSelectScenario) {
    this.container = document.getElementById(containerId);
    this.onSelectScenario = onSelectScenario;
  }

  render(scenarios = [], activeScenarioId = null) {
    if (!this.container) return;

    let html = `
      <div class="control-group">
        <label class="control-label">One-Click Evaluator Presets</label>
        <div class="scenario-list">
    `;

    scenarios.forEach(sc => {
      const isActive = activeScenarioId === sc.id;
      html += `
        <button class="scenario-btn ${isActive ? 'active' : ''}" data-scenario-id="${sc.id}">
          <div class="scenario-header">
            <span class="scenario-title">${sc.title}</span>
            <span class="badge-tag ${isActive ? 'badge-purple' : ''}">${sc.badge}</span>
          </div>
          <div class="scenario-desc">${sc.description}</div>
        </button>
      `;
    });

    html += `
        </div>
      </div>
    `;

    this.container.innerHTML = html;

    this.container.querySelectorAll('.scenario-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-scenario-id');
        if (this.onSelectScenario) {
          this.onSelectScenario(id);
        }
      });
    });
  }
}

window.ScenarioPresets = ScenarioPresets;

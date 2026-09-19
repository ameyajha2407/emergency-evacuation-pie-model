/**
 * HazardTrigger Component
 * Allows manual triggering of emergencies: selecting origin zone, hazard zone, and severity.
 */

class HazardTrigger {
  constructor(containerId, onTriggerHazard, onReset) {
    this.container = document.getElementById(containerId);
    this.onTriggerHazard = onTriggerHazard;
    this.onReset = onReset;
  }

  render(model) {
    if (!this.container || !model) return;

    const { zones, activeHazard, activeOriginZoneId } = model;
    const selectedHazardId = activeHazard?.zoneId || 'zone_c';
    const selectedOriginId = activeOriginZoneId || 'zone_a';

    let html = `
      <div class="control-group" style="margin-top: 14px;">
        <label class="control-label">Manual Hazard Trigger</label>
        
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div>
            <span style="font-size: 11px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Hazard Origin:</span>
            <select id="select-hazard-zone" style="width: 100%; padding: 8px 10px; background: #090e17; border: 1px solid var(--border-light); border-radius: var(--radius-sm); color: #f8fafc; font-size: 12px; outline: none;">
              ${zones.map(z => `
                <option value="${z.id}" ${z.id === selectedHazardId ? 'selected' : ''}>${z.name}</option>
              `).join('')}
            </select>
          </div>

          <div>
            <span style="font-size: 11px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Evacuee Origin:</span>
            <select id="select-origin-zone" style="width: 100%; padding: 8px 10px; background: #090e17; border: 1px solid var(--border-light); border-radius: var(--radius-sm); color: #f8fafc; font-size: 12px; outline: none;">
              ${zones.filter(z => z.type !== 'corridor').map(z => `
                <option value="${z.id}" ${z.id === selectedOriginId ? 'selected' : ''}>${z.name}</option>
              `).join('')}
            </select>
          </div>

          <div style="display: flex; gap: 8px; margin-top: 4px;">
            <button class="btn btn-danger btn-sm" id="btn-trigger-hazard" style="flex: 1;">
              🔥 Simulate Fire
            </button>
            <button class="btn btn-secondary btn-sm" id="btn-reset-hazard" style="flex: 1;">
              🔄 Reset Normal
            </button>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;

    this.container.querySelector('#btn-trigger-hazard').addEventListener('click', () => {
      const hazardZoneId = this.container.querySelector('#select-hazard-zone').value;
      const originZoneId = this.container.querySelector('#select-origin-zone').value;
      if (this.onTriggerHazard) {
        this.onTriggerHazard({ hazardZoneId, originZoneId, severity: 'critical' });
      }
    });

    this.container.querySelector('#btn-reset-hazard').addEventListener('click', () => {
      if (this.onReset) {
        this.onReset();
      }
    });
  }
}

window.HazardTrigger = HazardTrigger;

/**
 * ZoneEditor Component
 * Allows evaluators to slide individual room occupancies and observe how PIE
 * dynamically recalculates true vs naive headcount.
 */

class ZoneEditor {
  constructor(containerId, onOccupancyChange) {
    this.container = document.getElementById(containerId);
    this.onOccupancyChange = onOccupancyChange;
  }

  render(zones = []) {
    if (!this.container) return;

    let html = `
      <div class="control-group" style="margin-top: 14px;">
        <label class="control-label">Live Room Occupancy Inputs</label>
        <div style="display: flex; flex-direction: column; gap: 8px; background: rgba(0,0,0,0.2); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
    `;

    zones.forEach(zone => {
      html += `
        <div class="occupancy-slider-row">
          <span title="${zone.name}">${zone.name.split('(')[0]}</span>
          <input type="range" min="0" max="${zone.capacity || 100}" value="${zone.current_occupancy}" 
                 data-zone-id="${zone.id}" class="zone-occ-slider" />
          <span class="occupancy-count" id="occ-val-${zone.id}">${zone.current_occupancy}</span>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    this.container.innerHTML = html;

    this.container.querySelectorAll('.zone-occ-slider').forEach(slider => {
      const zid = slider.getAttribute('data-zone-id');
      const valDisplay = this.container.querySelector(`#occ-val-${zid}`);

      slider.addEventListener('input', (e) => {
        valDisplay.textContent = e.target.value;
      });

      slider.addEventListener('change', (e) => {
        if (this.onOccupancyChange) {
          this.onOccupancyChange(zid, Number(e.target.value));
        }
      });
    });
  }
}

window.ZoneEditor = ZoneEditor;

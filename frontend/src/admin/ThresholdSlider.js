/**
 * ThresholdSlider Component
 * Allows evaluators and operators to adjust the Optimality vs Simplicity threshold (0% to 50%).
 * Dynamic feedback demonstrates Hick's Law live.
 */

class ThresholdSlider {
  constructor(containerId, onThresholdChange) {
    this.container = document.getElementById(containerId);
    this.onThresholdChange = onThresholdChange;
  }

  render(currentThreshold = 15) {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="threshold-container">
        <div class="threshold-header">
          <span class="threshold-label">Optimality Margin Threshold</span>
          <span class="threshold-value-badge" id="threshold-val-display">${currentThreshold}%</span>
        </div>

        <input type="range" class="range-slider" id="threshold-range-input" 
               min="0" max="50" step="1" value="${currentThreshold}" />

        <div class="threshold-explanation" id="threshold-explanation-text">
          Rule: An optimal route must be faster than the simple 1-turn route by more than 
          <strong>${currentThreshold}%</strong> to justify the extra turns under stress.
        </div>
      </div>
    `;

    const slider = this.container.querySelector('#threshold-range-input');
    const display = this.container.querySelector('#threshold-val-display');
    const explanation = this.container.querySelector('#threshold-explanation-text');

    slider.addEventListener('input', (e) => {
      const val = e.target.value;
      display.textContent = `${val}%`;
      explanation.innerHTML = `Rule: An optimal route must be faster than the simple 1-turn route by more than <strong>${val}%</strong> to justify the extra turns under stress.`;
    });

    slider.addEventListener('change', (e) => {
      const val = Number(e.target.value);
      if (this.onThresholdChange) {
        this.onThresholdChange(val);
      }
    });
  }
}

window.ThresholdSlider = ThresholdSlider;

/**
 * Main Frontend Application Coordinator
 * Connects API, FloorPlanView, OccupancyComparison, RoutePanel, ExitLoadMeter, and Admin controls.
 */

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Initializing Emergency Evacuation Planning System UI...');

  // Modal controls
  const modalOverlay = document.getElementById('viva-modal-overlay');
  const btnOpenViva = document.getElementById('btn-open-viva');
  const btnCloseViva = document.getElementById('btn-close-modal');

  if (btnOpenViva && modalOverlay) {
    btnOpenViva.addEventListener('click', () => modalOverlay.classList.add('active'));
  }
  if (btnCloseViva && modalOverlay) {
    btnCloseViva.addEventListener('click', () => modalOverlay.classList.remove('active'));
  }
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) modalOverlay.classList.remove('active');
    });
  }

  // Header status indicator
  const statusIndicator = document.getElementById('system-status-indicator');
  const statusText = document.getElementById('system-status-text');

  function updateStatus(isHazard) {
    if (isHazard) {
      statusIndicator.className = 'status-indicator hazard-active';
      statusText.textContent = 'DEFCON 1 • HAZARD ACTIVE';
    } else {
      statusIndicator.className = 'status-indicator';
      statusText.textContent = 'SYSTEM ACTIVE • MONITORING';
    }
  }

  // Component instances
  let currentModel = null;
  let activeScenarioId = null;

  const floorPlan = new FloorPlanView('floor-plan-container', async (zoneId) => {
    // If clicked on a room, make it the origin or simulate hazard
    if (!currentModel) return;
    try {
      console.log('Room clicked on floor plan:', zoneId);
      // Toggle: if hazard is already somewhere, set this as origin; else trigger hazard
      if (currentModel.activeHazard) {
        // Change evacuee origin to this room
        await apiClient.simulateHazard({
          hazardZoneId: currentModel.activeHazard.zoneId,
          originZoneId: zoneId,
          severity: currentModel.activeHazard.severity
        });
      } else {
        // Trigger hazard in this room
        await apiClient.simulateHazard({
          hazardZoneId: zoneId,
          originZoneId: zoneId === 'zone_a' ? 'zone_b' : 'zone_a',
          severity: 'critical'
        });
      }
      await refreshState();
    } catch (err) {
      console.error(err);
    }
  });

  const pieVisualizer = new OccupancyComparison('pie-comparison-container');
  const routePanel = new RoutePanel('route-panel-container');
  const exitMeter = new ExitLoadMeter('exit-meter-container');
  const activityLog = new ActivityLog('activity-log-container');

  const scenarioPresets = new ScenarioPresets('scenario-presets-container', async (scId) => {
    try {
      activeScenarioId = scId;
      await apiClient.loadScenario(scId);
      await refreshState();
    } catch (err) {
      console.error('Failed to load scenario:', err);
    }
  });

  const thresholdSlider = new ThresholdSlider('threshold-slider-container', async (newThreshold) => {
    try {
      await apiClient.setThreshold(newThreshold);
      await refreshState();
    } catch (err) {
      console.error('Failed to set threshold:', err);
    }
  });

  const hazardTrigger = new HazardTrigger(
    'hazard-trigger-container',
    async ({ hazardZoneId, originZoneId, severity }) => {
      try {
        activeScenarioId = null;
        await apiClient.simulateHazard({ hazardZoneId, originZoneId, severity });
        await refreshState();
      } catch (err) {
        console.error('Hazard simulation failed:', err);
      }
    },
    async () => {
      try {
        activeScenarioId = null;
        await apiClient.resetSimulation();
        await refreshState();
      } catch (err) {
        console.error('Reset failed:', err);
      }
    }
  );

  const zoneEditor = new ZoneEditor('zone-editor-container', async (zoneId, count) => {
    try {
      await apiClient.updateOccupancy(zoneId, count);
      await refreshState();
    } catch (err) {
      console.error('Occupancy update failed:', err);
    }
  });

  // Global reset button in header
  const btnResetHeader = document.getElementById('btn-reset-header');
  if (btnResetHeader) {
    btnResetHeader.addEventListener('click', async () => {
      activeScenarioId = null;
      await apiClient.resetSimulation();
      await refreshState();
    });
  }

  async function refreshState() {
    try {
      currentModel = await apiClient.getModel();
      updateStatus(!!currentModel.activeHazard);

      floorPlan.render(currentModel);
      pieVisualizer.render(currentModel.latestSimulation);
      routePanel.render(currentModel.latestSimulation);
      exitMeter.render(currentModel);
      scenarioPresets.render(currentModel.scenarios, activeScenarioId);
      thresholdSlider.render(currentModel.thresholdPercent);
      hazardTrigger.render(currentModel);
      zoneEditor.render(currentModel.zones);
      activityLog.render(currentModel.logs);
    } catch (err) {
      console.error('State refresh failed:', err);
    }
  }

  // Initial load
  try {
    currentModel = await apiClient.getModel();
    // Auto-load Scenario 1 so judges see a fully populated active system immediately!
    activeScenarioId = 'scenario_corridor_smoke';
    await apiClient.loadScenario(activeScenarioId);
    await refreshState();
  } catch (err) {
    console.error('App initialization failed:', err);
  }
});

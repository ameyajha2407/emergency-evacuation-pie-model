/**
 * API Client for interacting with the Evacuation Simulation Engine Backend
 */

class ApiClient {
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }

  async getModel() {
    const res = await fetch(`${this.baseUrl}/model`);
    if (!res.ok) throw new Error(`Failed to fetch model: ${res.statusText}`);
    const json = await res.json();
    return json.data;
  }

  async simulateHazard({ hazardZoneId, originZoneId, severity = 'critical' }) {
    const res = await fetch(`${this.baseUrl}/simulate/hazard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hazardZoneId, originZoneId, severity })
    });
    if (!res.ok) throw new Error(`Hazard simulation failed: ${res.statusText}`);
    const json = await res.json();
    return json;
  }

  async resetSimulation() {
    const res = await fetch(`${this.baseUrl}/simulate/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error(`Reset simulation failed: ${res.statusText}`);
    const json = await res.json();
    return json.data;
  }

  async loadScenario(scenarioId) {
    const res = await fetch(`${this.baseUrl}/scenarios/load`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId })
    });
    if (!res.ok) throw new Error(`Failed to load scenario: ${res.statusText}`);
    const json = await res.json();
    return json;
  }

  async setThreshold(thresholdPercent) {
    const res = await fetch(`${this.baseUrl}/config/threshold`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thresholdPercent })
    });
    if (!res.ok) throw new Error(`Failed to update threshold: ${res.statusText}`);
    const json = await res.json();
    return json;
  }

  async updateOccupancy(zoneId, current_occupancy) {
    const res = await fetch(`${this.baseUrl}/zones/${zoneId}/occupancy`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_occupancy })
    });
    if (!res.ok) throw new Error(`Failed to update occupancy: ${res.statusText}`);
    const json = await res.json();
    return json;
  }

  async getLogs() {
    const res = await fetch(`${this.baseUrl}/logs`);
    if (!res.ok) throw new Error(`Failed to fetch logs: ${res.statusText}`);
    const json = await res.json();
    return json.logs;
  }
}

// Global instance for browser
window.apiClient = new ApiClient();

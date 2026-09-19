const express = require('express');
const router = express.Router();
const buildingModel = require('../models/building_model');
const PIECalculator = require('../engine/pie_calculator');

// GET full building model and active state
router.get('/model', (req, res) => {
  try {
    res.json({ success: true, data: buildingModel.getModel() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST simulate hazard
router.post('/simulate/hazard', (req, res) => {
  try {
    const { hazardZoneId, originZoneId, severity } = req.body;
    if (!hazardZoneId) {
      return res.status(400).json({ success: false, error: 'hazardZoneId is required' });
    }
    const result = buildingModel.runSimulation({ hazardZoneId, originZoneId, severity });
    res.json({ success: true, data: result, model: buildingModel.getModel() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST reset simulation
router.post('/simulate/reset', (req, res) => {
  try {
    const result = buildingModel.resetSimulation();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST load scenario preset
router.post('/scenarios/load', (req, res) => {
  try {
    const { scenarioId } = req.body;
    if (!scenarioId) {
      return res.status(400).json({ success: false, error: 'scenarioId is required' });
    }
    const result = buildingModel.loadScenario(scenarioId);
    res.json({ success: true, data: result, model: buildingModel.getModel() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update optimality threshold
router.put('/config/threshold', (req, res) => {
  try {
    const { thresholdPercent } = req.body;
    if (thresholdPercent === undefined) {
      return res.status(400).json({ success: false, error: 'thresholdPercent is required' });
    }
    const updated = buildingModel.setThreshold(thresholdPercent);
    res.json({ success: true, thresholdPercent: updated, model: buildingModel.getModel() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update zone occupancy
router.put('/zones/:id/occupancy', (req, res) => {
  try {
    const { id } = req.params;
    const { current_occupancy } = req.body;
    const updated = buildingModel.updateZoneOccupancy(id, current_occupancy);
    res.json({ success: true, zone: updated, model: buildingModel.getModel() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST ad-hoc PIE calculation on custom sets
router.post('/calculate/pie', (req, res) => {
  try {
    const { zones, overlaps } = req.body;
    const result = PIECalculator.calculate(zones, overlaps || buildingModel.overlaps);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET activity logs
router.get('/logs', (req, res) => {
  res.json({ success: true, logs: buildingModel.logs });
});

module.exports = router;

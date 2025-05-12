const express = require('express');
const router = express.Router();
const ProductionPlan = require('../models/ProductionPlan');

// GET all production plans
router.get('/', async (req, res) => {
  try {
    const productionPlans = await ProductionPlan.find();
    res.json(productionPlans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST a new production plan
router.post('/', async (req, res) => {
  const productionPlan = new ProductionPlan(req.body);
  try {
    const newProductionPlan = await productionPlan.save();
    res.status(201).json(newProductionPlan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE a production plan by ID
router.delete('/:id', async (req, res) => {
  try {
    const productionPlan = await ProductionPlan.findById(req.params.id);
    if (!productionPlan) {
      return res.status(404).json({ message: 'Production plan not found' });
    }
    await productionPlan.remove();
    res.json({ message: 'Production plan deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
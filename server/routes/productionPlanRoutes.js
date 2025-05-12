const express = require('express');
const router = express.Router();
const ProductionPlan = require('../models/mpbackend');

// POST route to save production plan
router.post('/', async (req, res) => {
  try {
    const newProductionPlan = new ProductionPlan(req.body);
    await newProductionPlan.save();
    res.status(201).json({ message: 'Production plan saved successfully' });
  } catch (error) {
    console.error('Error saving production plan:', error);
    res.status(500).json({ message: 'Failed to save production plan', error: error.message });
  }
});

// GET route to fetch production plan
router.get('/', async (req, res) => {
  try {
    const productionPlans = await ProductionPlan.find();
    res.json(productionPlans);
  } catch (error) {
    console.error('Error fetching production plan:', error);
    res.status(500).json({ message: 'Failed to fetch production plan', error: error.message });
  }
});

// DELETE route to delete production plan by jobCardNo only
router.delete('/by-jobcard', async (req, res) => {
  try {
    const { jobCardNo } = req.body;
    if (!jobCardNo) {
      return res.status(400).json({ message: 'jobCardNo is required' });
    }
    // Find and delete the production plan for the given jobCardNo
    const result = await ProductionPlan.findOneAndDelete({ jobCardNo });
    if (!result) {
      return res.status(404).json({ message: 'Production entry not found' });
    }
    res.status(200).json({ message: 'Production entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting production entry:', error);
    res.status(500).json({ message: 'Failed to delete production entry', error: error.message });
  }
});

module.exports = router;

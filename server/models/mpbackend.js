const mongoose = require('mongoose');
const express = require("express");
const router = express.Router();

const productionPlanSchema = new mongoose.Schema({
  type: String,
  mcNo: String,
  jobCardNo: { 
    type: String,
    required: true 
  },
  partNo: { 
    type: String, 
    unique: true,
    required: true 
  },
  partName: String,
  planQty: String,
  setupNo: String,
  cncTimePerPc: String,
  vmcTimePerPc: String,
  setupTime: String,
  loadUnloadTime: String,
  convTimePerPc: String,
  deburrTimePerPc: String,
  sandblastTimePerPc: String,
  startDate: String,
  totalTimeHrs: String,
  workingDays: String,
  targetDays: String,
  targetDateOnlyMC: String,
  targetDateWholePart: String,
  timeStamp: String
});

const ProductionPlan = mongoose.model('ProductionPlan', productionPlanSchema);

// Route to save form data
router.post("/", async (req, res) => {
  try {
    const productionPlan = new ProductionPlan(req.body);
    const savedPlan = await productionPlan.save();
    res.status(201).json(savedPlan);
  } catch (error) {
    console.error("Error saving production plan:", error);
    res.status(500).json({ error: "Failed to save production plan." });
  }
});

// Route to fetch all saved forms
router.get("/", async (req, res) => {
  try {
    console.log('Fetching saved forms...');
    const savedForms = await ProductionPlan.find().sort({ _id: -1 }); // Sort by newest first
    console.log('Found forms:', savedForms.length);
    res.status(200).json(savedForms);
  } catch (error) {
    console.error("Error fetching saved forms:", error);
    res.status(500).json({ error: "Failed to fetch saved forms." });
  }
});

// Add delete route
router.delete("/:id", async (req, res) => {
  try {
    const result = await ProductionPlan.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ error: "Form not found" });
    }
    res.status(200).json({ message: "Form deleted successfully" });
  } catch (error) {
    console.error("Error deleting form:", error);
    res.status(500).json({ error: "Failed to delete form" });
  }
});

// Add update route
router.put("/:id", async (req, res) => {
  try {
    const { jobCardNo, partNo } = req.body;
    
    // Check if jobCardNo or partNo already exist (excluding current document)
    const duplicate = await ProductionPlan.findOne({
      $and: [
        { _id: { $ne: req.params.id } },
        { $or: [{ jobCardNo }, { partNo }] }
      ]
    });

    if (duplicate) {
      return res.status(400).json({ 
        error: `${duplicate.jobCardNo === jobCardNo ? 'Job Card No' : 'Part No'} already exists` 
      });
    }

    const result = await ProductionPlan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );  
    
    if (!result) {
      return res.status(404).json({ error: "Form not found" });
    }
    res.status(200).json(result);
  } catch (error) {
    console.error("Error updating form:", error);
    res.status(500).json({ error: "Failed to update form" });
  }
});

module.exports = router;

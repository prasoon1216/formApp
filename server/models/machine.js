const mongoose = require('mongoose');

// Define the Machine schema
const machineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  targetOEE: { type: String, required: true },
});

// Create the Machine model
const Machine = mongoose.model('Machine', machineSchema);

module.exports = Machine;

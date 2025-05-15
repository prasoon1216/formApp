const mongoose = require('mongoose');

// Define the Calendar schema
const calendarSchema = new mongoose.Schema({
  event: { type: String, required: true },
  date: { type: Date, required: true },
  description: { type: String },
});

// Create the Calendar model
const Calendar = mongoose.model('Calendar', calendarSchema);

module.exports = Calendar;

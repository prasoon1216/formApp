const mongoose = require('mongoose');

// Define the schema for regular breaks
const regularBreakSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  start: { type: String, default: '' },
  end: { type: String, default: '' },
  enabled: { type: Boolean, default: false }
}, { _id: false });

// Define the schema for special breaks
const specialBreakSchema = new mongoose.Schema({
  description: { type: String, default: '' },
  start: { type: String, default: '' },
  end: { type: String, default: '' },
  enabled: { type: Boolean, default: false }
}, { _id: false });

// Define the schema for calendar entries
const calendarEntrySchema = new mongoose.Schema({
  date: { type: String, required: true },
  day: { type: String, required: true },
  shiftStart: { type: String, default: '' },
  shiftEnd: { type: String, default: '' },
  regularBreaks: {
    type: [regularBreakSchema],
    default: []
  },
  specialBreak: {
    type: specialBreakSchema,
    default: { description: '', start: '', end: '', enabled: false }
  },
  availableHours: { type: Number, default: 0 },
  sundayWork: { type: Boolean, default: false }
}, { timestamps: true });

// Create a unique index on date to avoid duplicates
calendarEntrySchema.index({ date: 1 }, { unique: true });

// Export the model
module.exports = mongoose.model('CalendarEntry', calendarEntrySchema);

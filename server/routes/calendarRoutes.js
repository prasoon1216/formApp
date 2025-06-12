const express = require('express');
const router = express.Router();
const CalendarEntry = require('../models/calendarModel');

// Get all calendar entries with optional month/year filtering
router.get('/', async (req, res) => {
  try {
    const { month, year, date } = req.query;
    let query = {};
    
    // Filter by specific date if provided
    if (date) {
      query = { date };
    }
    // Filter by month and year if provided
    else if (month !== undefined && year !== undefined) {
      const startDate = new Date(parseInt(year), parseInt(month), 1).toISOString().split('T')[0];
      const endDate = new Date(parseInt(year), parseInt(month) + 1, 0).toISOString().split('T')[0];
      
      query = { 
        date: { 
          $gte: startDate, 
          $lte: endDate 
        } 
      };
    }
    
    const entries = await CalendarEntry.find(query).sort({ date: 1 });
    res.json(entries);
  } catch (error) {
    console.error('Error fetching calendar entries:', error);
    res.status(500).json({ error: 'Failed to fetch calendar entries' });
  }
});

// Get a single calendar entry by ID
router.get('/:id', async (req, res) => {
  try {
    const entry = await CalendarEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ error: 'Calendar entry not found' });
    }
    res.json(entry);
  } catch (error) {
    console.error('Error fetching calendar entry:', error);
    res.status(500).json({ error: 'Failed to fetch calendar entry' });
  }
});

// Create or update a calendar entry (using date as unique identifier)
router.post('/', async (req, res) => {
  try {
    const entryData = req.body;
    
    if (!entryData.date) {
      return res.status(400).json({ error: 'Date is required' });
    }
    
    // Check if entry with this date already exists
    const existingEntry = await CalendarEntry.findOne({ date: entryData.date });
    
    if (existingEntry) {

      // Remove the _id field if it exists in the request
      if (entryData._id) {
        delete entryData._id;
      }
      
      const updatedEntry = await CalendarEntry.findByIdAndUpdate(
        existingEntry._id,
        entryData,
        { new: true, runValidators: false }
      );
      
      return res.json(updatedEntry);
    } else {
      const newEntry = new CalendarEntry(entryData);
      const savedEntry = await newEntry.save();
      return res.status(201).json(savedEntry);
    }
  } catch (error) {
    console.error('Error saving calendar entry:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: Object.values(error.errors).map(e => e.message) 
      });
    }
    res.status(500).json({ error: 'Failed to save calendar entry' });
  }
});

// Delete a calendar entry
router.delete('/:id', async (req, res) => {
  try {
    const entry = await CalendarEntry.findByIdAndDelete(req.params.id);
    if (!entry) {
      return res.status(404).json({ error: 'Calendar entry not found' });
    }
    res.json({ message: 'Calendar entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting calendar entry:', error);
    res.status(500).json({ error: 'Failed to delete calendar entry' });
  }
});

module.exports = router;

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { Schema, Types } = mongoose;


const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection URI and database/collection names
const MONGO_URI = process.env.MONGO_URI || 'mongodb://prodsystem:Allied%401234@amlmongodb:27017/formApp?authSource=formApp';
// Middleware
app.use(cors()); // Allow requests from other origins (e.g., frontend on port 5173)
app.use(bodyParser.json()); // Parse incoming JSON data

// Register auth route
app.use('/auth', require('./routes/authRoutes'));

// Define Mongoose schemas and models
// Machine Schema
const MachineSchema = new Schema({
    id: String,
    type: { type: String, required: true },
    name: { type: String, required: true },
    targetOEE: { type: Number, required: true }
});

// Calendar Schema
const CalendarSchema = new Schema({
    date: { type: String, required: true },
    day: { type: String, required: true },
    selectedShift: { type: String, required: true },
    shiftHours: Schema.Types.Mixed
});

// Create models
const Machine = mongoose.model('Machine', MachineSchema, 'machines');
const Calendar = mongoose.model('Calendar', CalendarSchema, 'calendar');

// Connect to MongoDB with Mongoose
mongoose.connect(MONGO_URI)
    .then(() => console.log('Mongoose connected successfully'))
    .catch((err) => console.error('Mongoose connection error:', err));

// Get all machines
app.get('/machines', async(req, res) => {
    try {
        const machines = await Machine.find().lean();
        res.json(machines);
    } catch (error) {
        console.error('Error fetching machines:', error);
        res.status(500).json({ error: 'Failed to fetch machines.' });
    }
});

// Add a new machine
app.post('/machines', async(req, res) => {
    console.log('POST /machines - Request body:', req.body);
    const { id, type, name, targetOEE } = req.body;

    if (!type || !name || !targetOEE) {
        console.error('POST /machines - Validation failed:', req.body);
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        const newMachine = new Machine({ id, type, name, targetOEE });
        await newMachine.save();
        console.log('POST /machines - Machine added:', newMachine);
        res.status(201).json(newMachine);
    } catch (error) {
        console.error('Error adding machine:', error);
        res.status(500).json({ error: 'Failed to add machine.' });
    }
});

// Update an existing machine
app.put('/machines/:id', async(req, res) => {
    console.log(`PUT /machines/${req.params.id} - Request body:`, req.body);
    const { id } = req.params;
    const { type, name, targetOEE } = req.body;

    if (!type || !name || !targetOEE) {
        console.error(`PUT /machines/${id} - Validation failed:`, req.body);
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        // Validate the MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.error(`PUT /machines/${id} - Invalid ObjectId`);
            return res.status(400).json({ error: 'Invalid machine ID.' });
        }

        // Check if the machine exists and update it
        const updateData = { type, name, targetOEE };
        const updatedMachine = await Machine.findByIdAndUpdate(
            id,
            updateData,
            { new: true } // Return the updated document
        );

        if (!updatedMachine) {
            console.error(`PUT /machines/${id} - Machine not found`);
            return res.status(404).json({ error: 'Machine not found.' });
        }

        console.log(`PUT /machines/${id} - Machine updated:`, updatedMachine);
        res.json(updatedMachine);
    } catch (error) {
        console.error('Error updating machine:', error);
        res.status(500).json({ error: 'Failed to update machine.' });
    }
});

// Delete a machine
app.delete('/machines/:id', async(req, res) => {
    console.log(`DELETE /machines/${req.params.id}`);
    const { id } = req.params;

    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.error(`DELETE /machines/${id} - Invalid ObjectId`);
            return res.status(400).json({ error: 'Invalid machine ID.' });
        }

        const result = await Machine.findByIdAndDelete(id);

        if (!result) {
            console.error(`DELETE /machines/${id} - Machine not found`);
            return res.status(404).json({ error: 'Machine not found.' });
        }

        console.log(`DELETE /machines/${id} - Machine deleted`);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting machine:', error);
        res.status(500).json({ error: 'Failed to delete machine.' });
    }
});

// Add a new calendar entry
app.post('/calendar', async(req, res) => {
    console.log('POST /calendar - Request body:', req.body);
    const { date, day, selectedShift, shiftHours } = req.body;

    if (!date || !day || !selectedShift) {
        console.error('POST /calendar - Validation failed:', req.body);
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        const newCalendarEntry = new Calendar({ date, day, selectedShift, shiftHours });
        await newCalendarEntry.save();
        console.log('POST /calendar - Calendar entry added:', newCalendarEntry);
        res.status(201).json(newCalendarEntry);
    } catch (error) {
        console.error('Error adding calendar entry:', error);
        res.status(500).json({ error: 'Failed to add calendar entry.' });
    }
});

//get api
app.get('/calendar', async(req, res) => {
    try {
        const calendarEntries = await Calendar.find().lean();
        console.log('GET /calendar - Fetched entries:', calendarEntries.length);
        res.status(200).json(calendarEntries);
    } catch (error) {
        console.error('Error fetching calendar entries:', error);
        res.status(500).json({ error: 'Failed to fetch calendar entries.' });
    }
});

// Update calendar entry
app.put('/calendar/:id', async(req, res) => {
    const { id } = req.params;
    const { date, day, selectedShift, shiftHours } = req.body;

    if (!date || !day || !selectedShift) {
        console.error('PUT /calendar - Validation failed:', req.body);
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.error(`PUT /calendar/${id} - Invalid ObjectId`);
            return res.status(400).json({ error: 'Invalid calendar entry ID.' });
        }

        const updatedEntry = await Calendar.findByIdAndUpdate(
            id,
            { date, day, selectedShift, shiftHours },
            { new: true }
        );

        if (!updatedEntry) {
            console.warn(`PUT /calendar - No entry found with ID: ${id}`);
            return res.status(404).json({ error: 'Calendar entry not found.' });
        }

        console.log(`PUT /calendar - Updated entry ID: ${id}`);
        res.status(200).json({ message: 'Calendar entry updated successfully.', entry: updatedEntry });
    } catch (error) {
        console.error('Error updating calendar entry:', error);
        res.status(500).json({ error: 'Failed to update calendar entry.' });
    }
});

// Import the DailyProduction model
const { DailyProduction, removeUniqueConstraints } = require('./models/formbackend');
// Import jobRoutes
const jobRoutes = require('./routes/jobRoutes');

mongoose.connection.once('open', () => {
    console.log('MongoDB connection is open, removing unique constraints...');
    removeUniqueConstraints()
        .then(() => console.log('Unique constraints removal process completed'))
        .catch(err => console.error('Error in constraint removal process:', err));
});

// Mount job-related API routes
app.use('/job', jobRoutes);

// Daily Production Routes
app.post('/daily-production', async(req, res) => {
    try {
        const { date, formData, productionEntries } = req.body;

        // Find if entry exists for this date
        let dailyProduction = await DailyProduction.findOne({
            date: new Date(date)
        });

        if (dailyProduction) {
            // Update existing record
            dailyProduction.formData = formData;
            dailyProduction.productionEntries = productionEntries;
            await dailyProduction.save();
        } else {
            // Create new record
            dailyProduction = new DailyProduction({
                date: new Date(date),
                formData,
                productionEntries
            });
            await dailyProduction.save();
        }

        res.status(201).json(dailyProduction);
    } catch (error) {
        console.error('Error saving daily production:', error);
        res.status(500).json({ error: 'Failed to save daily production.' });
    }
});

app.get('/daily-production/:date', async(req, res) => {
    try {
        const { date } = req.params;
        console.log('Fetching data for date:', date);

        // Check if this is a valid date format (YYYY-MM-DD)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({
                error: 'Invalid date format. Please use YYYY-MM-DD format.'
            });
        }

        // Ensure consistent date handling by creating start and end of day
        const startDate = new Date(date);
        startDate.setUTCHours(0, 0, 0, 0);

        const endDate = new Date(date);
        endDate.setUTCHours(23, 59, 59, 999);

        // Find records with date between start and end of the requested day
        const dailyProduction = await DailyProduction.findOne({
            date: { $gte: startDate, $lte: endDate }
        });

        if (!dailyProduction) {
            return res.json({ jobs: [], independentProductionEntries: [] });
        }

        res.json({
            date: dailyProduction.date,
            jobs: dailyProduction.jobs,
            independentProductionEntries: dailyProduction.independentProductionEntries || []
        });
    } catch (error) {
        console.error('Error fetching daily production:', error);
        res.status(500).json({ error: 'Failed to fetch daily production data' });
    }
});

// Add a new job
app.post('/daily-production/job', async(req, res) => {
    try {
        // Accept both legacy and new payloads
        let date, jobData;
        if (req.body.date && req.body.jobData) {
            date = req.body.date;
            jobData = req.body.jobData;
        } else {
            // Support flat payloads from frontend: all job fields + currentDate
            date = req.body.currentDate || req.body.date;
            jobData = {...req.body };
            delete jobData.currentDate;
            delete jobData.date;
        }
        if (!date) {
            return res.status(400).json({ error: 'Date is required to save job.' });
        }
        console.log('Adding new job:', { date, jobData });
        // Ensure consistent date handling
        const startDate = new Date(date);
        if (isNaN(startDate)) {
            return res.status(400).json({ error: 'Invalid date format.' });
        }
        startDate.setUTCHours(0, 0, 0, 0);
        const endDate = new Date(startDate);
        endDate.setUTCHours(23, 59, 59, 999);
        // Find if entry exists for this date
        let dailyProduction = await DailyProduction.findOne({
            date: { $gte: startDate, $lte: endDate }
        });

        if (dailyProduction) {
            // Enforce unique jobCardNo per date
            if (dailyProduction.jobs.some(job => job.jobCardNo === jobData.jobCardNo)) {
                return res.status(400).json({ error: 'Duplicate job card number found for this date. Please use a different job card number.' });
            }
            // Add new job to existing date
            dailyProduction.jobs.push(jobData);
        } else {
            // Create new record for this date with the job
            dailyProduction = new DailyProduction({
                date: startDate, // Use the start of day for consistency
                jobs: [jobData],
                independentProductionEntries: [] // Always initialize, but do not touch it here
            });
        }
        try {
            await dailyProduction.save();
            console.log('Job saved successfully');
            res.status(200).json({
                message: 'Job saved successfully',
                jobs: dailyProduction.jobs,
                independentProductionEntries: dailyProduction.independentProductionEntries || []
            });
        } catch (err) {
            // Handle specific MongoDB errors
            console.error('MongoDB Error:', err);
            res.status(500).json({ error: 'Database error occurred while saving job.' });
        }
    } catch (error) {
        console.error('Error in job creation:', error);
        res.status(500).json({ error: 'Failed to process job creation request.' });
    }
});

// Update a job by its ID (ignores date param)
app.put('/daily-production/job/:jobId', async(req, res) => {
    try {
        const { jobId } = req.params;
        console.log(`Updating job with ID: ${jobId}`);
        // Prepare update data (flat payload)
        const updateData = {...req.body };
        delete updateData.currentDate;
        delete updateData.date;
        // Find containing document
        const dailyProduction = await DailyProduction.findOne({ 'jobs._id': jobId });
        if (!dailyProduction) {
            return res.status(404).json({ error: 'Job not found' });
        }
        // Locate and update the job
        const index = dailyProduction.jobs.findIndex(job => job._id.toString() === jobId);
        const existingEntries = dailyProduction.jobs[index].productionEntries || [];
        dailyProduction.jobs[index] = {
            ...updateData,
            _id: dailyProduction.jobs[index]._id,
            productionEntries: existingEntries
        };
        await dailyProduction.save();
        console.log('Job updated successfully');
        return res.status(200).json({
            message: 'Job updated successfully',
            jobs: dailyProduction.jobs,
            independentProductionEntries: dailyProduction.independentProductionEntries || []
        });
    } catch (error) {
        console.error('Error updating job:', error);
        res.status(500).json({ error: 'Failed to update job' });
    }
});

// Delete a job by its MongoDB ID (ignores date param)
app.delete('/daily-production/job/:jobId', async(req, res) => {
    try {
        const { jobId } = req.params;
        console.log(`Deleting job with ID: ${jobId}`);
        // Find the document containing this job
        const dailyProduction = await DailyProduction.findOne({ 'jobs._id': jobId });
        if (!dailyProduction) {
            return res.status(404).json({ error: 'Job not found' });
        }
        // Remove only the job, not associated production entries
        dailyProduction.jobs = dailyProduction.jobs.filter(job => job._id.toString() !== jobId);
        // Do NOT remove independent production entries - they should remain unchanged
        await dailyProduction.save();
        console.log('Job deleted successfully');
        res.status(200).json({
            message: 'Job deleted successfully',
            jobs: dailyProduction.jobs,
            independentProductionEntries: dailyProduction.independentProductionEntries
        });
    } catch (error) {
        console.error('Error deleting job:', error);
        res.status(500).json({ error: 'Failed to delete job' });
    }
});

// Save production entries independently of jobs
app.put('/daily-production/production-independent', async(req, res) => {
    try {
        const { date, productionEntries } = req.body;
        if (!date || !productionEntries || !Array.isArray(productionEntries)) {
            return res.status(400).json({ error: 'Both date and productionEntries (array) are required.' });
        }
        // Ensure consistent date handling
        const startDate = new Date(date);
        startDate.setUTCHours(0, 0, 0, 0);

        // Find or create the daily production document for the date
        let dailyProduction = await DailyProduction.findOne({ date: startDate });
        if (!dailyProduction) {
            dailyProduction = new DailyProduction({ date: startDate, jobs: [], independentProductionEntries: productionEntries });
        } else {
            // Always save entries as provided, even if empty/default
            dailyProduction.independentProductionEntries = productionEntries;
        }
        await dailyProduction.save();
        res.json({
            message: 'Production entries saved independently',
            productionEntries: dailyProduction.independentProductionEntries,
            jobs: dailyProduction.jobs
        });
    } catch (error) {
        console.error('Error saving independent production entries:', error);
        console.error('STACK:', error.stack);
        res.status(500).json({ error: 'Failed to save independent production entries', details: error.message || 'Unknown error' });
    }
});

// Update production entries
app.put('/daily-production/production/:jobCardNo', async(req, res) => {
    try {
        const { date, productionEntries } = req.body;
        const { jobCardNo } = req.params;
        console.log('Saving production entries for job:', jobCardNo);

        // Ensure consistent date handling
        const startDate = new Date(date);
        startDate.setUTCHours(0, 0, 0, 0);

        const endDate = new Date(date);
        endDate.setUTCHours(23, 59, 59, 999);

        // Find the daily production document
        let dailyProduction = await DailyProduction.findOne({
            date: { $gte: startDate, $lte: endDate }
        });

        if (!dailyProduction) {
            return res.status(404).json({ error: 'No jobs found for this date' });
        }

        // Find the job and update its production entries
        const jobIndex = dailyProduction.jobs.findIndex(job => job.jobCardNo === jobCardNo);
        if (jobIndex === -1) {
            return res.status(404).json({ error: 'Job not found' });
        }

        // Update the production entries
        dailyProduction.jobs[jobIndex].productionEntries = productionEntries;

        // Save to MongoDB
        await dailyProduction.save();
        console.log('Production entries saved successfully');

        res.json({
            message: 'Production entries saved successfully',
            jobs: dailyProduction.jobs,
            independentProductionEntries: dailyProduction.independentProductionEntries || []
        });

    } catch (error) {
        console.error('Error saving production entries:', error);
        res.status(500).json({ error: 'Failed to save production entries' });
    }
});

// Get the most recent job data for a specific jobCardNo
app.get('/daily-production/job/latest/:jobCardNo', async(req, res) => {
    try {
        const { jobCardNo } = req.params;
        // Find records containing this job and sort by date descending
        const records = await DailyProduction.find({ 'jobs.jobCardNo': jobCardNo })
            .sort({ date: -1 })
            .limit(1);
        if (records.length === 0) {
            return res.status(404).json({ error: 'Job not found' });
        }
        const doc = records[0];
        const job = doc.jobs.find(j => j.jobCardNo === jobCardNo);
        res.json({ date: doc.date, jobData: job, independentEntries: doc.independentProductionEntries || [] });
    } catch (error) {
        console.error('Error fetching latest job:', error);
        res.status(500).json({ error: 'Failed to fetch latest job data' });
    }
});

// Get all production entries for a specific jobCardNo across all dates
app.get('/daily-production/entries/:jobCardNo', async(req, res) => {
    try {
        const { jobCardNo } = req.params;
        console.log(`Fetching production entries for job card: ${jobCardNo}`);

        // Find all daily production records containing this job card number in their entries
        const records = await DailyProduction.find().sort({ date: -1 }); // Get ALL records, sorted by date desc

        // Extract all matching production entries from all dates
        let allEntries = [];
        records.forEach(record => {
            // Convert date to string for easier display
            const dateStr = new Date(record.date).toISOString().split('T')[0];

            const matchingEntries = record.independentProductionEntries.filter(
                entry => entry.jobCardNo === jobCardNo
            ).map(entry => ({
                ...entry.toObject(),
                date: dateStr // Add formatted date from parent record
            }));

            allEntries = [...allEntries, ...matchingEntries];
        });

        // Sort entries by date (newest first)
        allEntries = allEntries.sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });

        console.log(`Found ${allEntries.length} production entries with job card number ${jobCardNo}`);
        res.json({ entries: allEntries });
    } catch (error) {
        console.error('Error fetching production entries:', error);
        res.status(500).json({ error: 'Failed to fetch production entries' });
    }
});

// Calendar API Routes (using Mongoose)
app.use('/api/calendar', require('./routes/calendarRoutes'));

// Job report endpoint is now handled by routes/jobRoutes.js under '/job/report/:jobCardNo'

// Mount the form-submit router
app.use("/form-submit", require("./models/mpbackend"));

// Start the server
app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});
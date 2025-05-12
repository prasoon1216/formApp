const express = require('express');
const router = express.Router();
const { DailyProduction } = require('../models/formbackend');
const fs = require('fs');
const path = require('path');

// Enhanced: Audit log for job deletion
function logJobDeletion(jobId, user) {
    const logPath = path.join(__dirname, '../../audit.log');
    const logEntry = `[${new Date().toISOString()}] Job deleted: ${jobId} by ${user || 'unknown'}\n`;
    fs.appendFileSync(logPath, logEntry);
}

// DELETE a job by jobId (MongoDB _id)
router.delete('/:jobId', async(req, res) => {
    try {
        const { jobId } = req.params;
        // Find the document containing the job
        const doc = await DailyProduction.findOne({ 'jobs._id': jobId });
        if (!doc) {
            return res.status(404).json({ message: 'Job not found' });
        }
        // Remove the job from the jobs array
        doc.jobs = doc.jobs.filter(job => String(job._id) !== String(jobId));
        await doc.save();
        logJobDeletion(jobId, req.user ? req.user.username : null); // Audit log
        res.status(200).json({ message: 'Job deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete job', error: error.message });
    }
});

router.get('/report/:jobCardNo', async(req, res) => {
    try {
        const jobCardNoQuery = String(req.params.jobCardNo).trim();
        console.log('Searching for jobCardNo:', jobCardNoQuery);

        // Find all documents containing this job card number
        const docs = await DailyProduction.find({ 'jobs.jobCardNo': { $regex: `^${jobCardNoQuery}$`, $options: 'i' } });

        // Extract all matching jobs
        const jobs = [];
        docs.forEach(doc => {
            doc.jobs.forEach(job => {
                if (job.jobCardNo && job.jobCardNo.trim() === jobCardNoQuery) {
                    jobs.push({
                        ...job.toObject(),
                        date: doc.date
                    });
                }
            });
        });

        // Sort jobs by date (newest first)
        jobs.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({ jobs });
    } catch (error) {
        console.error('Error fetching job report:', error);
        res.status(500).json({ message: 'Failed to fetch job report' });
    }
});

// DEBUG: List all job card numbers and their dates
router.get('/debug/jobcardnos', async(req, res) => {
    const docs = await DailyProduction.find({});
    const allJobCardNos = [];
    docs.forEach(doc => {
        doc.jobs.forEach(job => {
            allJobCardNos.push({ jobCardNo: job.jobCardNo, date: doc.date });
        });
    });
    res.json(allJobCardNos);
});

// GET all jobs and production entries for OEE Dashboard
router.get('/all-reports', async(req, res) => {
    try {
        const docs = await DailyProduction.find({});
        const allJobs = [];
        docs.forEach(doc => {
            doc.jobs.forEach(job => {
                allJobs.push({
                    ...job.toObject(),
                    date: doc.date
                });
            });
        });
        res.status(200).json(allJobs);
    } catch (error) {
        console.error('Error fetching all reports:', error);
        res.status(500).json({ message: 'Failed to fetch records' });
    }
});

// Search jobs by part name
router.get('/search/part/:partName', async(req, res) => {
    try {
        const partNameQuery = decodeURIComponent(req.params.partName).trim();
        console.log('Searching for part name:', partNameQuery);

        // Find all documents containing this part name
        const docs = await DailyProduction.find({
            'jobs.partName': { $regex: partNameQuery, $options: 'i' }
        });

        // Extract all matching jobs
        const jobs = [];
        docs.forEach(doc => {
            doc.jobs.forEach(job => {
                if (job.partName && job.partName.toLowerCase().includes(partNameQuery.toLowerCase())) {
                    jobs.push({
                        ...job.toObject(),
                        date: doc.date
                    });
                }
            });
        });

        // Sort jobs by date (newest first)
        jobs.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({ jobs });
    } catch (error) {
        console.error('Error searching jobs by part name:', error);
        res.status(500).json({ message: 'Failed to search jobs by part name' });
    }
});

// GET all job card numbers
router.get('/all-job-card-numbers', async(req, res) => {
    try {
        const docs = await DailyProduction.find({});
        const allJobCardNos = new Set();

        docs.forEach(doc => {
            doc.jobs.forEach(job => {
                if (job.jobCardNo) {
                    allJobCardNos.add(job.jobCardNo.trim());
                }
            });
        });

        // Convert Set to Array and sort
        const sortedJobCardNos = Array.from(allJobCardNos).sort();

        res.json(sortedJobCardNos);
    } catch (error) {
        console.error('Error fetching all job card numbers:', error);
        res.status(500).json({ message: 'Failed to fetch job card numbers' });
    }
});

module.exports = router;
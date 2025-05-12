const mongoose = require('mongoose');

// Schema for production entries
const productionEntrySchema = new mongoose.Schema({
  sNo: Number,
  jobCardNo: { type: String }, // Add jobCardNo for filtering production entries
  partNameNo: { type: String }, // Make Part Name (No.) required
  oprNo: { type: String }, // Make Operation Number required
  planLotQty: String,
  startDate: String,
  targetDate: String,
  actualDate: String,
  target90OEE: String,
  actualProdQty: String,
  targetProdQty: String,
  rejectionQty: String,
  cycleTimeMin: String,
  targetSettingTimeHr: String,
  trgDurationHrs: String,
  actDurationHrs: String,
  extraMeal: String,
  actDurationForOEE: String,
  diffHrs: String,
  mcRefTimeExer: String,
  teaLunchBreak: String,
  meetingTraining: String,
  extraSettTime: String,
  chipDispTime: String,
  toolChangeSettingTime: String,
  insertChangeTime: String,
  drillChangeTime: String,
  tapChangeTime: String,
  diamenProbTime: String,
  qcCheckTime: String,
  operatorProbTime: String,
  powerCutTime: String,
  airPressureLowTime: String,
  ctReduceTime: String,
  mcHoldTime: String,
  prodLossTime: String,
  progEditMakeTime: String,
  rawMtlShortageTime: String,
  reworkEndPcsMachiningTime: String,
  mcAlarmTime: String,
  mcMaintTime: String,
  totalLossInHrs: String,
  remarks: String // Added remarks field
});

// Schema for job
const jobSchema = new mongoose.Schema({
  jobNo: { type: String, required: true },
  mcNo: { type: String, required: true },
  jobCardNo: { 
    type: String, 
    required: true
  },
  partName: { type: String, required: true },
  partNo: String,
  opNo: String,
  targetPHrs: String,
  targetProd: String,
  actualProd: String,
  cycleTime: String,
  setter: String,
  targetSettingTime: String,
  lotQty: String,
  productionEntries: [productionEntrySchema]
});

// Enhanced: Cascade delete production entries when job is deleted
jobSchema.pre('remove', async function(next) {
  // If productionEntries are subdocuments, Mongoose will handle their removal
  // If they are referenced, you would remove them here
  next();
});

// Schema for daily production data
const dailyProductionSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  jobs: [jobSchema],
  independentProductionEntries: [productionEntrySchema] // <-- Added to persist independent entries
});

// Create index for date only for efficient querying
dailyProductionSchema.index({ date: 1 });

// Add a non-unique index on jobs.jobCardNo for efficient search (but not unique)
dailyProductionSchema.index({ 'jobs.jobCardNo': 1 });

// Explicitly ensure there's NO unique index on jobCardNo
const DailyProduction = mongoose.model('DailyProduction', dailyProductionSchema);

// Drop any existing unique indexes on jobCardNo that might be causing problems
async function removeUniqueConstraints() {
  try {
    const db = mongoose.connection.db;
    // Check if the collection exists first
    const collections = await db.listCollections({ name: 'dailyproductions' }).toArray();
    
    if (collections.length > 0) {
      console.log('Checking for and removing unique constraints on jobCardNo');
      // Get all indexes
      const indexes = await db.collection('dailyproductions').indexes();
      
      // Find and drop any index that might be enforcing uniqueness on jobCardNo
      for (const index of indexes) {
        if (index.name.includes('jobCardNo') || 
            (index.key && index.key['jobs.jobCardNo']) || 
            index.unique === true) {
          console.log(`Dropping index: ${index.name}`);
          await db.collection('dailyproductions').dropIndex(index.name);
        }
      }
      console.log('Unique constraints removal completed');
    }
  } catch (error) {
    console.error('Error removing unique constraints:', error);
  }
}

// Export the model and the function to remove constraints
module.exports = { DailyProduction, removeUniqueConstraints };
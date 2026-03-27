const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  jobId:              { type: String, unique: true, index: true },
  title:              { type: String, required: true },
  company:            { type: String, required: true },
  location:           String,
  salary:             String,
  currency:           { type: String, default: 'USD' },
  description:        String,
  requiredExperience: Number,
  skills:             [String],
  jobType:            String,
  workMode:           String,
  source:             { type: String, enum: ['jsearch', 'cache', 'demo'], default: 'jsearch' },
  url:                String,
  postedDate:         Date,
  fetchedAt:          { type: Date, default: Date.now, index: true },
}, {
  timestamps: true,
});

JobSchema.index({ skills: 1 });
JobSchema.index({ company: 1 });

module.exports = mongoose.model('Job', JobSchema);

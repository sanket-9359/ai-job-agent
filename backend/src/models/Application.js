const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['pending', 'applied', 'interview', 'rejected', 'offer'],
    default: 'pending',
  },
  savedAt:    { type: Date, default: Date.now, index: true },
  appliedAt:  { type: Date, default: null },
  reminderAt: { type: Date, default: null },
  generatedEmail: { type: String, default: '' },
  generatedAnalysis: {
    strongPoints: [String],
    weakPoints:   [String],
    suggestions:  [String],
    rawText:      { type: String, default: '' },
  },
  notes: { type: String, default: '' },
}, {
  timestamps: true,
});

ApplicationSchema.index({ status: 1 });
ApplicationSchema.index({ savedAt: -1 });

module.exports = mongoose.model('Application', ApplicationSchema);

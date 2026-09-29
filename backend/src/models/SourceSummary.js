import mongoose from 'mongoose';

const KeyClaimSchema = new mongoose.Schema({
  claim: { type: String, required: true },
  evidence: { type: String, default: '' },
  importance: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium',
  },
}, { _id: false });

const StatisticSchema = new mongoose.Schema({
  value: { type: String, required: true },
  context: { type: String, default: '' },
}, { _id: false });

const SourceSummarySchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResearchSession',
    required: true,
    index: true,
  },
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Source',
    required: true,
    index: true,
  },
  summary: {
    type: String,
    required: true,
  },
  keyClaims: [KeyClaimSchema],
  statistics: [StatisticSchema],
  limitations: [{ type: String }],
}, {
  timestamps: true,
});

SourceSummarySchema.index({ sessionId: 1, sourceId: 1 }, { unique: true });

export const SourceSummary = mongoose.model('SourceSummary', SourceSummarySchema);

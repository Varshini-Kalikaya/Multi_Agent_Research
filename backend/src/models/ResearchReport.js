import mongoose from 'mongoose';

const CitationReferenceSchema = new mongoose.Schema({
  citationId: { type: String, required: true }, // e.g. "S1"
  sourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Source' },
  title: { type: String, required: true },
  url: { type: String, required: true },
  domain: { type: String, default: '' },
  publishedAt: { type: String, default: null },
  sourceType: { type: String, default: 'unknown' },
}, { _id: false });

const ResearchReportSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResearchSession',
    required: true,
    unique: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  executiveSummary: {
    type: String,
    required: true,
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  markdown: {
    type: String,
    default: '',
  },
  citations: [CitationReferenceSchema],
  limitations: [{ type: String }],
}, {
  timestamps: true,
});

export const ResearchReport = mongoose.model('ResearchReport', ResearchReportSchema);

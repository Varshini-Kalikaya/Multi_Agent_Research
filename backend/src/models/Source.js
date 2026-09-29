import mongoose from 'mongoose';

export const SourceType = {
  NEWS: 'news',
  RESEARCH: 'research',
  GOVERNMENT: 'government',
  COMPANY: 'company',
  BLOG: 'blog',
  UNKNOWN: 'unknown',
};

export const SourceStatus = {
  DISCOVERED: 'discovered',
  PROCESSED: 'processed',
  INACCESSIBLE: 'inaccessible',
  FAILED: 'failed',
};

const SourceSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResearchSession',
    required: true,
    index: true,
  },
  subQuestionId: {
    type: String,
    required: true,
    index: true,
  },
  citationId: {
    type: String,
    required: true,
    trim: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  url: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  domain: {
    type: String,
    trim: true,
  },
  snippet: {
    type: String,
    default: '',
  },
  content: {
    type: String,
    default: '',
  },
  sourceType: {
    type: String,
    enum: Object.values(SourceType),
    default: SourceType.UNKNOWN,
  },
  publishedAt: {
    type: String,
    default: null,
  },
  relevanceScore: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: Object.values(SourceStatus),
    default: SourceStatus.DISCOVERED,
    index: true,
  },
}, {
  timestamps: true,
});

// Composite index to prevent duplicates within the same session
SourceSchema.index({ sessionId: 1, url: 1 }, { unique: true });
SourceSchema.index({ sessionId: 1, citationId: 1 });

export const Source = mongoose.model('Source', SourceSchema);

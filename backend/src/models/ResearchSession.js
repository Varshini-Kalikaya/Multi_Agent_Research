import mongoose from 'mongoose';

export const ResearchSessionStatus = {
  CREATED: 'CREATED',
  PLANNING: 'PLANNING',
  SEARCHING: 'SEARCHING',
  PROCESSING_SOURCES: 'PROCESSING_SOURCES',
  SUMMARIZING: 'SUMMARIZING',
  FACT_CHECKING: 'FACT_CHECKING',
  WRITING: 'WRITING',
  VALIDATING: 'VALIDATING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
};

const SubQuestionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  question: { type: String, required: true },
  searchQueries: [{ type: String }],
  evidenceType: { type: String, default: 'general' },
}, { _id: false });

const ResearchPlanSchema = new mongoose.Schema({
  researchTopic: { type: String },
  objective: { type: String },
  subQuestions: [SubQuestionSchema],
}, { _id: false });

const ResearchSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  topic: {
    type: String,
    required: [true, 'Research topic is required'],
    trim: true,
    maxlength: [500, 'Topic must not exceed 500 characters'],
  },
  status: {
    type: String,
    enum: Object.values(ResearchSessionStatus),
    default: ResearchSessionStatus.CREATED,
    index: true,
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  currentStep: {
    type: String,
    default: 'Session created',
  },
  researchPlan: {
    type: ResearchPlanSchema,
    default: null,
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  error: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

ResearchSessionSchema.index({ createdAt: -1 });

export const ResearchSession = mongoose.model('ResearchSession', ResearchSessionSchema);

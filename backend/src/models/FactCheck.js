import mongoose from 'mongoose';

const ContradictionSchema = new mongoose.Schema({
  claimA: { type: String, required: true },
  sourceA: { type: String, required: true }, // e.g., "[S1]"
  claimB: { type: String, required: true },
  sourceB: { type: String, required: true }, // e.g., "[S3]"
  explanation: { type: String, required: true },
  resolution: { type: String, default: '' },
}, { _id: false });

const ClaimItemSchema = new mongoose.Schema({
  claim: { type: String, required: true },
  supportingSources: [{ type: String }], // citationIds like ["S1", "S2"]
  confidence: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['verified', 'supported', 'disputed', 'insufficient_evidence', 'unsupported'],
    default: 'supported',
  },
  notes: { type: String, default: '' },
}, { _id: false });

const FactCheckSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResearchSession',
    required: true,
    unique: true,
    index: true,
  },
  verifiedClaims: [ClaimItemSchema],
  disputedClaims: [ClaimItemSchema],
  unsupportedClaims: [ClaimItemSchema],
  contradictions: [ContradictionSchema],
}, {
  timestamps: true,
});

export const FactCheck = mongoose.model('FactCheck', FactCheckSchema);

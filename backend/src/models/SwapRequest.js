import mongoose from 'mongoose';

export const SwapStatus = Object.freeze({
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED'
});

const swapRequestSchema = new mongoose.Schema(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mySlot: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    theirSlot: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    status: { type: String, enum: Object.values(SwapStatus), default: SwapStatus.PENDING, index: true }
  },
  { timestamps: true }
);

// Prevent a slot from being part of more than one PENDING request concurrently
swapRequestSchema.index(
  { mySlot: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'PENDING' } }
);
swapRequestSchema.index(
  { theirSlot: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'PENDING' } }
);

export const SwapRequest = mongoose.model('SwapRequest', swapRequestSchema);



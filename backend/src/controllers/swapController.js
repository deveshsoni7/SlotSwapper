import mongoose from 'mongoose';
import { Event, EventStatus } from '../models/Event.js';
import { SwapRequest, SwapStatus } from '../models/SwapRequest.js';

export async function listSwappableSlots(req, res) {
  const events = await Event.find({ owner: { $ne: req.user._id }, status: EventStatus.SWAPPABLE })
    .select('title startTime endTime owner status')
    .sort({ startTime: 1 })
    .populate('owner', 'name email')
    .lean();
  res.json({ events });
}

export async function requestSwap(req, res) {
  const { mySlotId, theirSlotId } = req.body;
  if (!mySlotId || !theirSlotId) return res.status(400).json({ message: 'Missing slot ids' });

  // Transaction with conditional updates to avoid races
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Lock mySlot: ensure ownership + SWAPPABLE -> set to SWAP_PENDING
    const mySlot = await Event.findOneAndUpdate(
      { _id: mySlotId, owner: req.user._id, status: EventStatus.SWAPPABLE },
      { $set: { status: EventStatus.SWAP_PENDING } },
      { new: true, session }
    );
    if (!mySlot) throw new Error('My slot not swappable');

    // Lock theirSlot: ensure it's not mine + SWAPPABLE -> set to SWAP_PENDING
    const theirSlot = await Event.findOneAndUpdate(
      { _id: theirSlotId, owner: { $ne: req.user._id }, status: EventStatus.SWAPPABLE },
      { $set: { status: EventStatus.SWAP_PENDING } },
      { new: true, session }
    );
    if (!theirSlot) throw new Error('Their slot not swappable');

    const reqDoc = await SwapRequest.create([
      {
        requester: req.user._id,
        recipient: theirSlot.owner,
        mySlot: mySlot._id,
        theirSlot: theirSlot._id,
        status: SwapStatus.PENDING
      }
    ], { session });

    await session.commitTransaction();
    res.status(201).json({ request: reqDoc[0] });
  } catch (e) {
    await session.abortTransaction();
    res.status(400).json({ message: e?.message || 'Failed to create request' });
  } finally {
    session.endSession();
  }
}

export async function respondSwap(req, res) {
  const { requestId } = req.params;
  const { accept } = req.body;
  const request = await SwapRequest.findById(requestId).lean();
  if (!request) return res.status(404).json({ message: 'Request not found' });
  if (request.recipient.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Forbidden' });
  if (request.status !== SwapStatus.PENDING) return res.status(400).json({ message: 'Already handled' });

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const mySlot = await Event.findById(request.mySlot).session(session);
    const theirSlot = await Event.findById(request.theirSlot).session(session);
    if (!mySlot || !theirSlot) throw new Error('Slots missing');

    if (!accept) {
      await SwapRequest.updateOne({ _id: request._id, status: SwapStatus.PENDING }, { $set: { status: SwapStatus.REJECTED } }, { session });
      await Event.updateOne({ _id: mySlot._id, status: EventStatus.SWAP_PENDING }, { $set: { status: EventStatus.SWAPPABLE } }, { session });
      await Event.updateOne({ _id: theirSlot._id, status: EventStatus.SWAP_PENDING }, { $set: { status: EventStatus.SWAPPABLE } }, { session });
      await session.commitTransaction();
      return res.json({ request: { ...request, status: SwapStatus.REJECTED } });
    }

    // Accept: ensure expected owners, then swap owners and set BUSY
    const requesterId = request.requester.toString();
    const recipientId = request.recipient.toString();
    if (mySlot.owner.toString() !== requesterId || theirSlot.owner.toString() !== recipientId) {
      throw new Error('Slot ownership changed during request');
    }

    const myOwner = mySlot.owner;
    const theirOwner = theirSlot.owner;

    await Event.updateOne({ _id: mySlot._id }, { $set: { owner: theirOwner, status: EventStatus.BUSY } }, { session });
    await Event.updateOne({ _id: theirSlot._id }, { $set: { owner: myOwner, status: EventStatus.BUSY } }, { session });
    await SwapRequest.updateOne({ _id: request._id, status: SwapStatus.PENDING }, { $set: { status: SwapStatus.ACCEPTED } }, { session });

    // Optional cleanup: any other pending requests involving these slots become REJECTED
    await SwapRequest.updateMany(
      {
        _id: { $ne: request._id },
        status: SwapStatus.PENDING,
        $or: [{ mySlot: { $in: [mySlot._id, theirSlot._id] } }, { theirSlot: { $in: [mySlot._id, theirSlot._id] } }]
      },
      { $set: { status: SwapStatus.REJECTED } },
      { session }
    );

    await session.commitTransaction();
    res.json({ request: { ...request, status: SwapStatus.ACCEPTED } });
  } catch (e) {
    await session.abortTransaction();
    res.status(400).json({ message: e?.message || 'Failed to handle swap' });
  } finally {
    session.endSession();
  }
}

export async function listIncoming(req, res) {
  const requests = await SwapRequest.find({ recipient: req.user._id })
    .select('status mySlot theirSlot requester createdAt')
    .sort({ createdAt: -1 })
    .populate('mySlot', 'title startTime endTime')
    .populate('theirSlot', 'title startTime endTime')
    .populate('requester', 'name email')
    .lean();
  res.json({ requests });
}

export async function listOutgoing(req, res) {
  const requests = await SwapRequest.find({ requester: req.user._id })
    .select('status mySlot theirSlot recipient createdAt')
    .sort({ createdAt: -1 })
    .populate('mySlot', 'title startTime endTime')
    .populate('theirSlot', 'title startTime endTime')
    .populate('recipient', 'name email')
    .lean();
  res.json({ requests });
}



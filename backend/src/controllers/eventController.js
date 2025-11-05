import { Event, EventStatus } from '../models/Event.js';

export async function listMyEvents(req, res) {
  const events = await Event.find({ owner: req.user._id }).sort({ startTime: 1 });
  res.json({ events });
}

export async function createEvent(req, res) {
  const { title, startTime, endTime, status } = req.body;
  if (!title || !startTime || !endTime) return res.status(400).json({ message: 'Missing fields' });
  const event = await Event.create({ title, startTime, endTime, status: status || EventStatus.BUSY, owner: req.user._id });
  res.status(201).json({ event });
}

export async function updateEvent(req, res) {
  const { id } = req.params;
  const event = await Event.findOne({ _id: id, owner: req.user._id });
  if (!event) return res.status(404).json({ message: 'Not found' });
  const fields = ['title', 'startTime', 'endTime', 'status'];
  for (const f of fields) if (f in req.body) event[f] = req.body[f];
  await event.save();
  res.json({ event });
}

export async function deleteEvent(req, res) {
  const { id } = req.params;
  const event = await Event.findOneAndDelete({ _id: id, owner: req.user._id });
  if (!event) return res.status(404).json({ message: 'Not found' });
  res.json({ ok: true });
}



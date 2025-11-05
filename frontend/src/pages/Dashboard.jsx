import { useEffect, useState } from 'react';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

function EventItem({ event, onUpdate, onDelete }) {
  return (
    <div className="border rounded p-3 flex items-center justify-between">
      <div>
        <div className="font-medium">{event.title}</div>
        <div className="text-sm text-gray-600">{new Date(event.startTime).toLocaleString()} — {new Date(event.endTime).toLocaleString()}</div>
        <div className="text-xs mt-1">Status: <span className="font-medium">{event.status}</span></div>
      </div>
      <div className="flex gap-2">
        {event.status === 'BUSY' && (
          <button className="px-2 py-1 bg-blue-600 text-white rounded" onClick={()=>onUpdate(event._id, { status: 'SWAPPABLE' })}>Make Swappable</button>
        )}
        {event.status === 'SWAPPABLE' && (
          <button className="px-2 py-1 bg-gray-600 text-white rounded" onClick={()=>onUpdate(event._id, { status: 'BUSY' })}>Make Busy</button>
        )}
        <button className="px-2 py-1 bg-red-600 text-white rounded" onClick={()=>onDelete(event._id)}>Delete</button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { token } = useAuth();
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ title: '', startTime: '', endTime: '' });

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data } = await api.get('/events');
      setEvents(data.events);
    })();
  }, [token]);

  async function createEvent(e) {
    e.preventDefault();
    const { data } = await api.post('/events', form);
    setEvents((prev) => [...prev, data.event]);
    setForm({ title: '', startTime: '', endTime: '' });
  }

  async function updateEvent(id, patch) {
    const { data } = await api.put(`/events/${id}`, patch);
    setEvents((prev) => prev.map((ev) => (ev._id === id ? data.event : ev)));
  }

  async function deleteEvent(id) {
    await api.delete(`/events/${id}`);
    setEvents((prev) => prev.filter((ev) => ev._id !== id));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">My Events</h1>
      <form onSubmit={createEvent} className="bg-white p-4 rounded shadow grid grid-cols-1 md:grid-cols-4 gap-3">
        <input className="border p-2 rounded" placeholder="Title" value={form.title} onChange={(e)=>setForm({...form, title: e.target.value})} />
        <input className="border p-2 rounded" type="datetime-local" value={form.startTime} onChange={(e)=>setForm({...form, startTime: e.target.value})} />
        <input className="border p-2 rounded" type="datetime-local" value={form.endTime} onChange={(e)=>setForm({...form, endTime: e.target.value})} />
        <button className="bg-gray-900 text-white rounded px-3">Add</button>
      </form>
      <div className="space-y-3">
        {events.map((ev) => (
          <EventItem key={ev._id} event={ev} onUpdate={updateEvent} onDelete={deleteEvent} />
        ))}
        {events.length === 0 && <div className="text-gray-500">No events yet.</div>}
      </div>
    </div>
  );
}



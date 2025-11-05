import { useEffect, useState } from 'react';
import api from '../lib/api.js';

export default function Requests() {
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);

  async function load() {
    const [a, b] = await Promise.all([
      api.get('/swap-requests/incoming'),
      api.get('/swap-requests/outgoing')
    ]);
    setIncoming(a.data.requests);
    setOutgoing(b.data.requests);
  }

  useEffect(() => { load(); }, []);

  async function respond(id, accept) {
    await api.post(`/swap-response/${id}`, { accept });
    await load();
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <h2 className="text-xl font-semibold mb-3">Incoming</h2>
        <div className="space-y-3">
          {incoming.map((r) => (
            <div key={r._id} className="bg-white p-3 rounded shadow">
              <div className="text-sm text-gray-700">From: {r.requester?.name}</div>
              <div className="mt-1 text-sm">They offer: <span className="font-medium">{r.mySlot?.title}</span></div>
              <div className="text-sm">For your: <span className="font-medium">{r.theirSlot?.title}</span></div>
              <div className="mt-2 text-xs">Status: {r.status}</div>
              {r.status === 'PENDING' && (
                <div className="mt-2 flex gap-2">
                  <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={()=>respond(r._id, true)}>Accept</button>
                  <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={()=>respond(r._id, false)}>Reject</button>
                </div>
              )}
            </div>
          ))}
          {incoming.length === 0 && <div className="text-gray-500">No incoming requests.</div>}
        </div>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-3">Outgoing</h2>
        <div className="space-y-3">
          {outgoing.map((r) => (
            <div key={r._id} className="bg-white p-3 rounded shadow">
              <div className="text-sm">You offered: <span className="font-medium">{r.mySlot?.title}</span></div>
              <div className="text-sm">For: <span className="font-medium">{r.theirSlot?.title}</span></div>
              <div className="mt-2 text-xs">Status: {r.status}</div>
            </div>
          ))}
          {outgoing.length === 0 && <div className="text-gray-500">No outgoing requests.</div>}
        </div>
      </div>
    </div>
  );
}



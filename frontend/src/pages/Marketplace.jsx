import { useEffect, useState } from 'react';
import api from '../lib/api.js';

export default function Marketplace() {
  const [swappable, setSwappable] = useState([]);
  const [mySwappable, setMySwappable] = useState([]);
  const [offerFor, setOfferFor] = useState(null);
  const [status, setStatus] = useState('');

  async function load() {
    const [a, b] = await Promise.all([
      api.get('/swappable-slots'),
      api.get('/events')
    ]);
    setSwappable(a.data.events);
    setMySwappable(b.data.events.filter((e) => e.status === 'SWAPPABLE'));
  }

  useEffect(() => { load(); }, []);

  async function requestSwap(theirSlotId, mySlotId) {
    setStatus('');
    await api.post('/swap-request', { mySlotId, theirSlotId });
    setStatus('Requested!');
    setOfferFor(null);
    await load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Marketplace</h1>
      {status && <div className="text-green-700">{status}</div>}
      <div className="space-y-3">
        {swappable.map((ev) => (
          <div key={ev._id} className="bg-white p-3 rounded shadow flex items-center justify-between">
            <div>
              <div className="font-medium">{ev.title} — by {ev.owner?.name}</div>
              <div className="text-sm text-gray-600">{new Date(ev.startTime).toLocaleString()} — {new Date(ev.endTime).toLocaleString()}</div>
            </div>
            <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={()=>setOfferFor(ev)}>Request Swap</button>
          </div>
        ))}
        {swappable.length === 0 && <div className="text-gray-500">No swappable slots available.</div>}
      </div>

      {offerFor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded p-4 w-full max-w-md">
            <div className="font-semibold mb-2">Offer one of your swappable slots</div>
            <div className="space-y-2 max-h-64 overflow-auto">
              {mySwappable.map((mine) => (
                <div key={mine._id} className="border p-2 rounded flex items-center justify-between">
                  <div>
                    <div className="font-medium">{mine.title}</div>
                    <div className="text-sm text-gray-600">{new Date(mine.startTime).toLocaleString()} — {new Date(mine.endTime).toLocaleString()}</div>
                  </div>
                  <button className="px-3 py-1 bg-gray-900 text-white rounded" onClick={()=>requestSwap(offerFor._id, mine._id)}>Offer</button>
                </div>
              ))}
              {mySwappable.length === 0 && <div className="text-gray-500">You have no swappable slots. Mark an event as swappable from your dashboard.</div>}
            </div>
            <div className="mt-3 text-right">
              <button className="px-3 py-1 rounded bg-gray-200" onClick={()=>setOfferFor(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



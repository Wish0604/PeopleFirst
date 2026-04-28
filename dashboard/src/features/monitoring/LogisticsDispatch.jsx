import React, { useState, useMemo } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

import { db } from '../../firebase';
import { useCollectionSnapshot } from '../../hooks/useCollectionSnapshot';

function formatLocation(location) {
  if (!location) return 'Unknown';

  if (typeof location === 'string') return location;

  const latitude = location.latitude ?? location._lat;
  const longitude = location.longitude ?? location._long;

  if (typeof latitude === 'number' && typeof longitude === 'number') {
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }

  return location.name || location.label || 'Unknown';
}

export default function LogisticsDispatch() {
  const responses = useCollectionSnapshot('responses');
  const [dispatchingId, setDispatchingId] = useState('');
  const [dispatchMessage, setDispatchMessage] = useState('');
  const [resourceType, setResourceType] = useState('RESCUE_TEAM');

  // Filter for users who need help and haven't been resolved
  const activeEmergencies = useMemo(() => {
    return responses
      .filter((r) => r.status === 'NEED_HELP')
      .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  }, [responses]);

  const handleDispatch = async (responseId, userId) => {
    if (!dispatchMessage.trim()) {
      alert("Please enter a dispatch instruction/message");
      return;
    }

    setDispatchingId(responseId);
    try {
      // 1. Log the dispatch action
      await addDoc(collection(db, 'dispatch_logs'), {
        responseId,
        targetUserId: userId,
        resourceType,
        message: dispatchMessage,
        status: 'DISPATCHED',
        createdAt: serverTimestamp(),
      });

      // 2. We could optionally write to a targeted user alert collection here 
      // or update the response status to "DISPATCHED".
      // For now, logging the dispatch is our coordination signal.

      setDispatchMessage('');
      alert(`Resource [${resourceType}] dispatched successfully!`);
    } catch (err) {
      console.error('Failed to dispatch:', err);
      alert('Error dispatching resource. Check console.');
    } finally {
      setDispatchingId('');
    }
  };

  return (
    <section className="panel">
      <h2>Logistics & Dispatch Signals</h2>
      <p className="muted">Coordinate rescue resources directly to active emergencies</p>

      <div className="alert-form" style={{ marginBottom: '20px' }}>
        <label>
          Resource Type
          <select value={resourceType} onChange={(e) => setResourceType(e.target.value)}>
            <option value="RESCUE_TEAM">Rescue Team (Boat/Airlift)</option>
            <option value="MEDICAL_SUPPLIES">Medical Supplies</option>
            <option value="WATER_FOOD">Water & Food Rations</option>
            <option value="EVAC_TRANSPORT">Evacuation Transport</option>
          </select>
        </label>
        
        <label>
          Coordination Instruction
          <input
            type="text"
            placeholder="E.g., Proceed to roof, helicopter ETA 10 mins"
            value={dispatchMessage}
            onChange={(e) => setDispatchMessage(e.target.value)}
          />
        </label>
      </div>

      <ul className="list">
        {activeEmergencies.map((r) => (
          <li key={r.id} className="list-item">
            <div className="row-inline" style={{ justifyContent: 'space-between' }}>
              <strong>User: {r.userId || r.id}</strong>
              <span className="status-badge critical">SOS</span>
            </div>
            
            <div className="muted" style={{ margin: '8px 0' }}>
              Loc: {formatLocation(r.location)}
            </div>

            <div className="task-actions" style={{ gridTemplateColumns: '1fr' }}>
              <button
                type="button"
                style={{ background: '#70f0b8', color: '#0b1020' }}
                disabled={dispatchingId === r.id || !dispatchMessage.trim()}
                onClick={() => handleDispatch(r.id, r.userId || r.id)}
              >
                {dispatchingId === r.id ? 'Dispatching...' : `Dispatch ${resourceType.replace('_', ' ')}`}
              </button>
            </div>
          </li>
        ))}
        {activeEmergencies.length === 0 && (
          <li className="muted">No active emergencies awaiting dispatch.</li>
        )}
      </ul>
    </section>
  );
}

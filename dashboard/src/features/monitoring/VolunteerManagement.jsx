import React, { useMemo, useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

import { db } from '../../firebase';
import { useCollectionSnapshot } from '../../hooks/useCollectionSnapshot';

const allAvailability = 'ALL';

export default function VolunteerManagement() {
  const volunteers = useCollectionSnapshot('volunteers');
  const [availabilityFilter, setAvailabilityFilter] = useState(allAvailability);
  const [updatingVolunteerId, setUpdatingVolunteerId] = useState('');

  const filteredVolunteers = useMemo(() => {
    if (availabilityFilter === allAvailability) {
      return volunteers;
    }
    
    const isAvailable = availabilityFilter === 'AVAILABLE';
    return volunteers.filter((vol) => vol.available === isAvailable);
  }, [volunteers, availabilityFilter]);

  const toggleVerification = async (volunteerId, currentVerified) => {
    setUpdatingVolunteerId(volunteerId);
    try {
      await updateDoc(doc(db, 'volunteers', volunteerId), {
        verified: !currentVerified,
        updatedAt: serverTimestamp(),
      });
    } finally {
      setUpdatingVolunteerId('');
    }
  };

  return (
    <section className="panel">
      <div className="panel-row">
        <h2>Volunteer Management</h2>
        <select value={availabilityFilter} onChange={(event) => setAvailabilityFilter(event.target.value)}>
          <option value={allAvailability}>All volunteers</option>
          <option value="AVAILABLE">Available Now</option>
          <option value="UNAVAILABLE">Unavailable</option>
        </select>
      </div>

      <ul className="list">
        {filteredVolunteers.map((vol) => (
          <li key={vol.id} className="list-item">
            <div className="row-inline" style={{ justifyContent: 'space-between' }}>
              <strong>{vol.name} {vol.verified && <span className="status-badge low">✓ Verified</span>}</strong>
              <span className={`status-badge ${vol.available ? 'low' : 'high'}`}>
                {vol.available ? 'AVAILABLE' : 'UNAVAILABLE'}
              </span>
            </div>
            <div className="muted">Phone: {vol.phone || 'Unknown'}</div>
            <div className="muted">Location: {vol.district ? `${vol.area ? vol.area + ', ' : ''}${vol.district}` : 'Unknown'}</div>
            <div className="muted">Skills: {(vol.skills || []).join(', ') || 'None'}</div>
            <div className="muted">Vehicle: {vol.vehicle || 'None'}</div>
            
            <div className="task-actions" style={{ marginTop: '8px' }}>
              <button
                type="button"
                disabled={updatingVolunteerId === vol.id}
                onClick={() => toggleVerification(vol.id, vol.verified)}
              >
                {vol.verified ? 'Revoke Verification' : 'Verify Volunteer'}
              </button>
            </div>
          </li>
        ))}
        {filteredVolunteers.length === 0 ? <li className="muted">No volunteers registered yet</li> : null}
      </ul>
    </section>
  );
}

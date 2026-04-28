import React, { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';

import { db } from '../../firebase';

export default function VolunteerPanel() {
  const [volunteers, setVolunteers] = useState([]);
  const [availabilityFilter, setAvailabilityFilter] = useState('ALL');
  const [skillFilter, setSkillFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'volunteers'), (snapshot) => {
      setVolunteers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return unsubscribe;
  }, []);

  const filteredVolunteers = useMemo(() => {
    return volunteers.filter((volunteer) => {
      if (availabilityFilter !== 'ALL') {
        const isAvailable = availabilityFilter === 'AVAILABLE';
        if (volunteer.available !== isAvailable) {
          return false;
        }
      }

      if (skillFilter.trim() !== '') {
        const searchSkill = skillFilter.toLowerCase();
        const hasSkill = volunteer.skills?.some(skill => 
          skill.toLowerCase().includes(searchSkill)
        );
        if (!hasSkill) {
          return false;
        }
      }

      if (locationFilter.trim() !== '') {
        const searchLocation = locationFilter.toLowerCase();
        const district = (volunteer.district || '').toLowerCase();
        const area = (volunteer.area || '').toLowerCase();
        if (!district.includes(searchLocation) && !area.includes(searchLocation)) {
          return false;
        }
      }

      return true;
    });
  }, [volunteers, availabilityFilter, skillFilter, locationFilter]);

  return (
    <section className="panel" style={{ gridColumn: '1 / -1' }}>
      <div className="panel-row" style={{ marginBottom: 12 }}>
        <h2>Volunteer Management</h2>
        <div className="row-inline" style={{ gap: 8 }}>
          <select 
            value={availabilityFilter} 
            onChange={(event) => setAvailabilityFilter(event.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">Available Now</option>
            <option value="UNAVAILABLE">Not Available</option>
          </select>
          <input
            type="text"
            placeholder="Filter by Skill..."
            value={skillFilter}
            onChange={(event) => setSkillFilter(event.target.value)}
            style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #333', background: '#222', color: 'white' }}
          />
          <input
            type="text"
            placeholder="Filter by Location..."
            value={locationFilter}
            onChange={(event) => setLocationFilter(event.target.value)}
            style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #333', background: '#222', color: 'white' }}
          />
        </div>
      </div>
      
      <p className="muted" style={{ marginTop: 0 }}>
        Showing {filteredVolunteers.length} of {volunteers.length} volunteers
      </p>
      
      <ul className="list">
        {filteredVolunteers.map((volunteer) => (
          <li key={volunteer.id} className="list-item">
            <div className="row-inline" style={{ justifyContent: 'space-between' }}>
              <div>
                <strong>{volunteer.name || 'Unnamed'}</strong>
                <span className="muted" style={{ marginLeft: 8 }}>
                  {volunteer.age} • {volunteer.gender}
                </span>
              </div>
              <span className={`status-badge ${volunteer.available ? 'success' : 'error'}`}>
                {volunteer.available ? 'AVAILABLE' : 'UNAVAILABLE'}
              </span>
            </div>
            
            <div className="muted">
              Phone: {volunteer.phone || 'N/A'}
            </div>
            
            <div className="muted">
              Location: {[volunteer.area, volunteer.district].filter(Boolean).join(', ') || 'Unknown'}
            </div>

            <div className="row-inline" style={{ gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
              {volunteer.skills?.map(skill => (
                <span key={skill} className="status-badge" style={{ background: '#333' }}>
                  {skill}
                </span>
              ))}
            </div>

            <div className="row-inline" style={{ marginTop: 12, justifyContent: 'flex-end' }}>
              <button className="auth-button" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
                Assign Task
              </button>
            </div>
          </li>
        ))}
        {filteredVolunteers.length === 0 && (
          <li className="muted">No volunteers found matching the current filters.</li>
        )}
      </ul>
    </section>
  );
}

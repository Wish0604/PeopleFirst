import React, { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { MapContainer, TileLayer, CircleMarker, Popup, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import { db } from '../firebase';

// Fix container style to display the map properly
const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '12px',
};

const defaultCenter = [20.5937, 78.9629];

function readPoint(location) {
  if (!location) return null;

  if (Array.isArray(location) && location.length >= 2) {
    const [lat, lng] = location;
    if (typeof lat === 'number' && typeof lng === 'number') return [lat, lng];
  }

  const latitude = location.latitude ?? location._lat ?? location.lat;
  const longitude = location.longitude ?? location._long ?? location.lng;

  if (typeof latitude === 'number' && typeof longitude === 'number') {
    return [latitude, longitude];
  }

  return null;
}

function getZoneCoordinates(zone) {
  if (Array.isArray(zone.polygon) && zone.polygon.length > 0) {
    return zone.polygon
      .map((point) => [point.lat ?? point.latitude ?? point._lat, point.lng ?? point.longitude ?? point._long])
      .filter(([lat, lng]) => typeof lat === 'number' && typeof lng === 'number');
  }

  if (zone.geojson?.type === 'Polygon' && Array.isArray(zone.geojson.coordinates?.[0])) {
    return zone.geojson.coordinates[0]
      .map(([lng, lat]) => [lat, lng])
      .filter(([lat, lng]) => typeof lat === 'number' && typeof lng === 'number');
  }

  return [];
}

function averageCenter(points) {
  if (!points.length) return null;

  const totals = points.reduce(
    (acc, [lat, lng]) => {
      acc.lat += lat;
      acc.lng += lng;
      return acc;
    },
    { lat: 0, lng: 0 }
  );

  return [totals.lat / points.length, totals.lng / points.length];
}

function uniqueById(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export default function CoordinationMap() {
  const [responses, setResponses] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [zones, setZones] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [shelters, setShelters] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'responses'), (snapshot) => {
      const mapped = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setResponses(mapped);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      const mapped = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      // filter volunteers by role
      setVolunteers((current) => {
        const fromUsers = mapped
          .filter((u) => ['VOLUNTEER', 'NDRF', 'COLLECTOR'].includes((u.role || '').toUpperCase()))
          .map((u) => ({ ...u, sourceCollection: 'users' }));
        return [...fromUsers, ...current.filter((entry) => entry.sourceCollection !== 'users')];
      });
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'volunteers'), (snapshot) => {
      const mapped = snapshot.docs.map((d) => ({ id: d.id, ...d.data(), sourceCollection: 'volunteers' }));
      setVolunteers((current) => {
        const fromUsers = current.filter((entry) => entry.sourceCollection === 'users');
        return [...fromUsers, ...mapped];
      });
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'zones'), (snapshot) => {
      const mapped = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setZones(mapped);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      const mapped = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTasks(mapped);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'shelters'), (snapshot) => {
      const mapped = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setShelters(mapped);
    });
    return unsub;
  }, []);

  const normalizedVolunteers = useMemo(() => {
    const fromUsers = volunteers
      .filter((volunteer) => ['VOLUNTEER', 'NDRF', 'COLLECTOR'].includes((volunteer.role || '').toUpperCase()))
      .map((volunteer) => ({
        ...volunteer,
        sourceCollection: volunteer.sourceCollection || 'users',
      }));

    return uniqueById(fromUsers);
  }, [volunteers]);

  const locatedResponses = useMemo(
    () => responses.filter((response) => readPoint(response.location)),
    [responses]
  );

  const locatedTasks = useMemo(
    () => tasks.filter((task) => readPoint(task.location || task.geoLocation || task.coords || task.position)),
    [tasks]
  );

  const locatedShelters = useMemo(
    () => shelters.filter((shelter) => readPoint(shelter.location || shelter.coords || shelter.position)),
    [shelters]
  );

  const locatedVolunteers = useMemo(
    () => normalizedVolunteers.filter((volunteer) => readPoint(volunteer.location || volunteer.coords || volunteer.position)),
    [normalizedVolunteers]
  );

  const mapCenter = useMemo(() => {
    const points = [
      ...locatedResponses.map((response) => readPoint(response.location)).filter(Boolean),
      ...locatedTasks.map((task) => readPoint(task.location || task.geoLocation || task.coords || task.position)).filter(Boolean),
      ...locatedShelters.map((shelter) => readPoint(shelter.location || shelter.coords || shelter.position)).filter(Boolean),
      ...locatedVolunteers.map((volunteer) => readPoint(volunteer.location || volunteer.coords || volunteer.position)).filter(Boolean),
    ];

    return averageCenter(points) || defaultCenter;
  }, [locatedResponses, locatedTasks, locatedShelters, locatedVolunteers]);

  const zoomLevel = locatedResponses.length + locatedTasks.length + locatedVolunteers.length > 0 ? 11 : 4;

  // Helper: activate volunteer (toggle active + audit)
  async function activateVolunteer(vol) {
    try {
      const volRef = doc(db, vol.sourceCollection || 'volunteers', vol.id);
      await updateDoc(volRef, { active: true, lastActivatedAt: serverTimestamp() });
      await addDoc(collection(db, 'auditLogs'), {
        action: 'VOLUNTEER_ACTIVATE',
        volunteerId: vol.id,
        actor: 'dashboard-ui',
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Activate volunteer failed', err);
    }
  }

  async function assignTask(task) {
    try {
      const taskRef = doc(db, 'tasks', task.id);
      await updateDoc(taskRef, {
        assignedTeam: task.assignedTeam || 'Dashboard Team',
        status: 'IN_PROGRESS',
        assignedAt: serverTimestamp(),
      });
      await addDoc(collection(db, 'auditLogs'), {
        action: 'TASK_ASSIGN',
        taskId: task.id,
        actor: 'dashboard-ui',
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Assign task failed', err);
    }
  }

  return (
    <section className="panel coordination-map">
      <h2>Coordination Map</h2>
      <p className="muted">Live plotting of citizen locations, volunteers, tasks, shelters and operational zones</p>
      <div className="map-legend" style={{ marginTop: '12px', marginBottom: '16px' }}>
        <div className="legend-item"><span className="dot-green"></span> Citizens ({locatedResponses.length})</div>
        <div className="legend-item"><span className="dot-yellow"></span> Volunteers ({locatedVolunteers.length})</div>
        <div className="legend-item"><span className="zone-fill"></span> Zones ({zones.length})</div>
        <div className="legend-item"><span className="dot-orange"></span> Tasks ({locatedTasks.length})</div>
      </div>
      
      <div className="map-container" style={{ border: 'none', background: 'transparent' }}>
        <MapContainer 
          center={mapCenter} 
          zoom={zoomLevel} 
          style={containerStyle}
          scrollWheelZoom={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />

          {/* Zones as polygons */}
          {zones.map((zone) => {
            const coords = getZoneCoordinates(zone);

            if (!coords.length) return null;
            const danger = (zone.riskLevel || '').toLowerCase() === 'critical';
            return (
              <Polygon key={zone.id} positions={coords} pathOptions={{ color: danger ? '#ff6b6b' : '#4a90e2', fillOpacity: 0.07 }} />
            );
          })}

          {/* Citizen / response markers */}
          {locatedResponses.map((r) => {
            const point = readPoint(r.location);
            if (!point) return null;
            const [lat, lng] = point;
            const isEmergency = r.status === 'NEED_HELP';

            return (
              <CircleMarker
                key={`resp-${r.id}`}
                center={[lat, lng]}
                radius={8}
                pathOptions={{
                  color: isEmergency ? '#ff5252' : '#80f0bc',
                  fillColor: isEmergency ? '#ff5252' : '#80f0bc',
                  fillOpacity: 0.9,
                  weight: 1
                }}
              >
                <Popup>
                  <div style={{ color: '#0b1020', fontWeight: 'bold' }}>
                    Status: {r.status}
                    <br />
                    User: {r.userId || r.id}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* Tasks */}
          {locatedTasks.map((task) => {
            const point = readPoint(task.location || task.geoLocation || task.coords || task.position);
            if (!point) return null;
            const [lat, lng] = point;
            const assigned = Boolean(task.assignedTeam || task.assignedTo);

            return (
              <CircleMarker
                key={`task-${task.id}`}
                center={[lat, lng]}
                radius={9}
                pathOptions={{
                  color: assigned ? '#4ade80' : '#f59e0b',
                  fillColor: assigned ? '#4ade80' : '#f59e0b',
                  fillOpacity: 0.9,
                  weight: 1,
                }}
              >
                <Popup>
                  <div style={{ color: '#0b1020' }}>
                    <div style={{ fontWeight: '700' }}>{task.title || 'Task'}</div>
                    <div style={{ fontSize: 12, marginTop: 6 }}>Team: {task.assignedTeam || 'Unassigned'}</div>
                    <div style={{ marginTop: 8 }}>
                      {!assigned && (
                        <button
                          onClick={() => assignTask(task)}
                          style={{ padding: '6px 10px', background: '#0b62ff', color: 'white', borderRadius: 6, border: 'none' }}
                        >
                          Assign Task
                        </button>
                      )}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* Volunteers */}
          {locatedVolunteers.map((v) => {
            const point = readPoint(v.location || v.coords || v.position);
            if (!point) return null;
            const [lat, lng] = point;
            const active = !!v.active;
            return (
              <CircleMarker
                key={`vol-${v.id}`}
                center={[lat, lng]}
                radius={10}
                pathOptions={{ color: active ? '#0bd87c' : '#ffd166', fillColor: active ? '#0bd87c' : '#ffd166', fillOpacity: 0.9 }}
              >
                <Popup>
                  <div style={{ color: '#0b1020' }}>
                    <div style={{ fontWeight: '700' }}>{v.name || v.email || v.id}</div>
                    <div style={{ fontSize: 12, marginTop: 6 }}>Role: {v.role || 'Volunteer'}</div>
                    <div style={{ marginTop: 8 }}>
                      {!active && <button onClick={() => activateVolunteer(v)} style={{ padding: '6px 10px', background: '#0b62ff', color: 'white', borderRadius: 6, border: 'none' }}>Activate Volunteer</button>}
                      {active && <span style={{ padding: '6px 10px', borderRadius: 6, background: '#e6f9f0', color: '#0b864a', fontWeight: 700 }}>Active</span>}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* Shelters */}
          {locatedShelters.map((shelter) => {
            const point = readPoint(shelter.location || shelter.coords || shelter.position);
            if (!point) return null;
            const [lat, lng] = point;
            const capacity = Number(shelter.capacity ?? shelter.totalCapacity ?? 0);
            const occupied = Number(shelter.occupied ?? shelter.currentOccupancy ?? shelter.usage ?? 0);
            const occupancy = capacity > 0 ? Math.min(100, Math.round((occupied / capacity) * 100)) : 0;

            return (
              <CircleMarker
                key={`shelter-${shelter.id}`}
                center={[lat, lng]}
                radius={11}
                pathOptions={{ color: '#60a5fa', fillColor: '#60a5fa', fillOpacity: 0.7 }}
              >
                <Popup>
                  <div style={{ color: '#0b1020' }}>
                    <div style={{ fontWeight: '700' }}>{shelter.name || 'Shelter'}</div>
                    <div style={{ fontSize: 12, marginTop: 6 }}>Capacity: {occupied}/{capacity || 'N/A'}</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>Occupancy: {occupancy}%</div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

        </MapContainer>
      </div>

      <div className="map-legend" style={{ marginTop: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Volunteer Queue</div>
        <div style={{ display: 'grid', gap: '8px' }}>
          {normalizedVolunteers.slice(0, 5).map((vol) => {
            const active = !!vol.active;
            return (
              <div key={vol.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '10px 12px', borderRadius: '10px', background: '#0b1a2b', border: '1px solid rgba(148, 163, 184, 0.18)' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{vol.name || vol.email || vol.id}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>{active ? 'Active' : 'Pending activation'}</div>
                </div>
                {!active ? (
                  <button onClick={() => activateVolunteer(vol)} style={{ padding: '6px 10px', background: '#0b62ff', color: 'white', borderRadius: '8px', border: 'none', fontSize: '11px', fontWeight: 700 }}>
                    Activate Volunteer
                  </button>
                ) : (
                  <span style={{ padding: '6px 10px', borderRadius: '8px', background: '#e6f9f0', color: '#0b864a', fontWeight: 700, fontSize: '11px' }}>Active</span>
                )}
              </div>
            );
          })}
          {normalizedVolunteers.length === 0 && <div style={{ color: '#94a3b8', fontSize: '12px' }}>No volunteers available</div>}
        </div>
      </div>
    </section>
  );
}

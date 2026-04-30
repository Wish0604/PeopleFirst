import React, { useMemo, useState } from 'react';
import { 
  AlertTriangle, 
  MapPin, 
  Users, 
  Ambulance, 
  Home, 
  CloudRain, 
  Smartphone,
  Activity, 
  Package, 
  Waves,
  Zap
} from 'lucide-react';
import { motion } from 'motion/react';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { MapContainer, TileLayer, CircleMarker, Popup, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import { db } from '../firebase';
import { useCollectionSnapshot } from '../hooks/useCollectionSnapshot';
import { useSheltersSnapshot } from '../hooks/useSheltersSnapshot';
import { readPoint } from '../utils/shelters';

function getPriorityLabel(priority) {
  if (!priority) return 'MEDIUM';
  if (priority.toUpperCase().includes('CRITICAL') || priority.toUpperCase().includes('EMERGENCY')) return 'CRITICAL';
  if (priority.toUpperCase().includes('HIGH')) return 'HIGH';
  return 'MEDIUM';
}

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

export default function RescueTeams() {
  const [layerToggles, setLayerToggles] = useState({ zones: true, teams: true, tasks: true });
  const firestoreTasks = useCollectionSnapshot('tasks');
  const firestoreUsers = useCollectionSnapshot('users');
  const firestoreShelters = useSheltersSnapshot();
  const firestoreAlerts = useCollectionSnapshot('alerts');
  const firestoreZones = useCollectionSnapshot('zones');

  const activeAlerts = useMemo(() => {
    return firestoreAlerts.filter((alert) => (alert.riskPriority || '').toUpperCase() !== 'ROUTINE').slice(0, 3);
  }, [firestoreAlerts]);

  const shelterMarkers = useMemo(() => {
    return firestoreShelters
      .map((shelter) => ({
        ...shelter,
        point: readPoint(shelter.location ?? shelter.coords ?? shelter.position ?? shelter),
      }))
      .filter((shelter) => shelter.point);
  }, [firestoreShelters]);

  const dangerZones = useMemo(() => {
    return firestoreZones
      .map((zone) => {
        const severity = String(zone.riskLevel || zone.risk_level || '').toUpperCase();
        const isDanger = severity === 'CRITICAL' || severity === 'HIGH' || zone.floodRisk || zone.cycloneWarning || zone.evacuationRequired;
        return {
          ...zone,
          severity,
          isDanger,
          coordinates: getZoneCoordinates(zone),
          point: readPoint(zone.location ?? zone.center ?? zone.position ?? zone),
        };
      })
      .filter((zone) => zone.isDanger);
  }, [firestoreZones]);

  const liveVolunteers = useMemo(() => {
    return firestoreUsers
      .filter((user) => ['VOLUNTEER', 'NDRF', 'COLLECTOR'].includes((user.role || '').toUpperCase()))
      .slice(0, 3)
      .map((user) => ({
        id: user.id,
        name: user.name || user.fullName || user.email || user.id,
        dist: user.zoneId || user.baseZone || 'Live registry',
        skills: user.specialties?.length ? user.specialties : [user.role || 'Support'],
        original: user,
      }));
  }, [firestoreUsers]);

  const shelterRows = useMemo(() => {
    return firestoreShelters.slice(0, 2).map((shelter) => ({
      id: shelter.id,
      name: shelter.name || 'Shelter',
      value: Number.isFinite(Number(shelter.capacity)) && Number(shelter.capacity) > 0
        ? Math.min(100, Math.round((Number(shelter.occupied || shelter.currentOccupancy || 0) / Number(shelter.capacity)) * 100))
        : 0,
      total: `${Number(shelter.occupied || shelter.currentOccupancy || 0)} / ${Number(shelter.capacity || shelter.totalCapacity || 0)}`,
      danger: Number(shelter.capacity || shelter.totalCapacity || 0) > 0 && Number(shelter.occupied || shelter.currentOccupancy || 0) >= Number(shelter.capacity || shelter.totalCapacity || 0) * 0.85,
    }));
  }, [firestoreShelters]);

  const tasks = useMemo(() => {
    return firestoreTasks.slice(0, 3).map(task => ({
      id: task.id,
      priority: getPriorityLabel(task.riskPriority),
      eta: task.eta || '15m',
      title: task.title || 'Task',
      loc: formatLocation(task.location),
      team: task.assignedTeam || 'Unassigned',
      responders: task.responders?.length ? new Array(task.responders.length) : [],
      unassigned: !task.assignedTeam,
      original: task,
    }));
  }, [firestoreTasks]);
  const activeTaskCount = firestoreTasks.length;

  async function assignTask(task) {
    try {
      await updateDoc(doc(db, 'tasks', task.id), {
        assignedTeam: task.team === 'Unassigned' ? 'Rescue Team Alpha' : task.team,
        status: 'IN_PROGRESS',
        assignedAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'auditLogs'), {
        action: 'TASK_ASSIGN',
        taskId: task.id,
        actor: 'dashboard-ui',
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Task assignment failed', error);
    }
  }

  async function dispatchResource(label) {
    try {
      await addDoc(collection(db, 'dispatch_logs'), {
        resourceType: label,
        status: 'REQUESTED',
        createdAt: serverTimestamp(),
        source: 'dashboard-ui',
      });
    } catch (error) {
      console.error('Resource dispatch failed', error);
    }
  }

  const operationsSummary = {
    activeAlerts: activeAlerts.length,
    volunteers: liveVolunteers.length,
    shelters: shelterRows.length,
  };

  function toggleLayer(key) {
    setLayerToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid h-full gap-4 grid-cols-1 lg:grid-cols-[180px_minmax(0,1fr)_180px]"
    >
      {/* Left: Task List Panel */}
      <section className="border border-outline-variant rounded-2xl bg-surface flex flex-col overflow-y-auto min-h-[280px]">
        <div className="p-4 border-b border-outline-variant flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight">Active Tasks</h2>
          <span className="bg-surface-container-high px-2 py-1 rounded text-[10px] font-black text-slate-500 uppercase">{activeTaskCount} Active</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {tasks.length > 0 ? (
            tasks.map((task, idx) => (
              <TaskCard
                key={task.id}
                priority={task.priority}
                eta={task.eta}
                title={task.title}
                loc={task.loc}
                team={task.team}
                responders={task.responders}
                unassigned={task.unassigned}
                active={idx === 0}
                onAssign={() => assignTask(task)}
              />
            ))
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">No active tasks</div>
          )}
        </div>
      </section>

      {/* Center: Map Panel */}
      <section className="relative bg-[#0B1220] overflow-hidden border border-outline-variant rounded-2xl min-h-[420px]">
        {/* Real Map Layer */}
        <div className="absolute inset-0 z-0">
          <MapContainer 
            center={[20.5937, 78.9629]} 
            zoom={4} 
            style={{ width: '100%', height: '100%', zIndex: 0 }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; CARTO'
            />
            {layerToggles.tasks && tasks.map(task => {
              const pt = readPoint(task.original?.location || task.original?.geoLocation || task.original?.coords);
              if (!pt) return null;
              return (
                <CircleMarker key={task.id} center={pt} radius={8} pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.9 }}>
                  <Popup><div className="text-slate-900 font-bold">{task.title}</div></Popup>
                </CircleMarker>
              )
            })}
            {layerToggles.teams && liveVolunteers.map(vol => {
              const pt = readPoint(vol.original?.location || vol.original?.coords || vol.original?.position);
              if (!pt) return null;
              return (
                <CircleMarker key={vol.id} center={pt} radius={8} pathOptions={{ color: '#4ade80', fillColor: '#4ade80', fillOpacity: 0.9 }}>
                  <Popup><div className="text-slate-900 font-bold">{vol.name}</div></Popup>
                </CircleMarker>
              )
            })}
            {layerToggles.zones && shelterMarkers.map((shelter) => (
              <CircleMarker
                key={`shelter-${shelter.id}`}
                center={shelter.point}
                radius={9}
                pathOptions={{ color: '#60a5fa', fillColor: '#60a5fa', fillOpacity: 0.92 }}
              >
                <Popup>
                  <div className="text-slate-900 font-bold">{shelter.name || 'Shelter'}</div>
                </Popup>
              </CircleMarker>
            ))}
            {layerToggles.zones && dangerZones.map((zone) => {
              if (zone.coordinates.length > 0) {
                const critical = zone.severity === 'CRITICAL';
                return (
                  <Polygon
                    key={`zone-poly-${zone.id}`}
                    positions={zone.coordinates}
                    pathOptions={{
                      color: critical ? '#ef4444' : '#f59e0b',
                      fillColor: critical ? '#ef4444' : '#f59e0b',
                      fillOpacity: 0.18,
                      weight: 2,
                    }}
                  >
                    <Popup><div className="text-slate-900 font-bold">{zone.zoneName || zone.name || 'Danger zone'}</div></Popup>
                  </Polygon>
                );
              }

              if (zone.point) {
                return (
                  <CircleMarker
                    key={`zone-point-${zone.id}`}
                    center={zone.point}
                    radius={14}
                    pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.25, weight: 2 }}
                  >
                    <Popup><div className="text-slate-900 font-bold">{zone.zoneName || zone.name || 'Danger zone'}</div></Popup>
                  </CircleMarker>
                );
              }

              return null;
            })}
            {layerToggles.zones && activeAlerts.map(alert => {
              const pt = readPoint(alert.location || alert.coords || alert.position);
              if (!pt) return null;
              return (
                <CircleMarker key={alert.id} center={pt} radius={12} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.9, weight: 2 }}>
                  <Popup><div className="text-slate-900 font-bold">{alert.title || alert.riskType}</div></Popup>
                </CircleMarker>
              )
            })}
          </MapContainer>
        </div>

        {/* Tactical Overlay Toggles */}
        <div className="absolute top-0 left-0 right-0 z-10 p-6 pointer-events-none">
          <div className="flex justify-between items-start">
            <div className="flex gap-2 pointer-events-auto">
              <div className="bg-surface-container/90 backdrop-blur border border-outline-variant p-2 rounded-xl flex gap-1 shadow-lg">
                <button className="p-2 hover:bg-primary/20 rounded-lg text-white"><MapPin size={18} /></button>
                <button className="p-2 hover:bg-primary/20 rounded-lg text-white"><Smartphone size={18} /></button>
              </div>
            </div>

            <div className="bg-surface-container/90 backdrop-blur border border-outline-variant p-2 rounded-2xl pointer-events-auto flex items-center gap-2 shadow-lg">
              <button
                onClick={() => toggleLayer('zones')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${layerToggles.zones ? 'bg-primary/20 text-primary border border-primary/30' : 'text-slate-300 hover:bg-surface-container-high'}`}
              >
                Alerts + Shelters
              </button>
              <button
                onClick={() => toggleLayer('teams')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${layerToggles.teams ? 'bg-primary/20 text-primary border border-primary/30' : 'text-slate-300 hover:bg-surface-container-high'}`}
              >
                Teams
              </button>
              <button
                onClick={() => toggleLayer('tasks')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${layerToggles.tasks ? 'bg-primary/20 text-primary border border-primary/30' : 'text-slate-300 hover:bg-surface-container-high'}`}
              >
                Tasks
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div className="absolute bottom-6 left-6 right-6 z-20 flex items-end gap-3 pointer-events-none">
          <div className="flex-1 min-w-0 bg-surface-container/90 backdrop-blur border border-outline-variant p-4 rounded-2xl pointer-events-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Current Load</span>
              <div className="flex items-center gap-3">
                <CloudRain size={20} className="text-primary" />
                <span className="text-sm font-bold text-white truncate">{operationsSummary.activeAlerts} alerts, {activeTaskCount} tasks</span>
              </div>
            </div>
            <div className="flex flex-col min-w-0 sm:border-l sm:border-outline-variant sm:pl-4">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Volunteer Pool</span>
              <span className="text-sm font-bold text-tertiary truncate">{operationsSummary.volunteers} available</span>
            </div>
            <div className="flex flex-col min-w-0 sm:border-l sm:border-outline-variant sm:pl-4">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Shelter Coverage</span>
              <span className="text-sm font-bold text-white truncate">{operationsSummary.shelters} live shelters visible</span>
            </div>
          </div>

          <div className="shrink-0 bg-surface-container/90 backdrop-blur border border-outline-variant p-1 rounded-xl pointer-events-auto flex items-center">
            <button className="px-5 py-2 hover:bg-surface-container-high rounded-lg text-xs font-bold text-white">2D</button>
            <button className="px-5 py-2 bg-primary/20 text-primary rounded-lg text-xs font-black">3D</button>
          </div>
        </div>
      </section>

      {/* Right: Dispatch Panel */}
      <aside className="bg-surface border border-outline-variant rounded-2xl flex flex-col overflow-y-auto min-h-[280px]">
        <div className="p-6 space-y-6">
          <h2 className="text-xl font-bold text-white tracking-tight">Dispatch Resources</h2>
          <div className="grid grid-cols-2 gap-3">
            <DispatchButton icon={<Activity size={20} />} label="Medical Kit" onClick={() => dispatchResource('Medical Kit')} />
            <DispatchButton icon={<Package size={20} />} label="Ration Packs" onClick={() => dispatchResource('Ration Packs')} />
            <DispatchButton icon={<Waves size={20} />} label="Water Tanker" onClick={() => dispatchResource('Water Tanker')} />
            <DispatchButton icon={<Zap size={20} />} label="Power Gen" onClick={() => dispatchResource('Power Gen')} />
          </div>
        </div>
      </aside>
    </motion.div>
  );
}

function TaskCard({ priority, eta, title, loc, team, responders, active, unassigned, onAssign }) {
  return (
    <div className={`p-4 bg-surface-container border rounded-xl cursor-pointer transition-all ${
      active ? 'border-error ring-1 ring-error/20 bg-surface-container-high shadow-lg' : 'border-outline-variant hover:border-primary/50'
    }`}>
      <div className="flex justify-between items-start mb-3">
        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${
          priority === 'CRITICAL' ? 'bg-error text-on-error' : 
          priority === 'HIGH' ? 'bg-tertiary text-on-tertiary' : 'bg-primary text-on-primary'
        }`}>
          {priority}
        </span>
        <span className="text-slate-500 text-[10px] font-bold">ETA {eta}</span>
      </div>
      <h3 className="text-sm font-bold text-white leading-tight mb-1">{title}</h3>
      <p className="text-slate-400 text-[11px] flex items-center gap-1.5 leading-none">
        <MapPin size={12} className="text-primary" />
        {loc}
      </p>
      
      <div className="pt-4 flex items-center justify-between border-t border-outline-variant mt-4">
        {unassigned ? (
          <>
            <span className="text-[10px] font-medium text-slate-500 italic">Unassigned</span>
            <button onClick={onAssign} className="text-[10px] font-black text-primary px-3 py-1 bg-primary/10 rounded-lg uppercase tracking-widest border border-primary/20">Assign</button>
          </>
        ) : (
          <>
            <div className="flex -space-x-2">
              {responders?.map((_, i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-surface-container bg-slate-700 flex items-center justify-center">
                  <Users size={12} className="text-white" />
                </div>
              ))}
            </div>
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">{team}</span>
          </>
        )}
      </div>
    </div>
  );
}

function DispatchButton({ icon, label, onClick }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-3 p-5 bg-surface-container-high border border-outline-variant rounded-2xl hover:border-primary transition-all active:scale-[0.98] group">
      <div className="text-primary group-hover:scale-110 transition-transform">{icon}</div>
      <span className="text-[10px] font-black text-white uppercase tracking-widest">{label}</span>
    </button>
  );
}

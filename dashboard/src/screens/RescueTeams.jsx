import React, { useMemo } from 'react';
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
  Zap,
  Plus
} from 'lucide-react';
import { motion } from 'motion/react';
import { useCollectionSnapshot } from '../hooks/useCollectionSnapshot';

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

export default function RescueTeams() {
  const firestoreTasks = useCollectionSnapshot('tasks');
  const tasks = useMemo(() => {
    return firestoreTasks.slice(0, 3).map(task => ({
      id: task.id,
      priority: getPriorityLabel(task.riskPriority),
      eta: task.eta || '15m',
      title: task.title || 'Task',
      loc: formatLocation(task.location),
      team: task.assignedTeam || 'Unassigned',
      responders: task.responders?.length ? new Array(task.responders.length) : [],
      unassigned: !task.assignedTeam
    }));
  }, [firestoreTasks]);
  const activeTaskCount = firestoreTasks.length;
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-full"
    >
      {/* Left: Task List Panel */}
      <section className="w-80 border-r border-outline-variant bg-surface flex flex-col shrink-0">
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
              />
            ))
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">No active tasks</div>
          )}
        </div>
      </section>

      {/* Center: Map Panel */}
      <section className="flex-1 relative bg-[#0B1220] overflow-hidden">
        {/* Map Background */}
        <div className="absolute inset-0 opacity-20 grayscale brightness-50">
          <img 
            src="https://images.unsplash.com/photo-1569336415962-a4bd9f6dfc0f?auto=format&fit=crop&q=80&w=2000" 
            className="w-full h-full object-cover" 
            alt="Tactical map grid"
          />
        </div>

        {/* Tactical Overlay */}
        <div className="absolute inset-0 z-10 p-6 pointer-events-none">
          <div className="flex justify-between items-start">
            <div className="flex gap-2 pointer-events-auto">
              <div className="bg-surface-container/90 backdrop-blur border border-outline-variant p-2 rounded-xl flex gap-1">
                <button className="p-2 hover:bg-primary/20 rounded-lg text-white"><MapPin size={18} /></button>
                <button className="p-2 hover:bg-primary/20 rounded-lg text-white"><Smartphone size={18} /></button>
              </div>
            </div>

            <div className="bg-surface-container/90 backdrop-blur border border-outline-variant px-6 py-3 rounded-2xl pointer-events-auto flex items-center gap-6">
              <StatusBadge color="bg-error" label="Hot Zone" />
              <StatusBadge color="bg-primary" label="Teams" />
              <StatusBadge color="bg-secondary" label="Vehicles" />
            </div>
          </div>

          {/* Markers */}
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute top-[30%] left-[40%] pointer-events-auto flex flex-col items-center"
          >
            <div className="bg-error p-3 rounded-full shadow-lg shadow-error/40 text-on-error">
              <AlertTriangle size={20} />
            </div>
            <div className="mt-3 bg-background border border-error px-3 py-1 rounded-lg text-[10px] font-bold text-white uppercase tracking-widest whitespace-nowrap">
              Collapse B-12
            </div>
          </motion.div>

          <div className="absolute top-[55%] left-[65%] pointer-events-auto flex flex-col items-center">
            <div className="bg-primary p-3 rounded-full shadow-lg text-on-primary">
              <Ambulance size={20} />
            </div>
            <div className="mt-3 bg-background border border-primary px-3 py-1 rounded-lg text-[10px] font-bold text-white uppercase tracking-widest whitespace-nowrap">
              Team Phoenix (MOVING)
            </div>
          </div>

          <div className="absolute top-[20%] left-[75%] pointer-events-auto">
            <div className="bg-surface-container border border-outline px-4 py-3 rounded-xl shadow-2xl flex flex-col gap-2 min-w-[140px]">
              <div className="flex items-center gap-3">
                <Home size={18} className="text-white" />
                <span className="text-[10px] font-black text-white uppercase tracking-wider">Shelter A</span>
              </div>
              <div className="w-full bg-background h-2 rounded-full overflow-hidden">
                <div className="bg-error h-full" style={{ width: '80%' }} />
              </div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">80% Capacity</span>
            </div>
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div className="absolute bottom-6 left-6 right-6 z-20 flex justify-between pointer-events-none">
          <div className="bg-surface-container/90 backdrop-blur border border-outline-variant p-6 rounded-2xl pointer-events-auto flex items-center gap-10">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Current Weather</span>
              <div className="flex items-center gap-3">
                <CloudRain size={20} className="text-primary" />
                <span className="text-sm font-bold text-white">12mm/hr Heavy Rain</span>
              </div>
            </div>
            <div className="h-10 w-px bg-outline-variant" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Ground Saturation</span>
              <span className="text-sm font-bold text-tertiary">92% CRITICAL</span>
            </div>
          </div>

          <div className="bg-surface-container/90 backdrop-blur border border-outline-variant p-1 rounded-xl pointer-events-auto flex items-center">
            <button className="px-5 py-2 hover:bg-surface-container-high rounded-lg text-xs font-bold text-white">2D</button>
            <button className="px-5 py-2 bg-primary/20 text-primary rounded-lg text-xs font-black">3D</button>
          </div>
        </div>
      </section>

      {/* Right: Utility Panel */}
      <aside className="w-96 bg-surface border-l border-outline-variant flex flex-col shrink-0 overflow-y-auto">
        <div className="p-6 border-b border-outline-variant">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white tracking-tight">Nearest Volunteers</h2>
            <button className="text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:underline">View All</button>
          </div>
          <div className="space-y-3">
            <VolunteerItem name="Elena Rossi" dist="2.1km" skills={['Trauma Med', 'IT, EN']} />
            <VolunteerItem name="Marcus Chen" dist="0.8km" skills={['Excavation', 'Rescue Swim']} />
          </div>
        </div>

        <div className="p-6 space-y-8">
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white tracking-tight">Shelter Capacity</h2>
            <div className="space-y-4">
              <ShelterCard name="Central High School" value={88} total="352 / 400" danger />
              <ShelterCard name="North Community Hub" value={42} total="126 / 300" />
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white tracking-tight">Dispatch Resources</h2>
            <div className="grid grid-cols-2 gap-3">
              <DispatchButton icon={<Activity size={20} />} label="Medical Kit" />
              <DispatchButton icon={<Package size={20} />} label="Ration Packs" />
              <DispatchButton icon={<Waves size={20} />} label="Water Tanker" />
              <DispatchButton icon={<Zap size={20} />} label="Power Gen" />
            </div>
          </div>
        </div>
      </aside>
    </motion.div>
  );
}

function TaskCard({ priority, eta, title, loc, team, responders, active, unassigned }) {
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
            <button className="text-[10px] font-black text-primary px-3 py-1 bg-primary/10 rounded-lg uppercase tracking-widest border border-primary/20">Assign</button>
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

function StatusBadge({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${color}`} />
      <span className="text-[10px] font-bold text-white uppercase tracking-widest">{label}</span>
    </div>
  );
}

function VolunteerItem({ name, dist, skills }) {
  return (
    <div className="flex items-center gap-4 p-3 bg-surface-container-low border border-outline-variant rounded-xl group hover:bg-surface-container-high transition-colors cursor-pointer">
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center grayscale group-hover:grayscale-0 transition-all border border-outline-variant">
          <Users size={18} className="text-slate-400" />
        </div>
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary border-2 border-surface rounded-full" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <p className="text-sm font-bold text-white truncate">{name}</p>
          <span className="text-[10px] font-bold text-slate-500">{dist}</span>
        </div>
        <div className="flex gap-2 flex-wrap mt-1">
          {skills.map((s) => (
            <span key={s} className="text-[9px] font-bold px-2 py-0.5 bg-surface-container-high text-slate-400 rounded-md border border-outline-variant transition-colors group-hover:text-primary group-hover:border-primary/30">
              {s}
            </span>
          ))}
        </div>
      </div>
      <button className="text-primary hover:scale-110 active:scale-95 transition-all">
        <Plus size={20} />
      </button>
    </div>
  );
}

function ShelterCard({ name, value, total, danger }) {
  return (
    <div className="bg-surface-container-low border border-outline-variant p-5 rounded-2xl space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm font-bold text-white">{name}</span>
        <span className={`text-xs font-black ${danger ? 'text-error' : 'text-primary'}`}>{value}%</span>
      </div>
      <div className="w-full bg-background h-2 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className={`h-full ${danger ? 'bg-error shadow-[0_0_10px_rgba(255,180,171,0.5)]' : 'bg-primary'}`} 
        />
      </div>
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{total} Occupied</span>
        <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Redirect Flow</button>
      </div>
    </div>
  );
}

function DispatchButton({ icon, label }) {
  return (
    <button className="flex flex-col items-center gap-3 p-5 bg-surface-container-high border border-outline-variant rounded-2xl hover:border-primary transition-all active:scale-[0.98] group">
      <div className="text-primary group-hover:scale-110 transition-transform">{icon}</div>
      <span className="text-[10px] font-black text-white uppercase tracking-widest">{label}</span>
    </button>
  );
}

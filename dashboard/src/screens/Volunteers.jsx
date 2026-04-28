import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  MapPin,
  X,
  ShieldCheck,
  Smartphone,
  Navigation,
  Activity,
  LogOut,
  Mail,
  User,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Volunteers() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 h-full flex flex-col gap-8 overflow-y-auto"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Volunteer Community</h1>
          <p className="text-slate-400 font-medium">Verified personnel registry for local community support</p>
        </div>
        <div className="flex items-center gap-4 bg-surface-container border border-outline-variant px-5 py-3 rounded-2xl">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Active: 142</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Filters Panel */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="bg-surface-container border border-outline-variant p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Search Filters</h3>
              <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Reset</button>
            </div>
            
            <div className="space-y-8">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block">Skills & Expertise</label>
                <div className="space-y-4">
                  <CheckboxItem label="Medical (EMT/Nursing)" checked />
                  <CheckboxItem label="Emergency Response" />
                  <CheckboxItem label="First Aid Certified" checked />
                </div>
              </div>
              
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block">Current Status</label>
                <div className="flex flex-wrap gap-2">
                  <StatusToggleButton label="Any" active />
                  <StatusToggleButton label="Available" />
                  <StatusToggleButton label="Busy" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container border border-outline-variant p-6 rounded-2xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Recent Activity</h3>
            <div className="space-y-5">
              <ActivityLogItem name="Marcus Thorne" text="Checked in at Harbor Dist." time="2m ago" color="bg-emerald-500" />
              <ActivityLogItem name="Elena Rodriguez" text="Assigned to Task #204" time="14m ago" color="bg-primary" />
              <ActivityLogItem name="Sarah Jenkins" text="Signed off for the day" time="4h ago" color="bg-slate-600" />
            </div>
            <button className="w-full mt-6 py-3 text-[10px] font-black text-primary uppercase tracking-[0.2em] border border-primary/20 rounded-xl hover:bg-primary/5 transition-all">
              View All Logs
            </button>
          </div>
        </div>

        {/* Main Table Container */}
        <div className="col-span-12 lg:col-span-9 space-y-6">
          <div className="bg-surface-container border border-outline-variant rounded-2xl overflow-hidden flex flex-col shadow-2xl shadow-black/20">
            <div className="p-6 border-b border-outline-variant flex flex-col md:flex-row justify-between items-center gap-6 bg-surface-container-high/30">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  className="w-full pl-12 pr-4 py-3 bg-[#0B1220] border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary transition-all placeholder-slate-600"
                  placeholder="Find volunteer by name or ID..."
                  type="text"
                />
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full md:w-auto px-6 py-3 bg-primary-container text-on-primary-container rounded-xl font-bold text-xs uppercase tracking-widest hover:brightness-110 shadow-lg shadow-primary-container/20 transition-all flex items-center justify-center gap-2"
              >
                <UserPlus size={18} />
                Add Volunteer
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-high/50 border-b border-outline-variant text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    <th className="px-6 py-4">Volunteer</th>
                    <th className="px-6 py-4">Verification</th>
                    <th className="px-6 py-4">Skills</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Last Sync</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30 text-sm">
                  <VolunteerRow 
                    name="Marcus Thorne" 
                    loc="Harbor Dist." 
                    status="Verified" 
                    skills={['Medical']} 
                    avail="Available" 
                    sync="2m ago" 
                  />
                  <VolunteerRow 
                    name="Elena Rodriguez" 
                    loc="Central Station" 
                    status="Pending" 
                    skills={['Logistics']} 
                    avail="Busy" 
                    sync="14m ago" 
                  />
                  <VolunteerRow 
                    name="Kenji Sato" 
                    loc="Warehouse Dist." 
                    status="Verified" 
                    skills={['Medical']} 
                    avail="Available" 
                    sync="Just now" 
                  />
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t border-outline-variant flex items-center justify-between bg-surface-container-high/20">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Showing 1-3 of 142 volunteers</span>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg border border-outline-variant text-slate-600 hover:text-white transition-colors disabled:opacity-30" disabled>
                  <ChevronLeft size={16} />
                </button>
                <button className="w-8 h-8 rounded-lg bg-primary-container text-on-primary-container font-black text-[10px]">1</button>
                <button className="w-8 h-8 rounded-lg hover:bg-surface-container-high text-slate-400 font-bold text-[10px] transition-colors">2</button>
                <button className="p-2 rounded-lg border border-outline-variant text-slate-600 hover:text-white transition-colors">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-container border border-outline-variant p-6 rounded-2xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Nearest Volunteers</h3>
              <div className="space-y-4">
                <NearestItem name="Marcus Thorne" info="0.4 miles away • Harbor Dist." abbr="MT" color="bg-primary" />
                <NearestItem name="Kenji Sato" info="1.2 miles away • Warehouse Dist." abbr="KS" color="bg-secondary" />
                <NearestItem name="Jane Doe" info="1.8 miles away • Downtown" abbr="JD" color="bg-slate-500" />
              </div>
            </div>

            <div className="bg-surface-container border border-outline-variant p-6 rounded-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Critical Zone Support</h3>
                <span className="px-2 py-0.5 bg-error/10 text-error text-[9px] font-black rounded uppercase">Active Alerts</span>
              </div>
              <div className="space-y-5">
                <ZoneSupportItem zone="Harbor District" needed={8} current={4} progress={35} urgent />
                <ZoneSupportItem zone="Warehouse Dist." needed={2} current={12} progress={80} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-surface-container border border-outline-variant rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="px-8 py-6 border-b border-outline-variant flex justify-between items-center bg-[#0B1220]">
                <div>
                  <h2 className="text-xl font-bold text-primary leading-tight">New Personnel Intake</h2>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Command Sentinel System // Registration Portal</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors p-2">
                  <X size={20} />
                </button>
              </div>

              <form className="p-8 space-y-8" onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup label="Full Name" placeholder="Johnathan Doe" icon={<User size={14} />} />
                  <InputGroup label="Email Address" placeholder="j.doe@sentinel.hq" icon={<Mail size={14} />} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup label="Phone Contact" placeholder="+1 (555) 000-0000" icon={<Smartphone size={14} />} />
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Assigned Sector</label>
                    <select className="w-full bg-[#0B1220] border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary transition-all appearance-none cursor-pointer">
                      <option>Select Ops Sector</option>
                      <option>Sector Alpha (North)</option>
                      <option>Sector Beta (Urban)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Specialized Operational Skills</label>
                  <div className="grid grid-cols-2 gap-3">
                    <SkillCheckbox label="Medical" />
                    <SkillCheckbox label="Driver" />
                    <SkillCheckbox label="Search & Rescue" />
                    <SkillCheckbox label="Logistics" />
                  </div>
                </div>

                <div className="pt-8 border-t border-outline-variant flex gap-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3 bg-transparent border border-outline-variant text-slate-400 hover:text-white rounded-xl transition-all font-bold text-xs uppercase tracking-widest">
                    Cancel
                  </button>
                  <button type="submit" className="flex-[2] px-6 py-3 bg-primary-container text-on-primary-container hover:brightness-110 active:opacity-80 rounded-xl transition-all font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary-container/20">
                    <ShieldCheck size={18} />
                    Register Volunteer
                  </button>
                </div>
              </form>

              <div className="bg-[#0B1220] px-8 py-3 flex justify-between items-center">
                <div className="flex gap-4 items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[9px] text-slate-600 font-mono tracking-tight uppercase">Encryption: AES-256 Active</span>
                </div>
                <span className="text-[9px] text-slate-700 font-mono uppercase">Sys_Load: 12%</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CheckboxItem({ label, checked }) {
  return (
    <label className="flex items-center group cursor-pointer">
      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${checked ? 'bg-primary border-primary' : 'border-outline-variant bg-background group-hover:border-primary/50'}`}>
        {checked && <X size={10} className="text-on-primary stroke-[4]" />}
      </div>
      <span className={`ml-3 text-xs font-medium transition-colors ${checked ? 'text-on-surface' : 'text-slate-500 group-hover:text-slate-300'}`}>
        {label}
      </span>
    </label>
  );
}

function StatusToggleButton({ label, active }) {
  return (
    <button className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${
      active ? 'bg-primary text-on-primary border-primary shadow-lg shadow-primary/20' : 'border-outline-variant text-slate-500 hover:border-slate-400'
    }`}>
      {label}
    </button>
  );
}

function ActivityLogItem({ name, text, time, color }) {
  return (
    <div className="flex gap-4 items-start">
      <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${color}`} />
      <div>
        <p className="text-xs font-bold text-white">{name}</p>
        <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{text}</p>
        <p className="text-[9px] text-slate-600 uppercase font-bold tracking-tighter mt-1">{time}</p>
      </div>
    </div>
  );
}

function VolunteerRow({ name, loc, status, skills, avail, sync }) {
  return (
    <tr className="hover:bg-surface-container-high/30 transition-colors group">
      <td className="px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-surface-container-highest border border-outline-variant flex items-center justify-center overflow-hidden">
            <Users size={20} className="text-slate-500" />
          </div>
          <div>
            <p className="font-bold text-white">{name}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{loc}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-5">
        <span className={`inline-flex items-center px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${
          status === 'Verified' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-tertiary/10 border-tertiary/20 text-tertiary'
        }`}>
          {status === 'Verified' ? <ShieldCheck size={12} className="mr-1.5" /> : <AlertTriangle size={12} className="mr-1.5" />}
          {status}
        </span>
      </td>
      <td className="px-6 py-5">
        <div className="flex flex-wrap gap-2">
          {skills.map((s) => (
            <span key={s} className="px-2 py-0.5 bg-background border border-outline-variant text-[9px] font-black text-slate-400 uppercase rounded tracking-widest">{s}</span>
          ))}
        </div>
      </td>
      <td className="px-6 py-5">
        <span className={`inline-flex items-center px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${
          avail === 'Available' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-error/10 border-error/20 text-error'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full mr-2 ${avail === 'Available' ? 'bg-emerald-400 animate-pulse' : 'bg-error'}`} />
          {avail}
        </span>
      </td>
      <td className="px-6 py-5 text-[11px] font-mono text-slate-400 uppercase">{sync}</td>
      <td className="px-6 py-5 text-right">
        <button className="px-4 py-2 bg-surface-container-highest hover:bg-primary-container hover:text-on-primary-container rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">Assign</button>
      </td>
    </tr>
  );
}

function NearestItem({ name, info, abbr, color }) {
  return (
    <div className="flex items-center justify-between p-3 hover:bg-surface-container-high transition-colors cursor-pointer rounded-xl group">
      <div className="flex items-center gap-4">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] text-white shadow-inner ${color}`}>
          {abbr}
        </div>
        <div>
          <p className="text-xs font-bold text-white">{name}</p>
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">{info}</p>
        </div>
      </div>
      <Navigation size={14} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

function ZoneSupportItem({ zone, needed, current, progress, urgent }) {
  return (
    <div className={`p-4 rounded-xl border ${urgent ? 'bg-error/5 border-error/20' : 'bg-surface-container-high/40 border-outline-variant'}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold text-white">{zone}</span>
        <span className={`text-[10px] font-black uppercase tracking-wider ${urgent ? 'text-error' : 'text-primary'}`}>{needed} Needed</span>
      </div>
      <div className="w-full bg-background h-1.5 rounded-full mb-3 overflow-hidden">
        <div className={`h-full ${urgent ? 'bg-error' : 'bg-primary'}`} style={{ width: `${progress}%` }} />
      </div>
      <p className="text-[10px] text-slate-500 leading-tight">
        {urgent ? `Critical shortage: only ${current} medical units active.` : `Stable: ${current} units on standby.`}
      </p>
    </div>
  );
}

function InputGroup({ label, placeholder, icon }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">{label}</label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary">{icon}</div>
        <input 
          className="w-full bg-[#0B1220] border border-outline-variant rounded-xl pl-10 pr-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary transition-all placeholder-slate-700"
          placeholder={placeholder}
          type="text"
        />
      </div>
    </div>
  );
}

function SkillCheckbox({ label }) {
  return (
    <label className="group flex items-center gap-4 p-4 bg-[#0B1220] border border-outline-variant rounded-xl cursor-pointer hover:bg-surface-container-high transition-colors">
      <input type="checkbox" className="w-4 h-4 rounded border-outline-variant bg-background text-primary focus:ring-primary focus:ring-offset-0" />
      <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{label}</span>
    </label>
  );
}

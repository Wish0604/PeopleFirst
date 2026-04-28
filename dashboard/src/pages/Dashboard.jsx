import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Map as MapIcon, 
  Users, 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  Bell, 
  MoreHorizontal,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Radio,
  Ambulance,
  LifeBuoy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import NewDashboardScreen from '../screens/Dashboard';
import RescueTeams from '../screens/RescueTeams';
import Volunteers from '../screens/Volunteers';
import Alerts from '../screens/Alerts';
import LocalMap from '../screens/LocalMap';
import SystemStatus from '../screens/SystemStatus';
import Emergency from '../screens/Emergency';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const [screen, setScreen] = useState('dashboard');
  const { profile, user, signOut } = useAuth();
  
  // Basic fallback if roles aren't fully set
  const roleLabel = profile?.role || 'ADMIN';

  return (
    <div className="flex h-screen overflow-hidden bg-background text-on-surface">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-outline-variant bg-[#0B1220] flex flex-col z-50 shrink-0">
        <div className="p-6">
          <h1 className="text-xl font-bold tracking-tighter text-white">PeopleFirst</h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold text-primary tracking-widest uppercase">Network Active</span>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-4">
          <SidebarItem 
            icon={<LayoutDashboard size={18} />} 
            label="Operations" 
            active={screen === 'dashboard'} 
            onClick={() => setScreen('dashboard')} 
          />
          <SidebarItem 
            icon={<Bell size={18} />} 
            label="Alerts" 
            active={screen === 'alerts'}
            onClick={() => setScreen('alerts')} 
          />
          <SidebarItem 
            icon={<Ambulance size={18} />} 
            label="Rescue Teams" 
            active={screen === 'rescue'} 
            onClick={() => setScreen('rescue')} 
          />
          <SidebarItem 
            icon={<Users size={18} />} 
            label="Volunteer List" 
            active={screen === 'volunteers'} 
            onClick={() => setScreen('volunteers')} 
          />
          <SidebarItem 
            icon={<MapIcon size={18} />} 
            label="Local Map" 
            active={screen === 'map'}
            onClick={() => setScreen('map')} 
          />
          <SidebarItem 
            icon={<Settings size={18} />} 
            label="System Status" 
            active={screen === 'system'}
            onClick={() => setScreen('system')} 
          />
        </nav>

        <div className="p-4 border-t border-outline-variant space-y-4">
          <button 
            onClick={() => setScreen('emergency')}
            className="w-full py-3 bg-error-container text-on-surface border border-error/30 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-error-container/80 transition-colors active:scale-95"
          >
            <AlertTriangle size={14} />
            Declare Emergency
          </button>
          
          <div className="flex items-center justify-between gap-3 px-3 py-2 bg-surface-container rounded-lg border border-outline-variant">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container shrink-0">
                <Users size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{profile?.email || user?.email || 'OFFICER_01'}</p>
                <p className="text-[9px] text-slate-500 uppercase">{roleLabel} Access</p>
              </div>
            </div>
            <button onClick={signOut} className="text-slate-400 hover:text-error transition-colors p-1" title="Sign Out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-30 z-10" style={{ background: 'linear-gradient(to bottom, transparent, rgba(173, 198, 255, 0.05), transparent)', backgroundSize: '100% 200%', animation: 'scan 8s linear infinite' }} />
        <AnimatePresence mode="wait">
          {screen === 'dashboard' && <NewDashboardScreen key="dashboard" />}
          {screen === 'alerts' && <Alerts key="alerts" />}
          {screen === 'rescue' && <RescueTeams key="rescue" />}
          {screen === 'volunteers' && <Volunteers key="volunteers" />}
          {screen === 'map' && <LocalMap key="map" />}
          {screen === 'system' && <SystemStatus key="system" />}
          {screen === 'emergency' && <Emergency key="emergency" />}
        </AnimatePresence>
      </main>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          from { background-position: 0 -100%; }
          to { background-position: 0 100%; }
        }
      `}} />
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all active:scale-[0.98] ${
        active 
          ? 'bg-primary-container/20 text-primary border-r-2 border-primary' 
          : 'text-slate-500 hover:text-slate-300 hover:bg-surface-container'
      }`}
    >
      {icon}
      <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}
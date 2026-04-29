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
  const [collapsed, setCollapsed] = useState(false);
  const { profile, user, signOut } = useAuth();
  
  // Basic fallback if roles aren't fully set
  const roleLabel = profile?.role || 'ADMIN';

  // Auto-collapse on smaller screens
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-on-surface">
      {/* Sidebar Navigation - Collapsible */}
      <aside className={`border-r border-outline-variant bg-[#0B1220] flex flex-col z-50 shrink-0 transition-all duration-300 ease-in-out ${
        collapsed ? 'w-[72px]' : 'w-64'
      }`}>
        <div className="p-6 relative">
          {/* Toggle Button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-6 bg-primary-container/30 hover:bg-primary-container/50 text-primary p-1.5 rounded-full border border-primary/30 transition-all duration-300 z-10"
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            )}
          </button>

          {/* Branding - Hidden when collapsed */}
          {!collapsed && (
            <div className="transition-opacity duration-300">
              <h1 className="text-xl font-bold tracking-tighter text-white">PeopleFirst</h1>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-bold text-primary tracking-widest uppercase">Network Active</span>
              </div>
            </div>
          )}
          
          {/* Icon-only branding when collapsed */}
          {collapsed && (
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                <span className="text-lg font-bold text-primary">P</span>
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-4">
          <SidebarItem 
            icon={<LayoutDashboard size={18} />} 
            label="Operations" 
            active={screen === 'dashboard'} 
            onClick={() => setScreen('dashboard')}
            collapsed={collapsed}
          />
          <SidebarItem 
            icon={<Bell size={18} />} 
            label="Alerts" 
            active={screen === 'alerts'}
            onClick={() => setScreen('alerts')}
            collapsed={collapsed}
          />
          <SidebarItem 
            icon={<Ambulance size={18} />} 
            label="Rescue Teams" 
            active={screen === 'rescue'} 
            onClick={() => setScreen('rescue')}
            collapsed={collapsed}
          />
          <SidebarItem 
            icon={<Users size={18} />} 
            label="Volunteer List" 
            active={screen === 'volunteers'} 
            onClick={() => setScreen('volunteers')}
            collapsed={collapsed}
          />
          <SidebarItem 
            icon={<MapIcon size={18} />} 
            label="Local Map" 
            active={screen === 'map'}
            onClick={() => setScreen('map')}
            collapsed={collapsed}
          />
          <SidebarItem 
            icon={<Settings size={18} />} 
            label="System Status" 
            active={screen === 'system'}
            onClick={() => setScreen('system')}
            collapsed={collapsed}
          />
        </nav>

        <div className="p-4 border-t border-outline-variant space-y-4">
          <button 
            onClick={() => setScreen('emergency')}
            className={`w-full py-3 bg-error-container text-on-surface border border-error/30 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-error-container/80 transition-all active:scale-95 ${
              collapsed ? 'p-2 py-2.5' : ''
            }`}
            title={collapsed ? "Declare Emergency" : undefined}
          >
            <AlertTriangle size={14} />
            {!collapsed && <span>Declare Emergency</span>}
          </button>
          
          {!collapsed && (
            <div className="flex items-center justify-between gap-3 px-3 py-2 bg-surface-container rounded-lg border border-outline-variant transition-all duration-300">
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
          )}

          {collapsed && (
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container group relative cursor-pointer" title="User Profile">
                <Users size={16} />
                <div className="absolute left-14 bg-slate-900 text-white text-xs px-2 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-slate-700">
                  {profile?.email || user?.email || 'OFFICER_01'}
                </div>
              </div>
              <button onClick={signOut} className="text-slate-400 hover:text-error transition-colors p-1 group relative" title="Sign Out">
                <LogOut size={16} />
                <div className="absolute left-14 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-slate-700">
                  Sign Out
                </div>
              </button>
            </div>
          )}
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

function SidebarItem({ icon, label, active, onClick, collapsed }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all active:scale-[0.98] relative group ${
        active 
          ? 'bg-primary-container/20 text-primary border-r-2 border-primary' 
          : 'text-slate-500 hover:text-slate-300 hover:bg-surface-container'
      } ${collapsed ? 'px-2 justify-center' : ''}`}
      title={collapsed ? label : undefined}
    >
      {icon}
      
      {!collapsed && (
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
      )}

      {/* Tooltip - shown when collapsed */}
      {collapsed && (
        <span className="absolute left-14 bg-slate-900 text-white text-xs px-2 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-slate-700 pointer-events-none">
          {label}
        </span>
      )}
    </button>
  );
}
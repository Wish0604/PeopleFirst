import React, { useMemo } from 'react';
import { 
  AlertCircle, 
  Send, 
  TrendingUp, 
  XCircle, 
  Activity, 
  CheckCircle2, 
  Wifi, 
  MessageSquare,
  ShieldAlert,
  MapPin
} from 'lucide-react';
import { motion } from 'motion/react';
import { useCollectionSnapshot } from '../hooks/useCollectionSnapshot';

function formatTime(timestamp) {
  if (!timestamp?.toDate) return 'moments ago';
  const date = timestamp.toDate();
  const now = new Date();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'moments ago';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
}

export default function DashboardScreen() {
  const alerts = useCollectionSnapshot('alerts');
  const responses = useCollectionSnapshot('responses');
  const deliveryLogs = useCollectionSnapshot('deliveryLogs');

  const metrics = useMemo(() => {
    const sent = deliveryLogs.filter(l => l.status === 'SENT').length;
    const failed = deliveryLogs.filter(l => l.status === 'FAILED').length;
    const sms = deliveryLogs.filter(l => l.channel === 'SMS' && l.status === 'SENT').length;
    return { sent, failed, sms };
  }, [deliveryLogs]);

  const criticalAlerts = useMemo(() => {
    return alerts
      .filter(a => (a.riskPriority || 'ROUTINE').toUpperCase() !== 'ROUTINE')
      .slice(0, 3);
  }, [alerts]);
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 h-full flex flex-col gap-6 overflow-y-auto overflow-x-hidden"
    >
      <div className="grid grid-cols-12 gap-6 h-full min-w-0">
        {/* Left Panel: Alert Feed */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Active Alerts</h2>
            <span className="px-2 py-1 bg-error/10 border border-error/30 text-error text-[10px] font-black rounded-full uppercase tracking-tighter">{criticalAlerts.length} Active</span>
          </div>
          
          <div className="flex-1 space-y-3">
            {criticalAlerts.length > 0 ? (
              criticalAlerts.map((alert, idx) => (
                <AlertCard 
                  key={alert.id}
                  priority={alert.riskPriority || 'HIGH'}
                  time={formatTime(alert.createdAt)}
                  title={alert.title || 'Alert'}
                  desc={alert.message || ''}
                  active={idx === 0}
                />
              ))
            ) : (
              <div className="text-slate-400 text-sm p-4 text-center">No active alerts</div>
            )}
            
            <button className="w-full py-4 text-[10px] font-black text-primary uppercase tracking-[0.2em] border border-primary/20 rounded-xl hover:bg-primary/5 transition-all">
              View All ({alerts.length})
            </button>
          </div>
        </div>

        {/* Right Panel: Grid Layout */}
        <div className="col-span-12 lg:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-min min-w-0">
          {/* Map Panel */}
          <div className="md:col-span-2 bg-surface-container border border-outline-variant rounded-2xl overflow-hidden relative min-h-[400px] min-w-0">
            <div className="absolute top-4 left-4 z-10 space-y-2">
              <div className="bg-background/80 backdrop-blur-md px-4 py-2 rounded-xl border border-outline-variant flex items-center gap-3">
                <div className="w-3 h-3 bg-error rounded-full animate-pulse shadow-[0_0_10px_rgba(255,180,171,0.5)]" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Impact Zone: North Coastal</span>
              </div>
            </div>
            
            {/* Map Placeholder */}
            <div className="absolute inset-0 grayscale brightness-50 opacity-40">
              <img 
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=2000" 
                className="w-full h-full object-cover" 
                alt="Tactical satellite map"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
            
            {/* Map Markers Overlay */}
            <div className="absolute top-[40%] left-[45%] flex flex-col items-center">
              <div className="w-12 h-12 rounded-full border-2 border-error animate-ping absolute" />
              <div className="w-8 h-8 bg-error rounded-full flex items-center justify-center relative z-10 shadow-lg shadow-error/40">
                <AlertCircle size={14} className="text-on-error" />
              </div>
            </div>
          </div>

          {/* Alert Details */}
          <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 min-w-0">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-xl font-bold text-white">Alert Detail</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">ID: #FL-2023-094</p>
              </div>
              <div className="text-right">
                <div className="text-5xl font-black text-error leading-none">82</div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 text-right">Risk Score</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 bg-background border border-outline-variant rounded-xl">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Type</p>
                <p className="text-lg font-bold text-white">Flood</p>
              </div>
              <div className="p-4 bg-background border border-outline-variant rounded-xl">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Zone</p>
                <p className="text-lg font-bold text-white">North Coastal</p>
              </div>
            </div>

            <div className="space-y-4 min-w-0">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Control Panel</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                <ControlButton icon={<Send size={16} />} label="Resend" color="primary" />
                <ControlButton icon={<TrendingUp size={16} />} label="Escalate" color="tertiary" />
                <button className="col-span-1 sm:col-span-2 w-full flex items-center justify-center gap-3 py-3 border border-outline-variant text-white font-bold rounded-xl hover:bg-surface-container-high transition-all active:scale-95 text-xs uppercase tracking-widest min-w-0">
                  <XCircle size={16} />
                  Cancel Alert
                </button>
              </div>
            </div>
          </div>

          {/* Delivery Metrics */}
          <div className="flex flex-col gap-6 min-w-0">
            <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 flex-1 min-w-0">
              <h2 className="text-xl font-bold text-white mb-6">Delivery Status</h2>
              <div className="space-y-6">
              <MetricBar label="Push Notification" value={metrics.sent} status="Sent" color="bg-emerald-500" />
              <MetricBar label="SMS Gateway" value={metrics.sms} status="Sent" color="bg-tertiary" />
              <MetricBar label="Failed" value={metrics.failed} status="Failed" color="bg-error" />
              </div>
            </div>

            <div className="bg-surface-container border border-outline-variant rounded-xl p-4 grid grid-cols-2 gap-4 min-w-0">
              <StatusIndicator label="Total Alerts" status={alerts.length} online />
              <StatusIndicator label="Total Responses" status={responses.length} />
            </div>
          </div>

          {/* Recent Activity Log */}
          <div className="md:col-span-2 bg-surface-container border border-outline-variant rounded-2xl p-6 min-w-0">
            <h2 className="text-xl font-bold text-white mb-6">Recent Activity Log</h2>
            <div className="space-y-4">
              {deliveryLogs.slice(0, 3).map((log, idx) => (
                <ActivityItem
                  key={log.id}
                  icon={log.status === 'FAILED' ? <AlertCircle size={14} /> : <Send size={14} />}
                  text={`${log.channel} delivery to ${log.recipientId || 'recipient'}: ${log.status}`}
                  time={formatTime(log.createdAt)}
                  color={log.status === 'FAILED' ? 'text-error' : 'text-primary'}
                  last={idx === deliveryLogs.slice(0, 3).length - 1}
                />
              ))}
              {deliveryLogs.length === 0 && (
                <div className="text-slate-400 text-sm p-4 text-center">No delivery activity yet</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function AlertCard({ priority, time, title, desc, active, dim }) {
  return (
    <div className={`p-4 bg-surface-container border rounded-xl cursor-pointer transition-all ${
      active ? 'border-error ring-1 ring-error/20 bg-surface-container-high' : 'border-outline-variant'
    } ${dim ? 'opacity-50' : 'hover:border-primary/50'}`}>
      <div className="flex justify-between items-start mb-2">
        <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${
          priority === 'CRITICAL' ? 'bg-error text-on-error' : 
          priority === 'HIGH' ? 'bg-tertiary text-on-tertiary' : 'bg-primary text-on-primary'
        }`}>
          {priority}
        </span>
        <span className="text-slate-500 text-[10px] font-bold">{time}</span>
      </div>
      <h3 className="text-sm font-bold text-white leading-tight mb-1">{title}</h3>
      <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">{desc}</p>
    </div>
  );
}

function ControlButton({ icon, label, color }) {
  const colorStyles = {
    primary: 'bg-primary-container text-on-primary-container shadow-primary-container/20',
    tertiary: 'bg-tertiary text-on-tertiary shadow-tertiary/20'
  };
  return (
    <button className={`w-full min-w-0 flex items-center justify-center gap-3 py-3 rounded-xl transition-all active:scale-95 text-xs font-bold uppercase tracking-widest shadow-lg ${colorStyles[color]}`}>
      {icon}
      {label}
    </button>
  );
}

function MetricBar({ label, value, status, color }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-slate-300">{label}</span>
        <span className={`text-[10px] font-black uppercase tracking-wider ${status === 'Failed' ? 'text-error' : 'text-emerald-400'}`}>
          {status === 'Success' ? `${value}% Success` : status === 'Sending' ? `${value}% Sending` : 'Failed'}
        </span>
      </div>
      <div className="h-1.5 bg-background rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }} 
          transition={{ duration: 1 }}
          className={`h-full ${color}`} 
        />
      </div>
    </div>
  );
}

function StatusIndicator({ label, status, online }) {
  return (
    <div className="text-center p-3 bg-background border border-outline-variant rounded-xl flex flex-col items-center">
      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-500' : 'bg-tertiary animate-pulse'}`} />
        <span className="text-[10px] font-black text-white uppercase tracking-widest">{status}</span>
      </div>
    </div>
  );
}

function ActivityItem({ icon, text, time, color, last }) {
  return (
    <div className={`flex gap-4 items-start ${last ? '' : 'pb-4 border-b border-outline-variant/30'}`}>
      <div className={`w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center shrink-0 ${color} bg-background`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-xs font-medium text-white">{text}</p>
        <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase tracking-tight">{time}</p>
      </div>
    </div>
  );
}

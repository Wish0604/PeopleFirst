import React, { useMemo } from 'react';
import { 
  AlertCircle, 
  Send, 
  TrendingUp, 
  XCircle, 
  CheckCircle2, 
  ShieldAlert
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

  const criticalAlerts = useMemo(() => {
    return alerts
      .filter(a => (a.riskPriority || 'ROUTINE').toUpperCase() !== 'ROUTINE')
      .slice(0, 3);
  }, [alerts]);

  const primaryAlert = criticalAlerts[0] || alerts[0] || null;
  const alertScore = Number(primaryAlert?.riskIntelligenceScore ?? primaryAlert?.riskScore ?? 82);
  const alertTone = alertScore >= 80 ? 'text-error' : alertScore >= 60 ? 'text-tertiary' : 'text-emerald-400';
  const alertToneLabel = alertScore >= 80 ? 'HIGH' : alertScore >= 60 ? 'ELEVATED' : 'MONITORING';

  const deliveryRows = useMemo(() => {
    const latestByChannel = (channelNames) => {
      const normalizedNames = Array.isArray(channelNames) ? channelNames : [channelNames];
      return deliveryLogs.find((log) =>
        normalizedNames.some((name) => (log.channel || '').toUpperCase().includes(name))
      );
    };

    const toRow = (label, channelNames) => {
      const latest = latestByChannel(channelNames);
      const status = latest?.status || 'PENDING';
      const delivered = status === 'SENT';
      const failed = status === 'FAILED';

      return {
        label,
        status,
        tone: delivered ? 'text-emerald-400' : failed ? 'text-error' : 'text-slate-400',
        icon: delivered ? <CheckCircle2 size={16} /> : failed ? <XCircle size={16} /> : <ShieldAlert size={16} />,
      };
    };

    return [
      toRow('Push Notification', ['FCM', 'PUSH']),
      toRow('SMS Gateway', ['SMS']),
      toRow('Voice Call', ['VOICE', 'CALL']),
    ];
  }, [deliveryLogs]);

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

        {/* Center Map Panel */}
        <div className="col-span-12 lg:col-span-6 bg-surface-container border border-outline-variant rounded-2xl overflow-hidden relative min-h-[400px] min-w-0">
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

        {/* Right Rail: Summary / Delivery / Actions */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 min-w-0">
          <section className="bg-[#0B1A2B] rounded-2xl p-5 space-y-4 border border-outline-variant/70 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-white truncate">{primaryAlert?.title || 'Flood Alert'}</h2>
                <p className="text-sm text-slate-400 truncate">{primaryAlert?.sourceZoneName || 'North Coastal Zone'}</p>
              </div>
              <div className="text-right shrink-0">
                <div className={`text-4xl font-black leading-none ${alertTone}`}>{alertScore}</div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 text-right">{alertToneLabel}</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl border border-outline-variant/50 bg-background/40 px-4 py-3">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Alert ID</p>
                <p className="text-sm font-semibold text-white">{primaryAlert?.id ? `#${primaryAlert.id}` : '#FL-2023-094'}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Time</p>
                <p className="text-sm font-semibold text-white">{formatTime(primaryAlert?.createdAt)}</p>
              </div>
            </div>
          </section>

          <section className="bg-[#0B1A2B] rounded-2xl p-5 space-y-3 border border-outline-variant/70 min-w-0">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Send size={15} className="text-primary" />
              Delivery Status
            </h3>

            {deliveryRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-4 text-sm">
                <span className="text-slate-300 truncate">{row.label}</span>
                <span className={`inline-flex items-center gap-1.5 font-semibold ${row.tone}`}>
                  {row.icon}
                  {row.status === 'SENT' ? 'Delivered' : row.status === 'FAILED' ? 'Failed' : 'Pending'}
                </span>
              </div>
            ))}

            <div className="pt-2 border-t border-outline-variant/50 text-[10px] text-slate-500 uppercase tracking-[0.2em]">
              Delivery loop: alert → channel dispatch → response tracking
            </div>
          </section>

          <section className="bg-[#0B1A2B] rounded-2xl p-5 space-y-4 border border-outline-variant/70 min-w-0">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldAlert size={15} className="text-tertiary" />
              Actions
            </h3>

            <button className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
              <Send size={16} />
              Resend Alert
            </button>

            <button className="w-full bg-yellow-500 hover:bg-yellow-600 py-3 rounded-xl text-[#0B1220] font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
              <TrendingUp size={16} />
              Escalate
            </button>

            <button className="w-full bg-red-600 hover:bg-red-700 py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
              <XCircle size={16} />
              Cancel Alert
            </button>

            <div className="pt-2 border-t border-outline-variant/50 text-[10px] text-slate-400">
              Result feed: {responses.length} responses captured
            </div>
          </section>
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


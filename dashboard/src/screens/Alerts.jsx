import React, { useMemo } from 'react';
import { AlertTriangle, X, Bell, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
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

export default function Alerts() {
  const firestoreAlerts = useCollectionSnapshot('alerts');

  const alerts = useMemo(() => {
    return firestoreAlerts.map(alert => ({
      id: alert.id,
      priority: alert.riskPriority || 'MEDIUM',
      title: alert.title || 'Alert',
      description: alert.message || '',
      time: formatTime(alert.createdAt),
      location: alert.sourceZoneName || alert.sourceZoneId || 'Unknown location',
      status: 'active',
    }));
  }, [firestoreAlerts]);

  const dismissAlert = (id) => {
    console.log(`Alert ${id} archived (permanent delete not implemented)`);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-error text-on-error';
      case 'HIGH':
        return 'bg-tertiary text-on-tertiary';
      case 'MEDIUM':
        return 'bg-primary text-on-primary';
      default:
        return 'bg-primary text-on-primary';
    }
  };

  const getStatusIcon = (priority) => {
    switch (priority) {
      case 'CRITICAL':
        return <AlertTriangle size={16} />;
      case 'HIGH':
        return <AlertCircle size={16} />;
      default:
        return <Bell size={16} />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 h-full flex flex-col gap-6 overflow-y-auto"
    >
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Active Alerts</h1>
        <p className="text-slate-400">{alerts.length} alerts requiring attention</p>
      </div>

      {alerts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface-container border border-outline-variant rounded-xl p-4 relative group hover:border-primary/50 transition-all"
            >
              {/* Priority Badge */}
              <div className="flex items-center justify-between mb-3">
                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${getPriorityColor(alert.priority)}`}>
                  {getStatusIcon(alert.priority)}
                  {alert.priority}
                </span>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="text-slate-500 hover:text-error opacity-0 group-hover:opacity-100 transition-all p-1"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Title */}
              <h3 className="text-sm font-bold text-white mb-2">{alert.title}</h3>

              {/* Description */}
              <p className="text-xs text-slate-400 mb-3 line-clamp-2">{alert.description}</p>

              {/* Location */}
              <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                {alert.location}
              </div>

              {/* Time */}
              <div className="flex items-center gap-2 text-[9px] text-slate-600 uppercase font-bold tracking-tighter">
                <Clock size={12} />
                {alert.time}
              </div>

              {/* Status Indicator */}
              {alert.status === 'resolved' && (
                <div className="absolute top-4 right-4 text-emerald-400">
                  <CheckCircle2 size={16} />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Bell size={48} className="mx-auto text-slate-500 mb-4" />
            <p className="text-slate-400 font-medium">No alerts at this time</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

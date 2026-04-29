import React, { useMemo, useState, useCallback, useRef } from 'react';
import { 
  AlertCircle, 
  Send, 
  TrendingUp, 
  XCircle, 
  CheckCircle2, 
  ShieldAlert
} from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../firebase';
import { addDoc, collection, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
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
  const [actionLoading, setActionLoading] = useState({ resend: false, escalate: false, cancel: false });
  const primaryAlertRef = useRef(null);

  const setLoading = useCallback((key, v) => setActionLoading(s => ({ ...s, [key]: v })), []);

  const alerts = useCollectionSnapshot('alerts');
  const responses = useCollectionSnapshot('responses');
  const deliveryLogs = useCollectionSnapshot('deliveryLogs');

  const criticalAlerts = useMemo(() => {
    return alerts
      .filter(a => (a.riskPriority || 'ROUTINE').toUpperCase() !== 'ROUTINE')
      .slice(0, 3);
  }, [alerts]);

  const primaryAlert = criticalAlerts[0] || alerts[0] || null;
  primaryAlertRef.current = primaryAlert;
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

  const latestResponse = responses[0] || null;
  const sentDeliveries = deliveryLogs.filter((log) => log.status === 'SENT').length;
  const failedDeliveries = deliveryLogs.filter((log) => log.status === 'FAILED').length;

  const handleResend = useCallback(async () => {
    const currentAlert = primaryAlertRef.current;
    if (!currentAlert?.id) return;
    setLoading('resend', true);
    try {
      await addDoc(collection(db, 'deliveryLogs'), {
        alertId: currentAlert.id,
        channel: 'MANUAL_RESEND',
        status: 'RETRY',
        createdAt: serverTimestamp(),
        createdBy: 'dashboard-ui',
      });
      // Audit entry
      await addDoc(collection(db, 'auditLogs'), {
        action: 'RESEND',
        alertId: currentAlert.id,
        actor: 'dashboard-ui',
        outcome: 'REQUESTED',
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Resend failed', err);
    } finally {
      setLoading('resend', false);
    }
  }, [/* primaryAlert intentionally omitted to use latest value */ setLoading]);

  const handleEscalate = useCallback(async () => {
    const currentAlert = primaryAlertRef.current;
    if (!currentAlert?.id) return;
    setLoading('escalate', true);
    try {
      const alertRef = doc(db, 'alerts', currentAlert.id);
      await updateDoc(alertRef, {
        riskPriority: 'CRITICAL',
        escalatedAt: serverTimestamp(),
        escalatedBy: 'dashboard-ui',
      });
      // Audit entry
      await addDoc(collection(db, 'auditLogs'), {
        action: 'ESCALATE',
        alertId: currentAlert.id,
        actor: 'dashboard-ui',
        outcome: 'UPDATED_ALERT',
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Escalate failed', err);
    } finally {
      setLoading('escalate', false);
    }
  }, [setLoading]);

  const handleCancel = useCallback(async () => {
    const currentAlert = primaryAlertRef.current;
    if (!currentAlert?.id) return;
    setLoading('cancel', true);
    try {
      const alertRef = doc(db, 'alerts', currentAlert.id);
      await updateDoc(alertRef, {
        status: 'CANCELLED',
        cancelledAt: serverTimestamp(),
        cancelledBy: 'dashboard-ui',
      });
      // Audit entry
      await addDoc(collection(db, 'auditLogs'), {
        action: 'CANCEL',
        alertId: currentAlert.id,
        actor: 'dashboard-ui',
        outcome: 'UPDATED_ALERT',
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Cancel failed', err);
    } finally {
      setLoading('cancel', false);
    }
  }, [setLoading]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 h-full flex flex-col gap-6 overflow-y-auto overflow-x-hidden"
    >
      <div className="grid grid-cols-12 gap-6 h-full min-w-0">
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Impact Zone: {primaryAlert?.sourceZoneName || primaryAlert?.sourceZoneId || 'Live Operations'}
            </h2>
            <span className="px-2 py-1 bg-primary/10 border border-primary/30 text-primary text-[10px] font-black rounded-full uppercase tracking-tighter">
              Live Zone
            </span>
          </div>
          
          <div className="flex-1 space-y-3">
            <div className="rounded-2xl border border-outline-variant bg-background/50 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-error animate-pulse shadow-[0_0_10px_rgba(255,180,171,0.55)]" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Primary Zone</p>
                  <p className="text-sm font-semibold text-white truncate">
                    {primaryAlert?.sourceZoneName || primaryAlert?.sourceZoneId || 'Live Operations'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-outline-variant bg-surface-container/60 p-3">
                  <p className="text-slate-500 uppercase tracking-widest font-black text-[9px]">Alerts</p>
                  <p className="mt-2 text-2xl font-black text-white">{criticalAlerts.length}</p>
                </div>
                <div className="rounded-xl border border-outline-variant bg-surface-container/60 p-3">
                  <p className="text-slate-500 uppercase tracking-widest font-black text-[9px]">Status</p>
                  <p className={`mt-2 text-2xl font-black ${alertTone}`}>{alertToneLabel}</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {primaryAlert?.title || primaryAlert?.message || 'No active impact details available.'}
              </p>
            </div>
            <div className="rounded-2xl border border-outline-variant bg-background/40 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Zone Focus</p>
                <span className="text-[10px] font-black uppercase tracking-wider text-primary">{sentDeliveries} Delivered</span>
              </div>
              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex items-center justify-between">
                  <span>Responses</span>
                  <span className="font-semibold text-white">{responses.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Deliveries</span>
                  <span className="font-semibold text-white">{deliveryLogs.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Failed</span>
                  <span className="font-semibold text-error">{failedDeliveries}</span>
                </div>
              </div>
            </div>
            
            <button className="w-full py-4 text-[10px] font-black text-primary uppercase tracking-[0.2em] border border-primary/20 rounded-xl hover:bg-primary/5 transition-all">
              View All ({alerts.length})
            </button>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6 bg-surface-container border border-outline-variant rounded-2xl overflow-hidden relative min-h-[400px] min-w-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.25),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(255,180,171,0.18),_transparent_32%),linear-gradient(180deg,_rgba(11,18,32,0.96),_rgba(11,18,32,0.82))]" />

          <div className="absolute top-4 left-4 z-10 space-y-2">
            <div className="bg-background/80 backdrop-blur-md px-4 py-2 rounded-xl border border-outline-variant flex items-center gap-3">
              <div className="w-3 h-3 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(97,169,255,0.45)]" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                Active Alerts: {criticalAlerts.length}
              </span>
            </div>
          </div>

          <div className="absolute top-4 right-4 z-10 bg-background/80 backdrop-blur-md px-4 py-2 rounded-xl border border-outline-variant text-[10px] font-bold text-slate-300 uppercase tracking-wider">
            Live data board
          </div>

          <div className="absolute inset-0 p-6 pt-20 flex flex-col justify-between gap-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-outline-variant bg-background/50 p-4">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Open Alerts</p>
                <p className="mt-3 text-3xl font-black text-white">{criticalAlerts.length}</p>
                <p className="mt-1 text-xs text-slate-400">Active escalations in Firestore</p>
              </div>
              <div className="rounded-2xl border border-outline-variant bg-background/50 p-4">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Live Responses</p>
                <p className="mt-3 text-3xl font-black text-white">{responses.length}</p>
                <p className="mt-1 text-xs text-slate-400">Citizen acknowledgements tracked</p>
              </div>
              <div className="rounded-2xl border border-outline-variant bg-background/50 p-4">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Sent Deliveries</p>
                <p className="mt-3 text-3xl font-black text-emerald-400">{sentDeliveries}</p>
                <p className="mt-1 text-xs text-slate-400">Push, SMS, and voice confirmations</p>
              </div>
              <div className="rounded-2xl border border-outline-variant bg-background/50 p-4">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Failed Deliveries</p>
                <p className="mt-3 text-3xl font-black text-error">{failedDeliveries}</p>
                <p className="mt-1 text-xs text-slate-400">Retries will appear in audit logs</p>
              </div>
            </div>

            {/* Latest Response removed per request */}
          </div>
        </div>

        {/* Right Rail turned into a 3-column compact rail: Alert Summary | Delivery Status | Actions */}
        <div className="col-span-12 lg:col-span-3 min-w-0">
          <div className="p-4">
            <div className="grid grid-cols-3 gap-4 items-stretch">

              {/* 1. ALERT */}
              <div className="h-full">
                <section className="bg-[#0B1A2B] rounded-2xl p-5 space-y-4 border border-outline-variant/70 min-w-0 h-full flex flex-col justify-between">
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
              </div>

              {/* 2. DELIVERY */}
              <div className="h-full">
                <section className="bg-[#0B1A2B] rounded-2xl p-5 space-y-3 border border-outline-variant/70 min-w-0 h-full flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Send size={15} className="text-primary" />
                      Delivery Status
                    </h3>

                    <div className="mt-3 space-y-2">
                      {deliveryRows.map((row) => (
                        <div key={row.label} className="flex items-center justify-between gap-4 text-sm">
                          <span className="text-slate-300 truncate">{row.label}</span>
                          <span className={`inline-flex items-center gap-1.5 font-semibold ${row.tone}`}>
                            {row.icon}
                            {row.status === 'SENT' ? 'Delivered' : row.status === 'FAILED' ? 'Failed' : 'Pending'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-outline-variant/50 text-[10px] text-slate-500 uppercase tracking-[0.2em]">
                    Delivery loop: alert → channel dispatch → response tracking
                  </div>
                </section>
              </div>

              {/* 3. ACTIONS */}
              <div className="h-full">
                <section className="bg-[#0B1A2B] rounded-2xl p-5 space-y-4 border border-outline-variant/70 min-w-0 h-full flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <ShieldAlert size={15} className="text-tertiary" />
                      Actions
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <button onClick={handleResend} disabled={actionLoading.resend} aria-busy={actionLoading.resend} className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
                      <Send size={16} />
                      {actionLoading.resend ? 'Resending…' : 'Resend Alert'}
                    </button>

                    <button onClick={handleEscalate} disabled={actionLoading.escalate} aria-busy={actionLoading.escalate} className="w-full bg-yellow-500 hover:bg-yellow-600 py-2 rounded-xl text-[#0B1220] font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
                      <TrendingUp size={16} />
                      {actionLoading.escalate ? 'Escalating…' : 'Escalate'}
                    </button>

                    <button onClick={handleCancel} disabled={actionLoading.cancel} aria-busy={actionLoading.cancel} className="w-full bg-red-600 hover:bg-red-700 py-2 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
                      <XCircle size={16} />
                      {actionLoading.cancel ? 'Cancelling…' : 'Cancel Alert'}
                    </button>
                  </div>

                  <div className="pt-2 border-t border-outline-variant/50 text-[10px] text-slate-400">
                    Result feed: {responses.length} responses captured
                  </div>
                </section>
              </div>

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


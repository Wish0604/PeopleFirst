import React, { useState, useEffect } from 'react';
import { Activity, Wifi, Database, Server, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'motion/react';

export default function SystemStatus() {
  const [systems, setSystems] = useState([
    {
      id: 1,
      name: 'Communication Network',
      status: 'operational',
      uptime: '99.8%',
      latency: '12ms',
      lastCheck: '2m ago',
    },
    {
      id: 2,
      name: 'Database Server',
      status: 'operational',
      uptime: '99.9%',
      latency: '5ms',
      lastCheck: '1m ago',
    },
    {
      id: 3,
      name: 'API Gateway',
      status: 'operational',
      uptime: '99.7%',
      latency: '18ms',
      lastCheck: '30s ago',
    },
    {
      id: 4,
      name: 'Alert System',
      status: 'operational',
      uptime: '99.6%',
      latency: '8ms',
      lastCheck: '45s ago',
    },
    {
      id: 5,
      name: 'Backup Storage',
      status: 'operational',
      uptime: '98.5%',
      latency: '35ms',
      lastCheck: '2m ago',
    },
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational':
        return 'text-emerald-400 bg-emerald-500/10';
      case 'degraded':
        return 'text-tertiary bg-tertiary/10';
      case 'offline':
        return 'text-error bg-error/10';
      default:
        return 'text-slate-400 bg-slate-500/10';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'operational':
        return <CheckCircle size={16} />;
      case 'degraded':
        return <AlertCircle size={16} />;
      case 'offline':
        return <AlertCircle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const systemIcons = {
    'Communication Network': <Wifi size={20} />,
    'Database Server': <Database size={20} />,
    'API Gateway': <Server size={20} />,
    'Alert System': <Activity size={20} />,
    'Backup Storage': <Database size={20} />,
  };

  const operationalCount = systems.filter((s) => s.status === 'operational').length;
  const totalUptime = (systems.reduce((sum, s) => sum + parseFloat(s.uptime), 0) / systems.length).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 h-full flex flex-col gap-6 overflow-y-auto"
    >
      {/* Header Stats */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">System Status</h1>
        <p className="text-slate-400">Real-time infrastructure monitoring</p>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-container border border-outline-variant rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Operational</span>
            <CheckCircle size={16} className="text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-white">
            {operationalCount}/{systems.length}
          </p>
          <p className="text-xs text-slate-500 mt-2">Systems running normally</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface-container border border-outline-variant rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg Uptime</span>
            <Activity size={16} className="text-primary" />
          </div>
          <p className="text-3xl font-bold text-white">{totalUptime}%</p>
          <p className="text-xs text-slate-500 mt-2">Last 24 hours average</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface-container border border-outline-variant rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg Latency</span>
            <Clock size={16} className="text-tertiary" />
          </div>
          <p className="text-3xl font-bold text-white">
            {Math.round(systems.reduce((sum, s) => sum + parseInt(s.latency), 0) / systems.length)}ms
          </p>
          <p className="text-xs text-slate-500 mt-2">Response time</p>
        </motion.div>
      </div>

      {/* System List */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-white">System Components</h2>
        {systems.map((system, idx) => (
          <motion.div
            key={system.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-surface-container border border-outline-variant rounded-lg p-4 flex items-center justify-between hover:border-primary/50 transition-all"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="text-slate-400">{systemIcons[system.name] || <Activity size={20} />}</div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">{system.name}</p>
                <div className="flex items-center gap-4 mt-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase ${getStatusColor(system.status)}`}>
                    {getStatusIcon(system.status)}
                    {system.status}
                  </span>
                  <span className="text-xs text-slate-500">Uptime: {system.uptime}</span>
                  <span className="text-xs text-slate-500">Latency: {system.latency}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-500 uppercase font-bold">{system.lastCheck}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Details */}
      <div className="bg-surface-container-high border border-outline-variant rounded-lg p-4 text-xs text-slate-400 leading-relaxed">
        <p className="font-bold text-white mb-2">Last Updated: {new Date().toLocaleTimeString()}</p>
        <p>All systems are functioning within normal parameters. Monitoring continues in real-time.</p>
      </div>
    </motion.div>
  );
}

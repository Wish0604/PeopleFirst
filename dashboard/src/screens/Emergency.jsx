import React, { useState } from 'react';
import { AlertTriangle, Send, Phone, Radio, Users, MapPin, Clock, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

export default function Emergency() {
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [emergencyType, setEmergencyType] = useState('natural_disaster');
  const [showDetails, setShowDetails] = useState(false);

  const emergencyTypes = [
    { id: 'natural_disaster', label: 'Natural Disaster', icon: '🌊' },
    { id: 'accident', label: 'Major Accident', icon: '🚗' },
    { id: 'structural', label: 'Structural Collapse', icon: '🏢' },
    { id: 'health', label: 'Health Crisis', icon: '🏥' },
    { id: 'fire', label: 'Fire Emergency', icon: '🔥' },
    { id: 'other', label: 'Other', icon: '⚠️' },
  ];

  const declareEmergency = () => {
    setEmergencyActive(true);
    console.log(`Emergency declared: ${emergencyType}`);
  };

  const cancelEmergency = () => {
    setEmergencyActive(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 h-full flex flex-col gap-6 overflow-y-auto"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Emergency Declaration</h1>
        <p className="text-slate-400">Initiate emergency response protocols</p>
      </div>

      {emergencyActive ? (
        // Active Emergency View
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="flex-1 flex flex-col items-center justify-center gap-6"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="relative"
          >
            <div className="w-24 h-24 bg-error/20 border-2 border-error rounded-full flex items-center justify-center">
              <AlertTriangle size={48} className="text-error animate-pulse" />
            </div>
          </motion.div>

          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold text-error mb-2">EMERGENCY ACTIVE</h2>
            <p className="text-slate-400 mb-4">
              Emergency protocol has been activated. All response teams have been notified.
            </p>
            <p className="text-sm text-slate-500 uppercase font-bold">
              Type: {emergencyTypes.find((t) => t.id === emergencyType)?.label}
            </p>
          </div>

          {/* Active Emergency Stats */}
          <div className="grid grid-cols-3 gap-4 w-full max-w-md">
            <div className="bg-surface-container border border-outline-variant rounded-lg p-4 text-center">
              <Users size={24} className="mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold text-white">12</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Teams Deployed</p>
            </div>
            <div className="bg-surface-container border border-outline-variant rounded-lg p-4 text-center">
              <MapPin size={24} className="mx-auto text-tertiary mb-2" />
              <p className="text-2xl font-bold text-white">47</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Coordinates Set</p>
            </div>
            <div className="bg-surface-container border border-outline-variant rounded-lg p-4 text-center">
              <Clock size={24} className="mx-auto text-emerald-400 mb-2" />
              <p className="text-2xl font-bold text-white">2:34</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Duration</p>
            </div>
          </div>

          <button
            onClick={cancelEmergency}
            className="px-8 py-3 bg-error hover:bg-error/90 text-on-error border border-error/50 rounded-lg text-sm font-black uppercase tracking-widest transition-all active:scale-95"
          >
            Cancel Emergency
          </button>
        </motion.div>
      ) : (
        // Declaration Form
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
          {/* Type Selection */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Select Emergency Type</h3>
            <div className="grid grid-cols-2 gap-3">
              {emergencyTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setEmergencyType(type.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-center ${
                    emergencyType === type.id
                      ? 'border-primary bg-primary/10'
                      : 'border-outline-variant hover:border-primary/50'
                  }`}
                >
                  <div className="text-2xl mb-2">{type.icon}</div>
                  <p className="text-xs font-bold text-white uppercase">{type.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Details Panel */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Emergency Details</h3>

            <motion.div
              className="bg-surface-container border border-outline-variant rounded-lg p-4 space-y-4"
            >
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase block mb-2">Location</label>
                <input
                  type="text"
                  placeholder="Enter incident location"
                  className="w-full bg-background border border-outline-variant rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 uppercase block mb-2">Description</label>
                <textarea
                  placeholder="Provide incident details"
                  rows={3}
                  className="w-full bg-background border border-outline-variant rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-error/10 border border-error/20 rounded-lg">
                <AlertTriangle size={16} className="text-error flex-shrink-0" />
                <p className="text-xs text-error font-bold">
                  This action will activate emergency protocols and notify all response teams.
                </p>
              </div>

              <button
                onClick={declareEmergency}
                className="w-full px-6 py-3 bg-error hover:bg-error/90 text-on-error border border-error/50 rounded-lg text-sm font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <AlertTriangle size={16} />
                Declare Emergency
              </button>
            </motion.div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

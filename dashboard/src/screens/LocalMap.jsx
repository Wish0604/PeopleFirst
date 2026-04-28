import React, { useState } from 'react';
import { MapPin, ZoomIn, ZoomOut, Layers, Navigation } from 'lucide-react';
import { motion } from 'motion/react';

export default function LocalMap() {
  const [zoom, setZoom] = useState(100);
  const [showLegend, setShowLegend] = useState(true);

  const locations = [
    { id: 1, name: 'Central Hub', type: 'shelter', x: 45, y: 50 },
    { id: 2, name: 'North Station', type: 'emergency', x: 60, y: 30 },
    { id: 3, name: 'South Medical', type: 'medical', x: 40, y: 70 },
    { id: 4, name: 'East Depot', type: 'supply', x: 75, y: 45 },
  ];

  const getMarkerColor = (type) => {
    switch (type) {
      case 'emergency':
        return 'bg-error';
      case 'medical':
        return 'bg-tertiary';
      case 'supply':
        return 'bg-primary';
      case 'shelter':
        return 'bg-primary-container';
      default:
        return 'bg-slate-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-full overflow-hidden"
    >
      {/* Map Container */}
      <div className="flex-1 relative bg-[#0B1220] overflow-hidden">
        {/* Map Background */}
        <div className="absolute inset-0 opacity-20 grayscale brightness-50">
          <img
            src="https://images.unsplash.com/photo-1569163139394-de4798aa62b5?auto=format&fit=crop&q=80&w=2000"
            className="w-full h-full object-cover"
            alt="Tactical map"
          />
        </div>

        {/* Map Grid Overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(100,150,255,0.05) 25%, rgba(100,150,255,0.05) 26%, transparent 27%, transparent 74%, rgba(100,150,255,0.05) 75%, rgba(100,150,255,0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(100,150,255,0.05) 25%, rgba(100,150,255,0.05) 26%, transparent 27%, transparent 74%, rgba(100,150,255,0.05) 75%, rgba(100,150,255,0.05) 76%, transparent 77%, transparent)',
          backgroundSize: '50px 50px'
        }} />

        {/* Markers */}
        <div className="absolute inset-0 z-20">
          {locations.map((location) => (
            <motion.div
              key={location.id}
              className="absolute group"
              style={{
                left: `${location.x}%`,
                top: `${location.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              whileHover={{ scale: 1.2 }}
            >
              {/* Pulse Ring */}
              <div className={`absolute inset-0 w-8 h-8 rounded-full ${getMarkerColor(location.type)} opacity-30 animate-pulse`} />
              
              {/* Marker */}
              <div className={`relative w-8 h-8 rounded-full ${getMarkerColor(location.type)} flex items-center justify-center cursor-pointer shadow-lg`}>
                <MapPin size={16} className="text-white" />
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-background border border-outline-variant rounded-lg px-3 py-2 text-[10px] font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                {location.name}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Map Controls */}
        <div className="absolute bottom-6 right-6 z-30 flex flex-col gap-2">
          <button
            onClick={() => setZoom(Math.min(zoom + 20, 200))}
            className="p-3 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded-lg transition-all active:scale-95"
            title="Zoom in"
          >
            <ZoomIn size={18} className="text-primary" />
          </button>
          <button
            onClick={() => setZoom(Math.max(zoom - 20, 50))}
            className="p-3 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded-lg transition-all active:scale-95"
            title="Zoom out"
          >
            <ZoomOut size={18} className="text-primary" />
          </button>
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="p-3 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded-lg transition-all active:scale-95"
            title="Toggle legend"
          >
            <Layers size={18} className="text-primary" />
          </button>
        </div>

        {/* Top Controls */}
        <div className="absolute top-6 left-6 z-30 flex gap-2">
          <div className="bg-surface-container/90 backdrop-blur border border-outline-variant rounded-lg p-3 flex items-center gap-2">
            <Navigation size={16} className="text-primary" />
            <span className="text-[10px] font-bold text-white uppercase">Zoom: {zoom}%</span>
          </div>
        </div>
      </div>

      {/* Legend Sidebar */}
      {showLegend && (
        <motion.div
          initial={{ x: 400 }}
          animate={{ x: 0 }}
          className="w-64 bg-surface-container border-l border-outline-variant p-4 flex flex-col"
        >
          <h3 className="text-sm font-bold text-white mb-4">Map Legend</h3>
          
          <div className="space-y-3 flex-1">
            {[
              { type: 'emergency', label: 'Emergency Station', color: 'bg-error' },
              { type: 'medical', label: 'Medical Facility', color: 'bg-tertiary' },
              { type: 'supply', label: 'Supply Depot', color: 'bg-primary' },
              { type: 'shelter', label: 'Shelter Point', color: 'bg-primary-container' },
            ].map((item) => (
              <div key={item.type} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${item.color}`} />
                <span className="text-xs text-slate-300">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-outline-variant">
            <p className="text-[10px] text-slate-500 font-bold uppercase">Location Count</p>
            <p className="text-2xl font-bold text-primary mt-2">{locations.length}</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

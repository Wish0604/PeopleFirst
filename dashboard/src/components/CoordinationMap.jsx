import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import { db } from '../firebase';

// Fix container style to display the map properly
const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '12px',
};

export default function CoordinationMap() {
  const [responses, setResponses] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'responses'), (snapshot) => {
      const mapped = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setResponses(mapped);
    });

    return unsubscribe;
  }, []);

  const locatedResponses = responses.filter(r => r.location);

  // Default center if no responses yet (e.g., coordinates for a central area)
  const defaultCenter = [20.5937, 78.9629]; // India center as placeholder
  
  // Calculate center and bounds if there are responses
  let mapCenter = defaultCenter;
  let zoomLevel = 4;
  
  if (locatedResponses.length > 0) {
    let sumLat = 0, sumLng = 0;
    locatedResponses.forEach(r => {
      sumLat += r.location.latitude ?? r.location._lat;
      sumLng += r.location.longitude ?? r.location._long;
    });
    mapCenter = [sumLat / locatedResponses.length, sumLng / locatedResponses.length];
    zoomLevel = 10; // Zoom in closer if we have points
  }

  return (
    <section className="panel coordination-map">
      <h2>Coordination Map</h2>
      <p className="muted">Live plotting of citizen locations and distress signals</p>
      
      <div className="map-container" style={{ border: 'none', background: 'transparent' }}>
        <MapContainer 
          center={mapCenter} 
          zoom={zoomLevel} 
          style={containerStyle}
          scrollWheelZoom={false}
        >
          <TileLayer
            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            attribution='&copy; Google Maps'
          />
          
          {locatedResponses.map((r) => {
            const lat = r.location.latitude ?? r.location._lat;
            const lng = r.location.longitude ?? r.location._long;
            const isEmergency = r.status === 'NEED_HELP';

            return (
              <CircleMarker
                key={r.id}
                center={[lat, lng]}
                radius={8}
                pathOptions={{
                  color: isEmergency ? '#ff5252' : '#80f0bc',
                  fillColor: isEmergency ? '#ff5252' : '#80f0bc',
                  fillOpacity: 0.8,
                  weight: 2
                }}
              >
                <Popup>
                  <div style={{ color: '#0b1020', fontWeight: 'bold' }}>
                    Status: {r.status}
                    <br />
                    User: {r.userId || r.id}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
      
      <div className="map-legend" style={{ marginTop: '16px' }}>
        <div className="legend-item"><span className="dot-green"></span> SAFE</div>
        <div className="legend-item"><span className="pulse-red"></span> NEED HELP</div>
      </div>
    </section>
  );
}

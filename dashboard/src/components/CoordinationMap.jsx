import React, { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import { useCollectionSnapshot } from '../hooks/useCollectionSnapshot';
import { useSheltersSnapshot } from '../hooks/useSheltersSnapshot';
import { readPoint } from '../utils/shelters';

// Fix container style to display the map properly
const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '12px',
};

const defaultCenter = [20.5937, 78.9629];

function getZoneCoordinates(zone) {
  if (Array.isArray(zone.polygon) && zone.polygon.length > 0) {
    return zone.polygon
      .map((point) => [point.lat ?? point.latitude ?? point._lat, point.lng ?? point.longitude ?? point._long])
      .filter(([lat, lng]) => typeof lat === 'number' && typeof lng === 'number');
  }

  if (zone.geojson?.type === 'Polygon' && Array.isArray(zone.geojson.coordinates?.[0])) {
    return zone.geojson.coordinates[0]
      .map(([lng, lat]) => [lat, lng])
      .filter(([lat, lng]) => typeof lat === 'number' && typeof lng === 'number');
  }

  return [];
}

function averageCenter(points) {
  if (!points.length) return null;

  const totals = points.reduce(
    (acc, [lat, lng]) => {
      acc.lat += lat;
      acc.lng += lng;
      return acc;
    },
    { lat: 0, lng: 0 }
  );

  return [totals.lat / points.length, totals.lng / points.length];
}

function uniqueById(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export default function CoordinationMap() {
  const shelters = useSheltersSnapshot();
  const zones = useCollectionSnapshot('zones');

  const locatedShelters = useMemo(
    () => shelters.filter((shelter) => readPoint(shelter.location ?? shelter.coords ?? shelter.position ?? shelter)),
    [shelters]
  );

  const mapCenter = useMemo(() => {
    const points = [
      ...locatedShelters.map((shelter) => readPoint(shelter.location ?? shelter.coords ?? shelter.position ?? shelter)).filter(Boolean),
    ];

    return averageCenter(points) || defaultCenter;
  }, [locatedShelters]);

  const zoomLevel = locatedShelters.length > 0 ? 12 : 5;

  const visibleZones = useMemo(() => {
    return zones
      .map((zone) => {
        const coordinates = getZoneCoordinates(zone);
        const point = readPoint(zone.location ?? zone.center ?? zone.position ?? zone);
        const severity = String(zone.riskLevel || zone.risk_level || '').toUpperCase();
        const isDanger = severity === 'CRITICAL' || severity === 'HIGH' || zone.floodRisk || zone.cycloneWarning || zone.evacuationRequired;

        return {
          ...zone,
          coordinates,
          point,
          isDanger,
          severity,
        };
      })
      .filter((zone) => zone.isDanger && (zone.coordinates.length > 0 || zone.point));
  }, [zones]);

  // No volunteer or task controls in shelter-only map
  return (
    <section className="panel coordination-map">
      <h2>Coordination Map</h2>
      <p className="muted">Showing Pune shelters (data-driven)</p>
      <div className="map-legend" style={{ marginTop: '12px', marginBottom: '16px' }}>
        <div className="legend-item"><span className="dot-blue"></span> Shelters ({locatedShelters.length})</div>
        <div className="legend-item"><span className="dot-orange"></span> Danger zones ({visibleZones.length})</div>
      </div>
      
      <div className="map-container" style={{ border: 'none', background: 'transparent' }}>
        <MapContainer 
          center={mapCenter} 
          zoom={zoomLevel} 
          style={containerStyle}
          scrollWheelZoom={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />

          {/* Shelters */}

          {/* Danger zones */}
          {visibleZones.map((zone) => {
            if (zone.coordinates.length > 0) {
              const danger = zone.severity === 'CRITICAL';
              return (
                <Polygon
                  key={`zone-poly-${zone.id}`}
                  positions={zone.coordinates}
                  pathOptions={{
                    color: danger ? '#ef4444' : '#f59e0b',
                    fillColor: danger ? '#ef4444' : '#f59e0b',
                    fillOpacity: 0.18,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div style={{ color: '#0b1020' }}>
                      <div style={{ fontWeight: '700' }}>{zone.zoneName || zone.name || 'Danger zone'}</div>
                      <div style={{ fontSize: 12, marginTop: 6 }}>Risk: {zone.severity || 'UNKNOWN'}</div>
                    </div>
                  </Popup>
                </Polygon>
              );
            }

            if (zone.point) {
              const [lat, lng] = zone.point;
              return (
                <CircleMarker
                  key={`zone-point-${zone.id}`}
                  center={[lat, lng]}
                  radius={18}
                  pathOptions={{
                    color: '#ef4444',
                    fillColor: '#ef4444',
                    fillOpacity: 0.22,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div style={{ color: '#0b1020' }}>
                      <div style={{ fontWeight: '700' }}>{zone.zoneName || zone.name || 'Danger zone'}</div>
                      <div style={{ fontSize: 12, marginTop: 6 }}>Risk: {zone.severity || 'UNKNOWN'}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            }

            return null;
          })}

          {/* Shelters */}
          {locatedShelters.map((shelter) => {
            const point = readPoint(shelter.location ?? shelter.coords ?? shelter.position ?? shelter);
            if (!point) return null;
            const [lat, lng] = point;
            const capacity = Number(shelter.capacity ?? shelter.totalCapacity ?? shelter.capacity_total ?? 0);
            const occupied = Number(shelter.occupied ?? shelter.currentOccupancy ?? shelter.usage ?? 0);
            const occupancy = capacity > 0 ? Math.min(100, Math.round((occupied / capacity) * 100)) : 0;

            return (
              <CircleMarker
                key={`shelter-${shelter.id}`}
                center={[lat, lng]}
                radius={11}
                pathOptions={{ color: '#60a5fa', fillColor: '#60a5fa', fillOpacity: 0.7 }}
              >
                <Popup>
                  <div style={{ color: '#0b1020' }}>
                    <div style={{ fontWeight: '700' }}>{shelter.name || 'Shelter'}</div>
                    <div style={{ fontSize: 12, marginTop: 6 }}>Capacity: {occupied}/{capacity || 'N/A'}</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>Occupancy: {occupancy}%</div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

        </MapContainer>
      </div>

      <div className="map-legend" style={{ marginTop: '12px' }}>
        <div style={{ color: '#94a3b8', fontSize: '12px' }}>Showing Pune shelters and active danger zones.</div>
      </div>
    </section>
  );
}

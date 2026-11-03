import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchRiverLocations, fetchRainfallLocations } from '../utils/mapApi';

// Fix for default markers in react-leaflet
delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Karnataka center coordinates
const karnatakaCenter = [14.5204, 75.7224];

// Default fallback data if API fails
const defaultRiverStations = [
  {
    id: 1,
    river: 'Tungabhadra',
    location: 'Hospet',
    lat: 15.2695,
    lng: 76.3870,
    level: 18.5,
    alert_level: 18.0,
    danger_level: 19.0,
    status: 'Critical'
  },
  {
    id: 2,
    river: 'Krishna',
    location: 'Almatti',
    lat: 16.3306,
    lng: 75.8867,
    level: 5.5,
    alert_level: 4.5,
    danger_level: 5.0,
    status: 'Warning'
  },
  {
    id: 3,
    river: 'Cauvery',
    location: 'Krishnarajasagar',
    lat: 12.4209,
    lng: 76.5732,
    level: 3.2,
    alert_level: 4.5,
    danger_level: 5.0,
    status: 'Normal'
  },
];

const defaultRainfallAreas = [
  {
    id: 1,
    district: 'Bengaluru',
    center: [12.9716, 77.5946],
    radius: 50000,
    intensity: 'moderate',
    rainfall_24h: 35.2,
    rainfall_3h: 5.2
  },
  {
    id: 2,
    district: 'Kodagu',
    center: [12.3382, 75.2241],
    radius: 40000,
    intensity: 'high',
    rainfall_24h: 92.1,
    rainfall_3h: 15.3
  },
  {
    id: 3,
    district: 'Chikmagalur',
    center: [13.3172, 75.7139],
    radius: 35000,
    intensity: 'low',
    rainfall_24h: 25.8,
    rainfall_3h: 3.1
  }
];

const getRiskColor = (level, alertLevel, dangerLevel) => {
  // Single-hue sequential ramp: teal (safe) → amber (alert) → red (danger)
  if (level >= dangerLevel) return '#e5484d';  // risk-red
  if (level >= alertLevel)  return '#f59e0b';  // warn-amber
  return '#4cc38a';                             // ok-green
};

const getRainfallColor = (rainfall24h) => {
  // Single-hue blue sequential ramp
  if (rainfall24h >= 100) return '#2563eb'; // heavy — deep blue
  if (rainfall24h >= 50)  return '#60a5fa'; // moderate — mid blue
  return '#bfdbfe';                          // light — pale blue
};

export default function FloodRiskMap() {
  const [riverStations, setRiverStations] = useState(defaultRiverStations);
  const [rainfallAreas, setRainfallAreas] = useState(defaultRainfallAreas);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch live location data from API
    const fetchLiveData = async () => {
      try {
        // Fetch river stations
        const riverData = await fetchRiverLocations();
        if (riverData && riverData.length > 0) {
          setRiverStations(riverData);
        }

        // Fetch rainfall locations
        const rainfallData = await fetchRainfallLocations();
        if (rainfallData && rainfallData.length > 0) {
          const transformedRainfall = rainfallData.map(location => ({
            id: location.id,
            district: location.district,
            center: [location.lat, location.lng],
            radius: 40000,
            intensity: location.intensity,
            rainfall_24h: location.rainfall_24h,
            rainfall_3h: location.rainfall_3h
          }));
          setRainfallAreas(transformedRainfall);
        }
      } catch (error) {
        console.error('Error fetching live map data:', error);
        // Keep using default data on error
      } finally {
        setLoading(false);
      }
    };

    fetchLiveData();
    
    // Refresh data every 5 minutes
    const refreshInterval = setInterval(fetchLiveData, 5 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, []);

  return (
    <MapContainer
      center={karnatakaCenter}
      zoom={7}
      style={{ height: '100%', width: '100%' }}
      className="rounded-lg"
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />

      {/* Rainfall intensity circles — single-hue blue sequential ramp */}
      {rainfallAreas.map((area) => (
        <Circle
          key={`rainfall-${area.id}`}
          center={area.center}
          radius={area.radius}
          pathOptions={{
            color: getRainfallColor(area.rainfall_24h),
            fillColor: getRainfallColor(area.rainfall_24h),
            fillOpacity: 0.18,
            weight: 1,
          }}
        >
          <Popup>
            <div style={{ fontSize: 12, fontFamily: 'Geist, Inter, sans-serif', minWidth: 160 }}>
              <p style={{ fontWeight: 600, marginBottom: 6 }}>{area.district ?? 'Rainfall area'}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '2px 12px' }}>
                <span style={{ color: '#6b7280' }}>24 h rainfall</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600, textAlign: 'right' }}>{area.rainfall_24h?.toFixed(1) ?? '–'} mm</span>
                <span style={{ color: '#6b7280' }}>3 h rainfall</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600, textAlign: 'right' }}>{area.rainfall_3h?.toFixed(1) ?? '–'} mm</span>
                <span style={{ color: '#6b7280' }}>Intensity</span>
                <span style={{ textAlign: 'right', textTransform: 'capitalize' }}>{area.intensity ?? '–'}</span>
              </div>
            </div>
          </Popup>
        </Circle>
      ))}

      {/* River gauge station markers — small diamonds (rotated squares) */}
      {riverStations.map((station) => {
        const color = getRiskColor(station.level, station.alert_level, station.danger_level);
        const status = station.level >= station.danger_level ? 'critical' : station.level >= station.alert_level ? 'alert' : 'normal';
        return (
          <Marker
            key={station.id}
            position={[station.lat, station.lng]}
            icon={new Icon({
              // Small 10×10 diamond (rotated square) — unambiguous station symbol
              iconUrl: `data:image/svg+xml;base64,${btoa(
                `<svg width="12" height="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">` +
                `<rect x="1" y="1" width="10" height="10" rx="2" fill="${color}" fill-opacity="0.9" stroke="#0f0f10" stroke-width="1.5"/>` +
                `</svg>`
              )}`,
              iconSize:    [12, 12],
              iconAnchor:  [6, 6],
              popupAnchor: [0, -10],
            })}
          >
            <Popup>
              <div style={{ fontSize: 12, fontFamily: 'Geist, Inter, sans-serif', minWidth: 180 }}>
                <p style={{ fontWeight: 600, marginBottom: 4 }}>{station.river} · {station.location}</p>
                <p style={{ color: status === 'critical' ? '#e5484d' : status === 'alert' ? '#f59e0b' : '#4cc38a', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', fontSize: 11 }}>{status}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '2px 12px' }}>
                  <span style={{ color: '#6b7280' }}>Current</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, textAlign: 'right', color: color }}>{station.level?.toFixed(2) ?? '–'} m</span>
                  <span style={{ color: '#6b7280' }}>Alert</span>
                  <span style={{ fontFamily: 'monospace', textAlign: 'right' }}>{station.alert_level?.toFixed(1) ?? '–'} m</span>
                  <span style={{ color: '#6b7280' }}>Danger</span>
                  <span style={{ fontFamily: 'monospace', textAlign: 'right' }}>{station.danger_level?.toFixed(1) ?? '–'} m</span>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
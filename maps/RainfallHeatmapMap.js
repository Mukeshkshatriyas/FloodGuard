/**
 * RainfallHeatmapMap — district-level rainfall intensity overlay
 *
 * Dark basemap (CartoDB dark_matter).
 * Single-hue blue sequential ramp: pale blue → mid blue → deep blue.
 * Circle radius proportional to rainfall_3h (hourly proxy).
 * Legend: exact thresholds with teal/amber/risk colours consistent with the design system.
 */

import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';

const karnatakaCenter = [14.5, 75.6];

// Single-hue sequential blue ramp (light → heavy)
const getRainfallColor = (mmPerHour) => {
  if (mmPerHour >= 7.5) return '#2563eb';  // heavy — deep blue
  if (mmPerHour >= 2.5) return '#60a5fa';  // moderate — mid blue
  return '#bfdbfe';                          // light — pale blue
};

const LEGEND = [
  { label: '< 2.5 mm/h',  color: '#bfdbfe' },
  { label: '2.5–7.5 mm/h', color: '#60a5fa' },
  { label: '> 7.5 mm/h',  color: '#2563eb' },
];

export default function RainfallHeatmapMap({ locations = [] }) {
  const validLocations = locations.filter(l => Number.isFinite(l.lat) && Number.isFinite(l.lon));

  return (
    <div style={{ position: 'relative', height: 360, width: '100%', overflow: 'hidden', borderRadius: 8, border: '1px solid rgba(237,237,237,0.07)' }}>
      <MapContainer
        center={karnatakaCenter}
        zoom={7}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {validLocations.map(loc => {
          const mmh = loc.rainfall ?? loc.rainfall_3h ?? 0;
          const color = getRainfallColor(mmh);
          // Radius: base 8px + scale with intensity (capped at 28px)
          const radius = Math.min(28, 8 + mmh * 1.2);
          return (
            <CircleMarker
              key={loc.district ?? loc.id}
              center={[loc.lat, loc.lon]}
              radius={radius}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.55, weight: 1 }}
            >
              <Tooltip>
                <div style={{ fontSize: 12, fontFamily: 'Geist, Inter, sans-serif' }}>
                  <p style={{ fontWeight: 600, marginBottom: 4 }}>{loc.district}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '1px 10px' }}>
                    <span style={{ color: '#6b7280' }}>Hourly</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, textAlign: 'right' }}>{mmh.toFixed(1)} mm/h</span>
                    {(loc.rainfall_24h != null) && <>
                      <span style={{ color: '#6b7280' }}>24 h</span>
                      <span style={{ fontFamily: 'monospace', textAlign: 'right' }}>{loc.rainfall_24h.toFixed(0)} mm</span>
                    </>}
                    {(loc.temperature != null) && <>
                      <span style={{ color: '#6b7280' }}>Temp</span>
                      <span style={{ fontFamily: 'monospace', textAlign: 'right' }}>{loc.temperature} °C</span>
                    </>}
                  </div>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 12, left: 12, zIndex: 1000,
        display: 'flex', flexDirection: 'column', gap: 4,
        backgroundColor: 'rgba(15,15,16,0.88)', borderRadius: 6,
        padding: '8px 10px', border: '1px solid rgba(237,237,237,0.08)',
      }}>
        <p style={{ fontSize: 10, color: '#85858b', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>Rainfall</p>
        {LEGEND.map(l => (
          <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#a1a1a6', fontFamily: 'Geist Mono, monospace' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: l.color, display: 'inline-block', flexShrink: 0 }} />
            {l.label}
          </span>
        ))}
      </div>

      {validLocations.length === 0 && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(20,20,21,0.7)', zIndex: 999,
        }}>
          <p style={{ fontSize: 13, color: '#85858b' }}>No rainfall data available</p>
        </div>
      )}
    </div>
  );
}

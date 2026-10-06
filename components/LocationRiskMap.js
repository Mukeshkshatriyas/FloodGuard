import { useEffect } from 'react';
import { Circle, CircleMarker, MapContainer, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';

function RecenterMap({ location }) {
  const map = useMap();

  useEffect(() => {
    map.setView([location.latitude, location.longitude], map.getZoom());
  }, [location, map]);

  return null;
}

function SelectLocation({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect({
        latitude: Number(event.latlng.lat.toFixed(4)),
        longitude: Number(event.latlng.lng.toFixed(4)),
      });
    },
  });

  return null;
}

export default function LocationRiskMap({ location, onLocationChange, hazard, riskLevel, color }) {
  const riskColor = riskLevel === 'High' ? '#ef4444' : riskLevel === 'Medium' ? '#f59e0b' : color;

  return (
    <MapContainer
      center={[location.latitude, location.longitude]}
      zoom={8}
      scrollWheelZoom
      style={{ height: '100%', width: '100%' }}
      className="rounded-lg"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <RecenterMap location={location} />
      <SelectLocation onSelect={onLocationChange} />
      <Circle
        center={[location.latitude, location.longitude]}
        radius={2500}
        pathOptions={{ color: riskColor, fillColor: riskColor, fillOpacity: 0.18, weight: 1.5 }}
      />
      <CircleMarker
        center={[location.latitude, location.longitude]}
        radius={8}
        pathOptions={{ color: '#fff', fillColor: riskColor, fillOpacity: 1, weight: 2 }}
      >
        <Tooltip>{`${hazard} assessment location`}</Tooltip>
      </CircleMarker>
    </MapContainer>
  );
}
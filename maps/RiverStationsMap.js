import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchRiverLocations } from '../utils/mapApi';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const RiverStationsMap = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [stationsData, setStationsData] = useState([
    { lat: 12.3375, lng: 75.8069, station: 'Kushalnagar Bridge', river: 'Cauvery', level: 4.9, danger_level: 5.0, alert_level: 4.0, location: 'Kodagu' },
    { lat: 12.4211, lng: 76.6827, station: 'Srirangapatna', river: 'Cauvery', level: 4.1, danger_level: 5.0, alert_level: 4.0, location: 'Mandya' },
    { lat: 13.9299, lng: 75.5681, station: 'Shimoga Bridge', river: 'Tunga', level: 3.8, danger_level: 4.5, alert_level: 3.8, location: 'Shimoga' },
  ]);

  useEffect(() => {
    // Fetch live river stations data
    const fetchLiveStations = async () => {
      try {
        const data = await fetchRiverLocations();
        if (data && data.length > 0) {
          setStationsData(data);
        }
      } catch (error) {
        console.error('Error fetching river stations:', error);
      }
    };

    fetchLiveStations();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchLiveStations, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!mapRef.current || !stationsData.length) return;

    // Initialize map centered on Karnataka
    const map = L.map(mapRef.current).setView([14.5, 75.5], 7);

    // Add CartoDB Voyager tiles (grey basemap)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    // Function to get marker status and color based on level
    const getMarkerStatus = (level, alertLevel, dangerLevel) => {
      if (level >= dangerLevel) return { status: 'danger', color: '#dc2626' };
      if (level >= alertLevel) return { status: 'warning', color: '#ea580c' };
      return { status: 'safe', color: '#16a34a' };
    };

    // Function to create custom marker icon
    const createCustomIcon = (color) => {
      return L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
    };

    // Add markers for each station
    stationsData.forEach((station) => {
      const { status, color } = getMarkerStatus(station.level, station.alert_level, station.danger_level);

      L.marker([station.lat, station.lng], {
        icon: createCustomIcon(color)
      })
        .bindPopup(`
          <div class="text-sm">
            <strong>${station.station || station.name || 'River Station'}</strong><br/>
            <strong>River:</strong> ${station.river}<br/>
            <strong>Current Level:</strong> ${station.level?.toFixed(1) || 'N/A'} meters<br/>
            <strong>Alert Level:</strong> ${station.alert_level?.toFixed(1) || 'N/A'} meters<br/>
            <strong>Danger Level:</strong> ${station.danger_level?.toFixed(1) || 'N/A'} meters<br/>
            <strong>Status:</strong> <span style="color: ${color}; font-weight: bold;">${status.toUpperCase()}</span><br/>
            <strong>Location:</strong> ${station.location}
          </div>
        `)
        .addTo(map);
    });

    // Add legend
    const legend = L.control({ position: 'bottomright' });

    legend.onAdd = function (map) {
      const div = L.DomUtil.create('div', 'info legend');
      div.style.backgroundColor = 'rgba(30, 41, 59, 0.9)';
      div.style.padding = '10px';
      div.style.borderRadius = '8px';
      div.style.color = '#f1f5f9';
      div.style.fontSize = '12px';

      div.innerHTML = `
        <strong>Station Status</strong><br/>
        <div style="display: flex; align-items: center; margin: 4px 0;">
          <div style="background-color: #16a34a; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; margin-right: 8px;"></div>
          Safe
        </div>
        <div style="display: flex; align-items: center; margin: 4px 0;">
          <div style="background-color: #ea580c; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; margin-right: 8px;"></div>
          Warning
        </div>
        <div style="display: flex; align-items: center; margin: 4px 0;">
          <div style="background-color: #dc2626; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; margin-right: 8px;"></div>
          Danger
        </div>
      `;

      return div;
    };

    legend.addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, [stationsData]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full rounded-lg"
      style={{ minHeight: '320px' }}
    />
  );
};

export default RiverStationsMap;


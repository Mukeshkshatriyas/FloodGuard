import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const RainfallHeatmap = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map centered on Karnataka
    const map = L.map(mapRef.current).setView([14.5, 75.5], 7);

    // Add CartoDB Voyager tiles (grey basemap)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    // Sample rainfall data for Karnataka districts
    const rainfallData = [
      { lat: 12.3375, lng: 75.8069, district: 'Kodagu', rainfall: 92.1, risk: 'high' },
      { lat: 13.3161, lng: 75.7720, district: 'Chikmagalur', rainfall: 85.2, risk: 'high' },
      { lat: 13.0068, lng: 76.1004, district: 'Hassan', rainfall: 67.8, risk: 'medium' },
      { lat: 14.6144, lng: 74.6819, district: 'Uttara Kannada', rainfall: 58.9, risk: 'medium' },
      { lat: 12.8438, lng: 75.2479, district: 'Dakshina Kannada', rainfall: 45.3, risk: 'medium' },
      { lat: 13.9299, lng: 75.5681, district: 'Shimoga', rainfall: 38.7, risk: 'low' },
      { lat: 15.8497, lng: 74.4977, district: 'Belgaum', rainfall: 32.1, risk: 'low' },
      { lat: 17.9104, lng: 77.5192, district: 'Bidar', rainfall: 28.9, risk: 'low' },
      { lat: 17.3297, lng: 76.8343, district: 'Gulbarga', rainfall: 25.4, risk: 'low' },
      { lat: 16.2076, lng: 77.3463, district: 'Raichur', rainfall: 22.8, risk: 'low' },
    ];

    // Function to get color based on rainfall intensity
    const getColor = (rainfall) => {
      if (rainfall >= 80) return '#dc2626'; // red-600
      if (rainfall >= 60) return '#ea580c'; // orange-600
      if (rainfall >= 40) return '#ca8a04'; // yellow-600
      if (rainfall >= 20) return '#16a34a'; // green-600
      return '#22c55e'; // green-500
    };

    // Add rainfall intensity circles
    rainfallData.forEach((data) => {
      const radius = Math.sqrt(data.rainfall) * 1000; // Scale radius based on rainfall

      L.circle([data.lat, data.lng], {
        color: getColor(data.rainfall),
        fillColor: getColor(data.rainfall),
        fillOpacity: 0.6,
        radius: radius,
        weight: 2,
      })
        .bindPopup(`
          <div class="text-sm">
            <strong>${data.district}</strong><br/>
            Rainfall: ${data.rainfall.toFixed(1)} mm (24h)<br/>
            Risk Level: <span class="font-semibold ${
              data.risk === 'high' ? 'text-red-500' :
              data.risk === 'medium' ? 'text-orange-500' : 'text-green-500'
            }">${data.risk.toUpperCase()}</span>
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

      const grades = [0, 20, 40, 60, 80];
      const labels = [];

      labels.push('<strong>Rainfall (mm)</strong><br/>');

      for (let i = 0; i < grades.length; i++) {
        const from = grades[i];
        const to = grades[i + 1];

        labels.push(
          '<i style="background:' + getColor(from + 1) + '; width: 18px; height: 18px; float: left; margin-right: 8px; opacity: 0.7; border-radius: 50%;"></i> ' +
          from + (to ? '&ndash;' + to : '+')
        );
      }

      div.innerHTML = labels.join('<br/>');
      return div;
    };

    legend.addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  return (
    <div
      ref={mapRef}
      className="w-full h-full rounded-lg"
      style={{ minHeight: '320px' }}
    />
  );
};

export default RainfallHeatmap;
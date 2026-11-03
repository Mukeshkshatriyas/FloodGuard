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

const EvacuationRoutesMap = () => {
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

    // Sample evacuation routes and shelters data
    const routesData = [
      // Route A - Madikeri Highway (Green - Safe)
      {
        name: 'Route A - Madikeri Highway',
        color: '#16a34a',
        path: [
          [12.3375, 75.8069], // Start
          [12.35, 75.82],
          [12.38, 75.85],
          [12.42, 75.89], // End
        ]
      },
      // Route B - Forest Road (Green - Safe)
      {
        name: 'Route B - Forest Road',
        color: '#16a34a',
        path: [
          [12.3375, 75.8069], // Start
          [12.32, 75.78],
          [12.28, 75.74],
          [12.25, 75.70], // End
        ]
      },
      // Route C - River Bridge (Orange - Caution)
      {
        name: 'Route C - River Bridge',
        color: '#ea580c',
        path: [
          [12.3375, 75.8069], // Start
          [12.36, 75.79],
          [12.39, 75.76],
          [12.43, 75.72], // End
        ]
      },
      // Route D - Hill Path (Red - Blocked)
      {
        name: 'Route D - Hill Path',
        color: '#dc2626',
        path: [
          [12.3375, 75.8069], // Start
          [12.31, 75.83],
          [12.27, 75.87], // Blocked point
        ]
      }
    ];

    // Sample emergency shelters
    const sheltersData = [
      { lat: 12.4211, lng: 76.6827, name: 'Government School - Madikeri', capacity: 500 },
      { lat: 12.52, lng: 75.89, name: 'Community Hall - Kushalnagar', capacity: 300 },
      { lat: 12.25, lng: 75.70, name: 'Temple Complex - Somwarpet', capacity: 400 },
      { lat: 13.3161, lng: 75.7720, name: 'Sports Stadium - Chikmagalur', capacity: 800 },
      { lat: 13.0068, lng: 76.1004, name: 'College Auditorium - Hassan', capacity: 600 }
    ];

    // Add evacuation routes
    routesData.forEach((route) => {
      L.polyline(route.path, {
        color: route.color,
        weight: 4,
        opacity: 0.8,
        dashArray: route.color === '#dc2626' ? '10, 10' : null, // Dashed for blocked routes
      })
        .bindPopup(`<strong>${route.name}</strong><br/>Status: ${
          route.color === '#16a34a' ? 'Safe' :
          route.color === '#ea580c' ? 'Caution' : 'Blocked'
        }`)
        .addTo(map);
    });

    // Add emergency shelters
    sheltersData.forEach((shelter) => {
      L.marker([shelter.lat, shelter.lng], {
        icon: L.divIcon({
          className: 'shelter-marker',
          html: `<div style="background-color: #16a34a; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold;">S</div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        })
      })
        .bindPopup(`
          <div class="text-sm">
            <strong>${shelter.name}</strong><br/>
            Capacity: ${shelter.capacity} people<br/>
            Status: Ready for evacuation
          </div>
        `)
        .addTo(map);
    });

    // Add evacuation zone polygons (simplified)
    const evacuationZone = [
      [12.2, 75.6],
      [12.4, 75.6],
      [12.4, 75.9],
      [12.2, 75.9],
      [12.2, 75.6]
    ];

    L.polygon(evacuationZone, {
      color: '#dc2626',
      fillColor: '#dc2626',
      fillOpacity: 0.1,
      weight: 2,
      dashArray: '5, 5'
    })
      .bindPopup('<strong>High Risk Evacuation Zone</strong><br/>Immediate evacuation recommended')
      .addTo(map);

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
        <strong>Evacuation Routes</strong><br/>
        <div style="display: flex; align-items: center; margin: 4px 0;">
          <div style="background-color: #16a34a; width: 20px; height: 3px; margin-right: 8px;"></div>
          Safe Route
        </div>
        <div style="display: flex; align-items: center; margin: 4px 0;">
          <div style="background-color: #ea580c; width: 20px; height: 3px; margin-right: 8px;"></div>
          Caution Route
        </div>
        <div style="display: flex; align-items: center; margin: 4px 0;">
          <div style="background-color: #dc2626; width: 20px; height: 3px; margin-right: 8px; border-top: 1px dashed;"></div>
          Blocked Route
        </div>
        <br/>
        <strong>Shelters</strong><br/>
        <div style="display: flex; align-items: center; margin: 4px 0;">
          <div style="background-color: #16a34a; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; margin-right: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 8px; font-weight: bold;">S</div>
          Emergency Shelter
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
  }, []);

  return (
    <div
      ref={mapRef}
      className="w-full h-full rounded-lg"
      style={{ minHeight: '320px' }}
    />
  );
};

export default EvacuationRoutesMap;
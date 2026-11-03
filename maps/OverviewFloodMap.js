import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";

const karnatakaCenter = [14.5, 75.6];

const riverStations = [
  { name: "Tungabhadra - Hosapete", coords: [15.2686, 76.3909], status: "high" },
  { name: "Kaveri - Srirangapatna", coords: [12.4223, 76.6938], status: "medium" },
  { name: "Krishna - Almatti", coords: [16.19, 75.89], status: "low" }
];

const rainfallCells = [
  { coords: [12.45, 75.78], intensity: "heavy", label: "Kodagu" },
  { coords: [13.34, 75.80], intensity: "moderate", label: "Chikkamagaluru" },
  { coords: [15.36, 75.12], intensity: "light", label: "Dharwad" }
];

const riskZones = [
  { coords: [12.97, 77.59], level: "urban", label: "Bengaluru Urban Flood Zone" },
  { coords: [15.14, 76.92], level: "riverine", label: "Tungabhadra Riverine Floodplain" }
];

const statusColor = {
  low: "#22c55e",
  medium: "#eab308",
  high: "#f97316",
  critical: "#ef4444"
};

const intensityColor = {
  light: "#22c55e",
  moderate: "#ca8a04",
  heavy: "#ef4444"
};

export default function OverviewFloodMap() {
  return (
    <div className="h-[340px] w-full overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/60">
      <MapContainer
        center={karnatakaCenter}
        zoom={7}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {rainfallCells.map((cell) => (
          <CircleMarker
            key={cell.label}
            center={cell.coords}
            radius={18}
            pathOptions={{
              color: intensityColor[cell.intensity],
              fillColor: intensityColor[cell.intensity],
              fillOpacity: 0.28
            }}
          >
            <Tooltip>
              <div className="space-y-1">
                <div className="font-semibold text-sm">{cell.label}</div>
                <div className="text-xs">
                  Rainfall:{" "}
                  <span className="font-medium capitalize">
                    {cell.intensity} intensity
                  </span>
                </div>
              </div>
            </Tooltip>
          </CircleMarker>
        ))}

        {riskZones.map((zone) => (
          <CircleMarker
            key={zone.label}
            center={zone.coords}
            radius={22}
            pathOptions={{
              color: "#22d3ee",
              fillColor: "#0ea5e9",
              fillOpacity: 0.18,
              dashArray: "4 4"
            }}
          >
            <Tooltip>
              <div className="space-y-1">
                <div className="font-semibold text-sm">{zone.label}</div>
                <div className="text-xs text-sky-200">
                  Modelled flood risk corridor ({zone.level})
                </div>
              </div>
            </Tooltip>
          </CircleMarker>
        ))}

        {riverStations.map((station) => (
          <CircleMarker
            key={station.name}
            center={station.coords}
            radius={8}
            pathOptions={{
              color: statusColor[station.status],
              fillColor: statusColor[station.status],
              fillOpacity: 0.9
            }}
          >
            <Tooltip>
              <div className="space-y-1">
                <div className="font-semibold text-sm">{station.name}</div>
                <div className="text-xs">
                  Status:{" "}
                  <span className="font-medium capitalize">
                    {station.status} risk
                  </span>
                </div>
              </div>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}


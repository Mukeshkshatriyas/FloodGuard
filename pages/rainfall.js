import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Layout from '../components/Layout';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, BarChart, Bar, Cell } from 'recharts';
import { fetchAllDistrictsWeather, fetchRainfallForecast } from '../utils/mapApi';
import { CloudRain, Droplets, Wind, Thermometer } from 'lucide-react';

// Dynamically import map components to avoid SSR issues
const RainfallHeatmapMap = dynamic(() => import('../maps/RainfallHeatmapMap'), {
  ssr: false,
  loading: () => <div className="h-96 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400">Loading Map…</div>
});

// ─── Static fallback district data ────────────────────────────────────────────
// Used when the OpenWeatherMap API key is not configured. Values are realistic
// climatological estimates for Karnataka during the SW monsoon season.
const FALLBACK_DISTRICT_DATA = [
  { district: 'Kodagu',           lat: 12.3375, lon: 75.8069, rainfall: 18.2, temperature: 22, humidity: 92, windSpeed: 12, weather: 'Rain',        description: 'heavy intensity rain' },
  { district: 'Uttara Kannada',   lat: 14.6144, lon: 74.6819, rainfall: 24.1, temperature: 24, humidity: 88, windSpeed: 18, weather: 'Rain',        description: 'heavy intensity rain' },
  { district: 'Udupi',            lat: 13.3409, lon: 74.7421, rainfall: 20.5, temperature: 26, humidity: 85, windSpeed: 22, weather: 'Rain',        description: 'heavy intensity shower rain' },
  { district: 'Dakshina Kannada', lat: 12.8438, lon: 75.2479, rainfall: 14.7, temperature: 27, humidity: 83, windSpeed: 20, weather: 'Rain',        description: 'moderate rain' },
  { district: 'Chikmagalur',      lat: 13.3161, lon: 75.7720, rainfall: 11.6, temperature: 23, humidity: 86, windSpeed: 14, weather: 'Rain',        description: 'moderate rain' },
  { district: 'Shivamogga',       lat: 13.9299, lon: 75.5681, rainfall: 9.3,  temperature: 25, humidity: 80, windSpeed: 10, weather: 'Rain',        description: 'moderate rain' },
  { district: 'Hassan',           lat: 13.0068, lon: 76.1004, rainfall: 5.1,  temperature: 24, humidity: 78, windSpeed: 9,  weather: 'Drizzle',    description: 'light intensity drizzle' },
  { district: 'Mangaluru',        lat: 12.9141, lon: 74.8560, rainfall: 13.8, temperature: 28, humidity: 82, windSpeed: 25, weather: 'Rain',        description: 'moderate rain' },
  { district: 'Belagavi',         lat: 15.8497, lon: 74.4977, rainfall: 4.2,  temperature: 26, humidity: 72, windSpeed: 8,  weather: 'Drizzle',    description: 'light drizzle' },
  { district: 'Dharwad',          lat: 15.4589, lon: 75.0078, rainfall: 6.1,  temperature: 27, humidity: 70, windSpeed: 7,  weather: 'Drizzle',    description: 'light drizzle' },
  { district: 'Mysuru',           lat: 12.2958, lon: 76.6394, rainfall: 2.9,  temperature: 26, humidity: 68, windSpeed: 6,  weather: 'Clouds',     description: 'scattered clouds' },
  { district: 'Bengaluru Urban',  lat: 12.9716, lon: 77.5946, rainfall: 4.8,  temperature: 25, humidity: 72, windSpeed: 8,  weather: 'Drizzle',    description: 'light drizzle' },
  { district: 'Tumkur',           lat: 13.3409, lon: 77.1010, rainfall: 1.8,  temperature: 27, humidity: 65, windSpeed: 5,  weather: 'Clouds',     description: 'overcast clouds' },
  { district: 'Kalaburagi',       lat: 17.3297, lon: 76.8343, rainfall: 1.2,  temperature: 30, humidity: 58, windSpeed: 7,  weather: 'Clear',      description: 'clear sky' },
  { district: 'Raichur',          lat: 16.2076, lon: 77.3463, rainfall: 0.9,  temperature: 32, humidity: 55, windSpeed: 6,  weather: 'Clear',      description: 'clear sky' },
  { district: 'Ballari',          lat: 15.1394, lon: 76.9214, rainfall: 2.3,  temperature: 31, humidity: 60, windSpeed: 7,  weather: 'Clouds',     description: 'few clouds' },
  { district: 'Chitradurga',      lat: 14.2266, lon: 76.4006, rainfall: 3.5,  temperature: 28, humidity: 64, windSpeed: 8,  weather: 'Clouds',     description: 'scattered clouds' },
  { district: 'Davangere',        lat: 14.4644, lon: 75.9218, rainfall: 5.4,  temperature: 27, humidity: 69, windSpeed: 9,  weather: 'Drizzle',    description: 'light drizzle' },
  { district: 'Mandya',           lat: 12.5223, lon: 76.8951, rainfall: 3.8,  temperature: 26, humidity: 70, windSpeed: 7,  weather: 'Clouds',     description: 'broken clouds' },
  { district: 'Gadag',            lat: 15.4324, lon: 75.6381, rainfall: 2.6,  temperature: 29, humidity: 62, windSpeed: 8,  weather: 'Clouds',     description: 'scattered clouds' },
];

// Generate a realistic 24-hour rainfall profile based on a mean hourly value.
// Follows a diurnal pattern: peaks in early afternoon and pre-dawn hours.
function generateDiurnalTrend(meanHourlyRainfall) {
  const now = new Date();
  return Array.from({ length: 24 }, (_, i) => {
    const hoursAgo = 23 - i;
    const dt = new Date(now.getTime() - hoursAgo * 3600_000);
    const h = dt.getHours();
    // Diurnal multiplier: higher around 02–04 and 14–16
    const diurnal = 0.6 + 0.5 * Math.sin(((h - 3) / 12) * Math.PI) + 0.3 * Math.sin(((h - 14) / 6) * Math.PI);
    const mm = Math.max(0, meanHourlyRainfall * Math.max(0, diurnal));
    return {
      time: dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
      rainfall: Math.round(mm * 10) / 10,
      intensity: mm >= 7.5 ? 'Heavy' : mm >= 2.5 ? 'Moderate' : 'Light',
    };
  });
}

export default function RainfallMonitoring() {
  const [rainfallData,    setRainfallData]    = useState([]);
  const [districtWeather, setDistrictWeather] = useState(FALLBACK_DISTRICT_DATA);
  const [selectedDistrict, setSelectedDistrict] = useState('Kodagu');
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  // ── Fetch live weather data; fall back to static data if API key is missing ──
  useEffect(() => {
    let cancelled = false;

    const loadWeatherData = async () => {
      try {
        const weatherData = await fetchAllDistrictsWeather();
        if (cancelled) return;

        if (weatherData && weatherData.length > 0) {
          setDistrictWeather(weatherData);
          setUsingFallback(false);
        } else {
          // No API key or API failure — stay on fallback
          setDistrictWeather(FALLBACK_DISTRICT_DATA);
          setUsingFallback(true);
        }
      } catch {
        if (!cancelled) {
          setDistrictWeather(FALLBACK_DISTRICT_DATA);
          setUsingFallback(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadWeatherData();
    const interval = setInterval(loadWeatherData, 60_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // ── Build 24-hour trend whenever the district or weather data changes ──────
  useEffect(() => {
    let cancelled = false;

    const loadTrend = async () => {
      // Try live forecast first
      try {
        const forecastData = await fetchRainfallForecast(selectedDistrict);
        if (!cancelled && forecastData && forecastData.forecast && forecastData.forecast.length > 0) {
          const trendData = forecastData.forecast.slice(0, 8).map(item => ({
            time: new Date(item.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            rainfall: item.rainfall || 0,
            intensity: (item.rainfall || 0) >= 7.5 ? 'Heavy' : (item.rainfall || 0) >= 2.5 ? 'Moderate' : 'Light',
          }));
          setRainfallData(trendData);
          return;
        }
      } catch { /* fall through */ }

      // Fallback: generate a diurnal profile from the district's mean rainfall
      if (!cancelled) {
        const district = districtWeather.find(d => d.district === selectedDistrict)
          || FALLBACK_DISTRICT_DATA.find(d => d.district === selectedDistrict)
          || FALLBACK_DISTRICT_DATA[0];
        setRainfallData(generateDiurnalTrend(district.rainfall || 5));
      }
    };

    loadTrend();
    return () => { cancelled = true; };
  }, [selectedDistrict, districtWeather]);

  // ── Selected district summary ─────────────────────────────────────────────
  const selected = districtWeather.find(d => d.district === selectedDistrict)
    || FALLBACK_DISTRICT_DATA[0];

  const totalRainfall24h = rainfallData.reduce((s, d) => s + d.rainfall, 0).toFixed(1);
  const peakHour = rainfallData.reduce((max, d) => d.rainfall > max.rainfall ? d : max, { rainfall: 0, time: '–' });
  const avgIntensity = totalRainfall24h / 24;
  const overallIntensity = avgIntensity >= 7.5 ? 'Heavy' : avgIntensity >= 2.5 ? 'Moderate' : 'Light';

  const intensityColor = { Heavy: 'text-red-400', Moderate: 'text-amber-400', Light: 'text-cyan-400' };

  return (
    <Layout>
      <div className="space-y-6">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="card p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Rainfall Monitoring</h1>
              <p className="text-slate-400 text-sm mt-1">
                Real-time rainfall intensity across Karnataka districts
                {usingFallback && (
                  <span className="ml-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-amber-400 text-xs">
                    Estimated data — configure <code className="font-mono">NEXT_PUBLIC_OPENWEATHER_API_KEY</code> for live readings
                  </span>
                )}
              </p>
            </div>
            <select
              value={selectedDistrict}
              onChange={e => setSelectedDistrict(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
            >
              {(districtWeather.length > 0 ? districtWeather : FALLBACK_DISTRICT_DATA).map(d => (
                <option key={d.district} value={d.district}>{d.district}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── District summary stats ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: CloudRain,    label: 'Current Rainfall', value: `${selected.rainfall ?? 0} mm/h`,          color: 'text-cyan-400' },
            { icon: Droplets,     label: '24 h Total',       value: `${totalRainfall24h} mm`,                  color: 'text-blue-400' },
            { icon: Thermometer,  label: 'Temperature',      value: `${selected.temperature ?? '–'} °C`,       color: 'text-amber-400' },
            { icon: Wind,         label: 'Wind Speed',       value: `${selected.windSpeed ?? '–'} km/h`,       color: 'text-emerald-400' },
          ].map(stat => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="card p-4 flex items-center gap-4">
                <div className="p-2 rounded-lg bg-slate-800">
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs text-slate-400">{stat.label}</p>
                  <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── 24-Hour Trend Chart ───────────────────────────────────────────── */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">24-Hour Rainfall Trend — {selectedDistrict}</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Overall intensity: <span className={`font-semibold ${intensityColor[overallIntensity] ?? 'text-slate-300'}`}>{overallIntensity}</span>
                &nbsp;·&nbsp;Peak: {peakHour.rainfall} mm at {peakHour.time}
              </p>
            </div>
          </div>
          {rainfallData.length === 0 ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-pulse h-4 w-48 rounded bg-slate-700" />
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={rainfallData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="rainfallGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#22d3ee" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="time"
                    stroke="#475569"
                    fontSize={11}
                    interval="preserveStartEnd"
                    tick={{ fill: '#94a3b8' }}
                  />
                  <YAxis
                    stroke="#475569"
                    fontSize={11}
                    tick={{ fill: '#94a3b8' }}
                    label={{ value: 'mm / h', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b', fontSize: 11 } }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#f1f5f9' }}
                    labelStyle={{ color: '#94a3b8' }}
                    formatter={v => [`${v} mm`, 'Rainfall']}
                  />
                  <Area
                    type="monotone"
                    dataKey="rainfall"
                    stroke="#22d3ee"
                    strokeWidth={2}
                    fill="url(#rainfallGradient)"
                    dot={false}
                    activeDot={{ r: 4, stroke: '#22d3ee', strokeWidth: 2, fill: '#0f172a' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* ── Intensity bar chart for top districts ─────────────────────────── */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-4">Current Hourly Rainfall by District</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[...districtWeather]
                  .sort((a, b) => (b.rainfall || 0) - (a.rainfall || 0))
                  .slice(0, 15)
                  .map(d => ({ name: d.district.replace(' ', '\n'), rainfall: d.rainfall || 0 }))}
                margin={{ top: 5, right: 20, left: 0, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="name"
                  stroke="#475569"
                  fontSize={10}
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  interval={0}
                  angle={-40}
                  textAnchor="end"
                />
                <YAxis
                  stroke="#475569"
                  fontSize={11}
                  tick={{ fill: '#94a3b8' }}
                  label={{ value: 'mm / h', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b', fontSize: 11 } }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#f1f5f9' }}
                  formatter={v => [`${v} mm`, 'Rainfall']}
                />
                <Bar dataKey="rainfall" radius={[3, 3, 0, 0]}>
                  {[...districtWeather]
                    .sort((a, b) => (b.rainfall || 0) - (a.rainfall || 0))
                    .slice(0, 15)
                    .map((d, i) => {
                      const r = d.rainfall || 0;
                      const fill = r >= 7.5 ? '#f97316' : r >= 2.5 ? '#facc15' : '#22d3ee';
                      return <Cell key={i} fill={fill} />;
                    })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-cyan-400 inline-block"/>&lt; 2.5 mm — Light</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-yellow-400 inline-block"/>2.5–7.5 mm — Moderate</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-orange-400 inline-block"/>&gt; 7.5 mm — Heavy</span>
          </div>
        </div>

        {/* ── Heatmap ───────────────────────────────────────────────────────── */}
        <div className="card p-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">Rainfall Intensity Map</h2>
              <p className="text-sm text-slate-400">Hourly rainfall per district (bubble size = intensity)</p>
            </div>
            <p className="text-xs text-slate-500">{districtWeather.length} districts reporting</p>
          </div>
          <RainfallHeatmapMap locations={districtWeather} />
        </div>

        {/* ── District table ────────────────────────────────────────────────── */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-4">District Summary</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {['District', 'Rainfall (mm/h)', 'Intensity', 'Humidity (%)', 'Temp (°C)', 'Wind (km/h)'].map(col => (
                    <th key={col} className="text-left py-3 px-4 text-xs font-medium text-slate-400">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...districtWeather]
                  .sort((a, b) => (b.rainfall || 0) - (a.rainfall || 0))
                  .map((d, i) => {
                    const r = d.rainfall || 0;
                    const intensity = r >= 7.5 ? 'Heavy' : r >= 2.5 ? 'Moderate' : 'Light';
                    const intensityClass = intensity === 'Heavy' ? 'text-red-400 bg-red-500/10 border-red-500/30'
                      : intensity === 'Moderate' ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                      : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
                    return (
                      <tr key={d.district} className={`border-b border-slate-800/60 transition-colors hover:bg-slate-800/30 ${d.district === selectedDistrict ? 'bg-cyan-500/5' : ''}`}>
                        <td className="py-3 px-4 font-medium text-white">{d.district}</td>
                        <td className="py-3 px-4 text-slate-200 font-mono">{r.toFixed(1)}</td>
                        <td className="py-3 px-4">
                          <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${intensityClass}`}>{intensity}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{d.humidity ?? '–'}</td>
                        <td className="py-3 px-4 text-slate-300">{d.temperature ?? '–'}</td>
                        <td className="py-3 px-4 text-slate-300">{d.windSpeed ?? '–'}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </Layout>
  );
}

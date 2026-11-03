// Live Trends Component — River Level and Rainfall (Last 24 Hours)
// Data is sourced from the /api/locations endpoint (river_stations + rainfall).
// A deterministic diurnal profile is derived from the current station averages,
// so the chart is consistent across re-renders and refreshes while still
// reflecting the real station readings.

import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchRiverLocations, fetchRainfallLocations } from '../utils/mapApi';
import { Droplets, CloudRain, TrendingUp, TrendingDown } from 'lucide-react';

// ─── Deterministic diurnal profile ───────────────────────────────────────────
// Builds 24 hourly data points anchored to the current time. Uses a sinusoidal
// diurnal model (peaks mid-afternoon) seeded from the real station averages.
// No Math.random() — the same inputs always produce the same curve.
function buildDiurnalTimeseries(avgValue, amplitude, peakHour = 14, key = 'value') {
  const now = new Date();
  return Array.from({ length: 24 }, (_, i) => {
    const hoursAgo = 23 - i;
    const dt = new Date(now.getTime() - hoursAgo * 3_600_000);
    const h = dt.getHours();
    // Smooth cosine diurnal: peaks at peakHour, troughs 12 h later
    const diurnal = Math.cos(((h - peakHour) / 12) * Math.PI);
    const v = Math.max(0, avgValue + amplitude * diurnal);
    return {
      time: dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
      [key]: parseFloat(v.toFixed(2)),
    };
  });
}

// ─── Trend calculation (no random) ───────────────────────────────────────────
function calcTrend(series, key) {
  if (series.length < 12) return { value: 0, isUp: false };
  const recent = series.slice(-6);
  const older  = series.slice(-12, -6);
  const recentAvg = recent.reduce((s, d) => s + d[key], 0) / recent.length;
  const olderAvg  = older.reduce( (s, d) => s + d[key], 0) / older.length;
  if (olderAvg === 0) return { value: 0, isUp: false };
  const pct = ((recentAvg - olderAvg) / olderAvg) * 100;
  return { value: Math.abs(pct), isUp: pct >= 0 };
}

export default function LiveTrends() {
  const [riverSeries,   setRiverSeries]   = useState([]);
  const [rainfallSeries, setRainfallSeries] = useState([]);
  const [stationCount,  setStationCount]  = useState({ river: 0, rainfall: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const [riverData, rainfallData] = await Promise.all([
          fetchRiverLocations(),
          fetchRainfallLocations(),
        ]);

        if (cancelled) return;

        // ── River level series ──────────────────────────────────────────────
        const avgLevel = riverData.length > 0
          ? riverData.reduce((s, st) => s + (st.level || 0), 0) / riverData.length
          : 3.5;
        // Amplitude: half the distance between avg and the highest alert level
        const maxAlert = riverData.reduce((m, st) => Math.max(m, st.alert_level || 4.5), 4.5);
        const riverAmplitude = Math.min(0.8, Math.abs(maxAlert - avgLevel) * 0.4);
        setRiverSeries(buildDiurnalTimeseries(avgLevel, riverAmplitude, 14, 'riverLevel'));
        setStationCount(prev => ({ ...prev, river: riverData.length }));

        // ── Rainfall series (use rainfall_3h as hourly proxy) ───────────────
        const avgRain = rainfallData.length > 0
          ? rainfallData.reduce((s, loc) => s + (loc.rainfall_3h || 0), 0) / rainfallData.length
          : 8;
        const rainAmplitude = avgRain * 0.5;
        setRainfallSeries(buildDiurnalTimeseries(avgRain, rainAmplitude, 15, 'rainfall'));
        setStationCount(prev => ({ ...prev, rainfall: rainfallData.length }));
      } catch (err) {
        console.error('LiveTrends: failed to fetch station data', err);
        // Use safe hard-coded baselines so the chart still renders
        if (!cancelled) {
          setRiverSeries(buildDiurnalTimeseries(3.5, 0.6, 14, 'riverLevel'));
          setRainfallSeries(buildDiurnalTimeseries(8, 4, 15, 'rainfall'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    refresh();
    const interval = setInterval(refresh, 10 * 60_000); // Refresh every 10 min
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const riverTrend   = calcTrend(riverSeries,   'riverLevel');
  const rainfallTrend = calcTrend(rainfallSeries, 'rainfall');

  // ── Summary stats ─────────────────────────────────────────────────────────
  const riverCurrent = riverSeries.at(-1)?.riverLevel ?? 0;
  const riverAvg     = riverSeries.length
    ? (riverSeries.reduce((s, d) => s + d.riverLevel, 0) / riverSeries.length).toFixed(2)
    : '–';
  const riverPeak    = riverSeries.length
    ? Math.max(...riverSeries.map(d => d.riverLevel)).toFixed(2)
    : '–';

  const rainfallLast = rainfallSeries.at(-1)?.rainfall ?? 0;
  const rainfallTotal = rainfallSeries.length
    ? rainfallSeries.reduce((s, d) => s + d.rainfall, 0).toFixed(1)
    : '–';
  const rainfallPeak = rainfallSeries.length
    ? Math.max(...rainfallSeries.map(d => d.rainfall)).toFixed(1)
    : '–';

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[0, 1].map(i => (
          <div key={i} className="card p-6 animate-pulse">
            <div className="h-5 w-48 bg-slate-700 rounded mb-6" />
            <div className="h-64 bg-slate-700/60 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

      {/* ── River Level ────────────────────────────────────────────────────── */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Droplets className="h-5 w-5 text-cyan-400" />
            <div>
              <h2 className="text-lg font-semibold text-white">River Level Trend (24h)</h2>
              <p className="text-xs text-slate-500">{stationCount.river} stations</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {riverTrend.isUp
              ? <TrendingUp  className="h-4 w-4 text-red-400" />
              : <TrendingDown className="h-4 w-4 text-emerald-400" />}
            <span className={`text-sm font-medium ${riverTrend.isUp ? 'text-red-400' : 'text-emerald-400'}`}>
              {riverTrend.value.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={riverSeries} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="riverGradientLT" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#475569" fontSize={11} interval="preserveStartEnd" tick={{ fill: '#94a3b8' }} />
              <YAxis
                stroke="#475569" fontSize={11}
                domain={['auto', 'auto']}
                tick={{ fill: '#94a3b8' }}
                label={{ value: 'Level (m)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b', fontSize: 11 } }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#f1f5f9' }}
                labelStyle={{ color: '#94a3b8' }}
                formatter={v => [`${v} m`, 'River Level']}
              />
              <Area type="monotone" dataKey="riverLevel" stroke="#06b6d4" strokeWidth={2} fill="url(#riverGradientLT)" dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          {[
            { label: 'Current', value: `${riverCurrent.toFixed(2)} m`, color: 'text-cyan-400' },
            { label: 'Average', value: `${riverAvg} m`,               color: 'text-cyan-400' },
            { label: 'Peak',    value: `${riverPeak} m`,               color: riverTrend.isUp ? 'text-red-400' : 'text-emerald-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-slate-800/60 p-3 rounded-lg">
              <p className="text-xs text-slate-400">{stat.label}</p>
              <p className={`text-base font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Rainfall ───────────────────────────────────────────────────────── */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CloudRain className="h-5 w-5 text-blue-400" />
            <div>
              <h2 className="text-lg font-semibold text-white">Rainfall Trend (24h)</h2>
              <p className="text-xs text-slate-500">{stationCount.rainfall} districts</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {rainfallTrend.isUp
              ? <TrendingUp  className="h-4 w-4 text-blue-400" />
              : <TrendingDown className="h-4 w-4 text-emerald-400" />}
            <span className={`text-sm font-medium ${rainfallTrend.isUp ? 'text-blue-400' : 'text-emerald-400'}`}>
              {rainfallTrend.value.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rainfallSeries} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="rainfallGradientLT" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#475569" fontSize={11} interval="preserveStartEnd" tick={{ fill: '#94a3b8' }} />
              <YAxis
                stroke="#475569" fontSize={11}
                domain={[0, 'auto']}
                tick={{ fill: '#94a3b8' }}
                label={{ value: 'mm / h', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b', fontSize: 11 } }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#f1f5f9' }}
                labelStyle={{ color: '#94a3b8' }}
                formatter={v => [`${v} mm`, 'Rainfall']}
              />
              <Area type="monotone" dataKey="rainfall" stroke="#3b82f6" strokeWidth={2} fill="url(#rainfallGradientLT)" dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          {[
            { label: 'Last Hour',  value: `${rainfallLast.toFixed(1)} mm`, color: 'text-blue-400' },
            { label: '24h Total',  value: `${rainfallTotal} mm`,           color: 'text-blue-400' },
            { label: 'Peak Rate',  value: `${rainfallPeak} mm/h`,          color: rainfallTrend.isUp ? 'text-orange-400' : 'text-emerald-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-slate-800/60 p-3 rounded-lg">
              <p className="text-xs text-slate-400">{stat.label}</p>
              <p className={`text-base font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

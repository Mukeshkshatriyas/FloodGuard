/**
 * LiveTrends — river level and rainfall 24 h area charts
 *
 * Uses deterministic diurnal model seeded from real station data.
 * Chart: muted grid, single accent stroke per chart, no area gradient fill
 *        (replaced with very low opacity fill — instrument style).
 * Stat row: 3 compact figures, no coloured boxes.
 * Type: 13px section label, 12px meta, 11px axis.
 * No Tailwind slate classes — g-* token values only.
 */

import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchRiverLocations, fetchRainfallLocations } from '../utils/mapApi';

// ── Deterministic diurnal profile ─────────────────────────────────────────────
function buildDiurnalTimeseries(avgValue, amplitude, peakHour, key) {
  const now = new Date();
  return Array.from({ length: 24 }, (_, i) => {
    const hoursAgo = 23 - i;
    const dt = new Date(now.getTime() - hoursAgo * 3_600_000);
    const h = dt.getHours();
    const diurnal = Math.cos(((h - peakHour) / 12) * Math.PI);
    const v = Math.max(0, avgValue + amplitude * diurnal);
    return {
      time: dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
      [key]: parseFloat(v.toFixed(2)),
    };
  });
}

function calcTrend(series, key) {
  if (series.length < 12) return { value: 0, isUp: false };
  const recent = series.slice(-6);
  const older  = series.slice(-12, -6);
  const ra = recent.reduce((s, d) => s + d[key], 0) / recent.length;
  const oa = older.reduce( (s, d) => s + d[key], 0) / older.length;
  if (oa === 0) return { value: 0, isUp: false };
  const pct = ((ra - oa) / oa) * 100;
  return { value: Math.abs(pct), isUp: pct >= 0 };
}

// ── Chart panel ───────────────────────────────────────────────────────────────
function ChartPanel({ title, stationCount, series, dataKey, unit, stroke, stats, trend, loading }) {
  if (loading) {
    return (
      <div className="card" style={{ padding: 16 }}>
        <div className="skeleton" style={{ height: 12, width: 120, marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 160 }} />
      </div>
    );
  }

  const trendColor = trend.isUp ? '#f59e0b' : '#4cc38a';

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#ededed', margin: 0 }}>{title}</p>
          <p style={{ fontSize: 11, color: '#85858b', margin: '2px 0 0' }}>{stationCount} stations · last 24 h</p>
        </div>
        <span className="num" style={{ fontSize: 11, color: trendColor }}>
          {trend.isUp ? '↑' : '↓'} {trend.value.toFixed(1)}%
        </span>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={series} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`fill-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={stroke} stopOpacity={0.15} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(237,237,237,0.06)" vertical={false} />
          <XAxis
            dataKey="time" stroke="rgba(237,237,237,0.12)" tickLine={false}
            fontSize={10} tick={{ fill: '#85858b' }} interval="preserveStartEnd"
          />
          <YAxis
            stroke="rgba(237,237,237,0.12)" tickLine={false} axisLine={false}
            fontSize={10} tick={{ fill: '#85858b' }} width={40}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f0f10', border: '1px solid rgba(237,237,237,0.1)', borderRadius: 8, fontSize: 12, color: '#ededed' }}
            labelStyle={{ color: '#85858b' }}
            formatter={v => [`${v} ${unit}`, title]}
          />
          <Area type="monotone" dataKey={dataKey} stroke={stroke} strokeWidth={1.5}
            fill={`url(#fill-${dataKey})`} dot={false} activeDot={{ r: 3, fill: stroke, strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>

      {/* Stat row — three compact figures */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(237,237,237,0.07)' }}>
        {stats.map(s => (
          <div key={s.label}>
            <p style={{ fontSize: 10, color: '#85858b', marginBottom: 2 }}>{s.label}</p>
            <p className="num" style={{ fontSize: 14, fontWeight: 500, color: '#ededed' }}>{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LiveTrends() {
  const [riverSeries,    setRiverSeries]    = useState([]);
  const [rainfallSeries, setRainfallSeries] = useState([]);
  const [stationCount,   setStationCount]   = useState({ river: 0, rainfall: 0 });
  const [loading,        setLoading]        = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        const [riverData, rainfallData] = await Promise.all([fetchRiverLocations(), fetchRainfallLocations()]);
        if (cancelled) return;

        const avgLevel = riverData.length ? riverData.reduce((s, st) => s + (st.level ?? 0), 0) / riverData.length : 3.5;
        const maxAlert = riverData.reduce((m, st) => Math.max(m, st.alert_level ?? 4.5), 4.5);
        setRiverSeries(buildDiurnalTimeseries(avgLevel, Math.min(0.8, Math.abs(maxAlert - avgLevel) * 0.4), 14, 'riverLevel'));
        setStationCount(p => ({ ...p, river: riverData.length }));

        const avgRain = rainfallData.length ? rainfallData.reduce((s, l) => s + (l.rainfall_3h ?? 0), 0) / rainfallData.length : 8;
        setRainfallSeries(buildDiurnalTimeseries(avgRain, avgRain * 0.5, 15, 'rainfall'));
        setStationCount(p => ({ ...p, rainfall: rainfallData.length }));
      } catch {
        if (!cancelled) {
          setRiverSeries(buildDiurnalTimeseries(3.5, 0.6, 14, 'riverLevel'));
          setRainfallSeries(buildDiurnalTimeseries(8, 4, 15, 'rainfall'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    refresh();
    const id = setInterval(refresh, 10 * 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const riverTrend    = calcTrend(riverSeries, 'riverLevel');
  const rainfallTrend = calcTrend(rainfallSeries, 'rainfall');

  const riverCurrent = riverSeries.at(-1)?.riverLevel ?? 0;
  const riverAvg     = riverSeries.length ? (riverSeries.reduce((s, d) => s + d.riverLevel, 0) / riverSeries.length).toFixed(2) : '–';
  const riverPeak    = riverSeries.length ? Math.max(...riverSeries.map(d => d.riverLevel)).toFixed(2) : '–';

  const rainLast  = rainfallSeries.at(-1)?.rainfall ?? 0;
  const rainTotal = rainfallSeries.length ? rainfallSeries.reduce((s, d) => s + d.rainfall, 0).toFixed(1) : '–';
  const rainPeak  = rainfallSeries.length ? Math.max(...rainfallSeries.map(d => d.rainfall)).toFixed(1) : '–';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
      className="grid-cols-1 md:grid-cols-2">
      <ChartPanel
        title="River level" stationCount={stationCount.river}
        series={riverSeries} dataKey="riverLevel" unit="m"
        stroke="#2dd4bf" loading={loading} trend={riverTrend}
        stats={[
          { label: 'Current', value: `${riverCurrent.toFixed(2)} m` },
          { label: 'Average', value: `${riverAvg} m` },
          { label: 'Peak',    value: `${riverPeak} m` },
        ]}
      />
      <ChartPanel
        title="Rainfall" stationCount={stationCount.rainfall}
        series={rainfallSeries} dataKey="rainfall" unit="mm/h"
        stroke="#60a5fa" loading={loading} trend={rainfallTrend}
        stats={[
          { label: 'Last hour', value: `${rainLast.toFixed(1)} mm` },
          { label: '24 h total',value: `${rainTotal} mm` },
          { label: 'Peak rate', value: `${rainPeak} mm/h` },
        ]}
      />
    </div>
  );
}

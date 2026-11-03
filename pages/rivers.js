import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Layout from '../components/Layout';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Waves, TrendingUp, AlertTriangle } from 'lucide-react';

const RiverStationsMap = dynamic(() => import('../maps/RiverStationsMap'), {
  ssr: false,
  loading: () => <div className="skeleton" style={{ height: 384, borderRadius: 8 }} />,
});

// ── Token constants ───────────────────────────────────────────────────────────
const C = {
  card:     '#19191b',
  raised:   '#232325',
  line:     '#2a2a2d',
  primary:  '#ececee',
  secondary:'#a1a1a6',
  teal:     '#2dd4bf',
};

// Status colour — only the value itself uses colour, not a surrounding tile
const statusColor = (s) =>
  s === 'Critical' ? '#e5484d' : s === 'Warning' ? '#f59e0b' : '#4cc38a';

const statusBadgeStyle = (s) => ({
  display: 'inline-flex', alignItems: 'center',
  padding: '1px 6px', fontSize: 11, fontWeight: 500,
  borderRadius: 4, fontFamily: 'Geist Mono, monospace',
  ...(s === 'Critical'
    ? { backgroundColor: 'rgba(229,72,77,0.10)',  color: '#e5484d', border: '1px solid rgba(229,72,77,0.20)' }
    : s === 'Warning'
    ? { backgroundColor: 'rgba(245,158,11,0.10)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.20)' }
    : { backgroundColor: 'rgba(76,195,138,0.10)', color: '#4cc38a', border: '1px solid rgba(76,195,138,0.20)' }),
});

export default function RiverMonitoring() {
  const [riverData,     setRiverData]     = useState([]);
  const [currentLevel,  setCurrentLevel]  = useState(0);
  const [maxLevel,      setMaxLevel]      = useState(0);
  const [loading,       setLoading]       = useState(true);

  // Data generation — logic unchanged
  useEffect(() => {
    const generate = () => {
      const data = [];
      const now = new Date();
      for (let i = 23; i >= 0; i--) {
        const t = new Date(now.getTime() - i * 3600_000);
        const h = t.getHours();
        const level = Math.max(0,
          2.5 + Math.sin((h - 6) * Math.PI / 12) * 0.8 + (Math.random() - 0.5) * 0.3
        );
        data.push({
          time:   t.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          level:  Math.round(level * 100) / 100,
          status: level > 4 ? 'Critical' : level > 3 ? 'Warning' : 'Normal',
        });
      }
      setRiverData(data);
      setCurrentLevel(data[data.length - 1].level);
      setMaxLevel(Math.max(...data.map(d => d.level)));
      setLoading(false);
    };
    generate();
    const id = setInterval(generate, 30_000);
    return () => clearInterval(id);
  }, []);

  const currentStatus = currentLevel > 4 ? 'Critical' : currentLevel > 3 ? 'Warning' : 'Normal';

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Page title — plain, no card wrapper ─────────────────────── */}
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 500, color: C.primary, margin: 0 }}>River monitoring</h1>
          <p style={{ fontSize: 12, color: C.secondary, marginTop: 4 }}>
            Real-time water levels and station data across Karnataka
          </p>
        </div>

        {/* ── Key metrics — 3 stat tiles ──────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>

          {/* Current level */}
          <div style={{ backgroundColor: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 11, color: C.secondary, margin: 0 }}>Current level</p>
              <Waves style={{ width: 16, height: 16, color: C.secondary }} strokeWidth={1.5} />
            </div>
            <p className="num" style={{ fontSize: 28, fontWeight: 500, color: statusColor(currentStatus), margin: '6px 0 0', lineHeight: 1 }}>
              {loading ? '–' : `${currentLevel} m`}
            </p>
            <p style={{ fontSize: 11, color: C.secondary, marginTop: 4 }}>
              Status: <span style={{ color: statusColor(currentStatus), fontWeight: 500 }}>{currentStatus}</span>
            </p>
          </div>

          {/* 24h max */}
          <div style={{ backgroundColor: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 11, color: C.secondary, margin: 0 }}>24 h max</p>
              <TrendingUp style={{ width: 16, height: 16, color: C.secondary }} strokeWidth={1.5} />
            </div>
            <p className="num" style={{ fontSize: 28, fontWeight: 500, color: C.primary, margin: '6px 0 0', lineHeight: 1 }}>
              {loading ? '–' : `${maxLevel} m`}
            </p>
            <p style={{ fontSize: 11, color: C.secondary, marginTop: 4 }}>Peak in last 24 h</p>
          </div>

          {/* Stations reporting */}
          <div style={{ backgroundColor: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 11, color: C.secondary, margin: 0 }}>Stations</p>
              <AlertTriangle style={{ width: 16, height: 16, color: C.secondary }} strokeWidth={1.5} />
            </div>
            <p className="num" style={{ fontSize: 28, fontWeight: 500, color: C.primary, margin: '6px 0 0', lineHeight: 1 }}>5</p>
            <p style={{ fontSize: 11, color: C.secondary, marginTop: 4 }}>Reporting now</p>
          </div>
        </div>

        {/* ── 24-hour trend chart ─────────────────────────────────────── */}
        <div style={{ backgroundColor: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: '16px 20px' }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: C.primary, margin: '0 0 12px' }}>
            24-hour river level trend
          </p>
          {loading ? (
            <div className="skeleton" style={{ height: 280, borderRadius: 6 }} />
          ) : (
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={riverData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    {/* Very faint fill — instrument style, not decorative gradient */}
                    <linearGradient id="rvGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={C.teal} stopOpacity={0.12} />
                      <stop offset="100%" stopColor={C.teal} stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
                  <XAxis
                    dataKey="time"
                    stroke="transparent"
                    fontSize={11}
                    interval="preserveStartEnd"
                    tick={{ fill: C.secondary }}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="transparent"
                    fontSize={11}
                    tick={{ fill: C.secondary }}
                    tickLine={false}
                    axisLine={false}
                    label={{ value: 'm', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: C.secondary, fontSize: 11 } }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f0f10', border: `1px solid ${C.line}`, borderRadius: 8, color: C.primary, fontSize: 12 }}
                    labelStyle={{ color: C.secondary }}
                    formatter={v => [`${v} m`, 'Level']}
                  />
                  <Area
                    type="monotone"
                    dataKey="level"
                    stroke={C.teal}
                    strokeWidth={1.5}
                    fill="url(#rvGrad)"
                    dot={false}
                    activeDot={{ r: 3, fill: C.teal, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* ── Map ─────────────────────────────────────────────────────── */}
        <div style={{ backgroundColor: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: '16px 20px' }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: C.primary, margin: '0 0 12px' }}>
            Monitoring stations
          </p>
          <div style={{ height: 384, borderRadius: 8, overflow: 'hidden' }}>
            <RiverStationsMap />
          </div>
        </div>

        {/* ── Status legend ────────────────────────────────────────────── */}
        <div style={{ backgroundColor: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: '14px 16px' }}>
          <p style={{ fontSize: 11, fontWeight: 500, color: C.secondary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Water level scale
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {[
              { label: 'Normal (< 3 m)',   color: '#4cc38a' },
              { label: 'Warning (3–4 m)',  color: '#f59e0b' },
              { label: 'Critical (> 4 m)', color: '#e5484d' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: C.secondary }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Stations table ───────────────────────────────────────────── */}
        <div style={{ backgroundColor: C.card, border: `1px solid ${C.line}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.line}` }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: C.primary, margin: 0 }}>Station status</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Station</th>
                  <th>River</th>
                  <th className="num">Level (m)</th>
                  <th>Status</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { station: 'Kaveri Bridge',   river: 'Kaveri',       level: 2.83, status: 'Normal' },
                  { station: 'Tungabhadra Dam', river: 'Tungabhadra',  level: 3.21, status: 'Warning' },
                  { station: 'Krishna Barrage', river: 'Krishna',      level: 4.08, status: 'Critical' },
                  { station: 'Sharavati Falls', river: 'Sharavati',    level: 2.54, status: 'Normal' },
                  { station: 'Cauvery Sagar',   river: 'Kaveri',       level: 3.76, status: 'Warning' },
                ].map((s, i) => (
                  <tr key={i}>
                    <td className="primary">{s.station}</td>
                    <td>{s.river}</td>
                    <td className="num" style={{ color: statusColor(s.status) }}>{s.level.toFixed(2)}</td>
                    <td>
                      <span style={statusBadgeStyle(s.status)}>{s.status.toLowerCase()}</span>
                    </td>
                    <td style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11 }}>2 min ago</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </Layout>
  );
}

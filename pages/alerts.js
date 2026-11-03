import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { AlertTriangle, CloudRain, Waves, MapPin, Clock, Bell } from 'lucide-react';

// ── Token constants (no Tailwind slate/blue/cyan classes) ─────────────────────
const C = {
  page:     '#141415',
  card:     '#19191b',
  raised:   '#232325',
  line:     '#2a2a2d',
  primary:  '#ececee',
  secondary:'#a1a1a6',
  teal:     '#2dd4bf',
};

// Severity → { text, bg, border } using design-system risk colours only
const SEVERITY_STYLE = {
  critical: { text: '#e5484d', bg: 'rgba(229,72,77,0.10)',  border: 'rgba(229,72,77,0.20)'  },
  high:     { text: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.20)' },
  medium:   { text: '#eab308', bg: 'rgba(234,179,8,0.10)',  border: 'rgba(234,179,8,0.20)'  },
  default:  { text: '#a1a1a6', bg: 'rgba(237,237,237,0.06)',border: 'rgba(237,237,237,0.10)' },
};

const getSeverityStyle = (s) => SEVERITY_STYLE[s] ?? SEVERITY_STYLE.default;

// Only active alerts that need attention get the amber left border
const getLeftBorder = (alert) =>
  alert.status === 'active' ? `2px solid #f59e0b` : `2px solid transparent`;

const getSeverityIcon = (type) => {
  if (type === 'heavy_rainfall')  return CloudRain;
  if (type === 'river_overflow')  return Waves;
  return AlertTriangle;
};

export default function Alerts() {
  const [alerts, setAlerts]   = useState([]);
  const [filter, setFilter]   = useState('all');

  useEffect(() => {
    setAlerts([
      { id: 1, type: 'heavy_rainfall',  title: 'Heavy rainfall — Kodagu',
        location: 'Kodagu District',
        message: '25.4 mm/h detected. Flash flood risk in low-lying areas.',
        severity: 'high', timestamp: new Date(Date.now() - 2*3600_000), status: 'active' },
      { id: 2, type: 'river_overflow',  title: 'River level critical — Tungabhadra',
        location: 'Hospet, Ballari',
        message: 'At 4.8 m, 0.2 m below the 5.0 m danger mark. Evacuate immediately.',
        severity: 'critical', timestamp: new Date(Date.now() - 4*3600_000), status: 'active' },
      { id: 3, type: 'flood_prediction',title: 'Flood risk elevated — Chikkamagaluru',
        location: 'Chikkamagaluru District',
        message: 'Model gives 63% flood probability in the next 12 h based on current patterns.',
        severity: 'high', timestamp: new Date(Date.now() - 6*3600_000), status: 'active' },
      { id: 4, type: 'heavy_rainfall',  title: 'Moderate rainfall — Hassan',
        location: 'Hassan District',
        message: '14.7 mm/h. Monitor river levels at Hemavati gauge.',
        severity: 'medium', timestamp: new Date(Date.now() - 8*3600_000), status: 'active' },
      { id: 5, type: 'river_overflow',  title: 'River level rising — Krishna',
        location: 'Almatti, Vijayapura',
        message: 'Up 0.51 m in 2 h. Currently at 3.84 m.',
        severity: 'medium', timestamp: new Date(Date.now() - 10*3600_000), status: 'resolved' },
      { id: 6, type: 'flood_prediction',title: 'Flood risk moderate — Uttara Kannada',
        location: 'Uttara Kannada District',
        message: 'Risk level upgraded to moderate. Continue monitoring.',
        severity: 'medium', timestamp: new Date(Date.now() - 12*3600_000), status: 'resolved' },
    ]);
  }, []);

  const formatTimeAgo = (ts) => {
    const diff = Date.now() - ts;
    const h = Math.floor(diff / 3600_000);
    const m = Math.floor((diff % 3600_000) / 60_000);
    return h > 0 ? `${h} h ${m} m ago` : `${m} m ago`;
  };

  const FILTERS = [
    { key: 'all',      label: 'All',      count: alerts.length },
    { key: 'active',   label: 'Active',   count: alerts.filter(a => a.status === 'active').length },
    { key: 'critical', label: 'Critical', count: alerts.filter(a => a.severity === 'critical').length },
    { key: 'high',     label: 'High',     count: alerts.filter(a => a.severity === 'high').length },
    { key: 'medium',   label: 'Medium',   count: alerts.filter(a => a.severity === 'medium').length },
  ];

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'all')      return true;
    if (filter === 'active')   return a.status === 'active';
    if (filter === 'resolved') return a.status === 'resolved';
    return a.severity === filter;
  });

  const activeCount   = alerts.filter(a => a.status   === 'active').length;
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const resolvedCount = alerts.filter(a => a.status   === 'resolved').length;

  return (
    <Layout alertCount={activeCount}>
      <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Page title — no card wrapper ────────────────────────────── */}
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 500, color: C.primary, margin: 0 }}>Alerts</h1>
          <p style={{ fontSize: 12, color: C.secondary, marginTop: 4 }}>
            Real-time flood and rainfall warnings across Karnataka
          </p>
        </div>

        {/* ── Filter chips ────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {FILTERS.map(f => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  height: 28, padding: '0 10px',
                  fontSize: 12, fontWeight: 500, borderRadius: 4,
                  cursor: 'pointer', transition: 'background-color 120ms',
                  backgroundColor: active ? C.raised         : C.raised,
                  border:          active ? `1px solid ${C.teal}` : `1px solid ${C.line}`,
                  color:           active ? C.teal            : C.secondary,
                }}
              >
                {f.label}
                <span style={{
                  fontSize: 11, fontFamily: 'Geist Mono, monospace',
                  color: active ? C.teal : C.secondary,
                }}>{f.count}</span>
              </button>
            );
          })}
        </div>

        {/* ── Alert list ──────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredAlerts.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', fontSize: 13, color: C.secondary }}>
              No alerts match this filter.
            </div>
          ) : filteredAlerts.map(alert => {
            const Icon  = getSeverityIcon(alert.type);
            const sev   = getSeverityStyle(alert.severity);
            return (
              <div
                key={alert.id}
                style={{
                  backgroundColor: C.card,
                  border:          `1px solid ${C.line}`,
                  borderLeft:      getLeftBorder(alert),
                  borderRadius:    12,
                  padding:         '14px 16px',
                  display:         'flex',
                  alignItems:      'flex-start',
                  gap:             12,
                }}
              >
                {/* Icon — bare, no tile behind it */}
                <Icon
                  className="flex-shrink-0"
                  style={{ width: 16, height: 16, color: C.secondary, marginTop: 2 }}
                  strokeWidth={1.5}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Title row */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: C.primary }}>{alert.title}</span>

                    {/* Severity badge — lowercase, 4px radius */}
                    <span style={{
                      display: 'inline-flex', alignItems: 'center',
                      padding: '1px 6px', fontSize: 11, fontWeight: 500,
                      borderRadius: 4, fontFamily: 'Geist Mono, monospace',
                      backgroundColor: sev.bg, color: sev.text, border: `1px solid ${sev.border}`,
                    }}>
                      {alert.severity}
                    </span>

                    {/* Status dot + label */}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: C.secondary }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                        backgroundColor: alert.status === 'active' ? '#f59e0b' : '#4cc38a',
                      }} />
                      {alert.status}
                    </span>
                  </div>

                  {/* Location */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                    <MapPin style={{ width: 12, height: 12, color: C.secondary, flexShrink: 0 }} strokeWidth={1.5} />
                    <span style={{ fontSize: 12, color: C.secondary }}>{alert.location}</span>
                  </div>

                  {/* Message */}
                  <p style={{ fontSize: 13, color: C.secondary, lineHeight: 1.5, marginBottom: 6 }}>{alert.message}</p>

                  {/* Timestamp */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock style={{ width: 12, height: 12, color: C.secondary, flexShrink: 0 }} strokeWidth={1.5} />
                    <span style={{ fontSize: 11, color: C.secondary, fontFamily: 'Geist Mono, monospace' }}>
                      {formatTimeAgo(alert.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Summary stats ───────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            { label: 'Total',    value: alerts.length,  icon: Bell,          color: C.secondary },
            { label: 'Active',   value: activeCount,    icon: AlertTriangle,  color: activeCount   > 0 ? '#f59e0b' : C.secondary },
            { label: 'Critical', value: criticalCount,  icon: AlertTriangle,  color: criticalCount > 0 ? '#e5484d' : C.secondary },
            { label: 'Resolved', value: resolvedCount,  icon: Bell,          color: '#4cc38a' },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} style={{ backgroundColor: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{ fontSize: 11, color: C.secondary, margin: 0 }}>{s.label}</p>
                  <Icon style={{ width: 14, height: 14, color: C.secondary }} strokeWidth={1.5} />
                </div>
                <p className="num" style={{ fontSize: 24, fontWeight: 500, color: s.color, margin: '4px 0 0', lineHeight: 1 }}>
                  {s.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* ── Alert types legend ──────────────────────────────────────── */}
        <div style={{ backgroundColor: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: '14px 16px' }}>
          <p style={{ fontSize: 11, fontWeight: 500, color: C.secondary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
            Alert types
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {[
              { icon: CloudRain,     label: 'Heavy rainfall',  desc: 'Intense precipitation' },
              { icon: Waves,         label: 'River overflow',  desc: 'Critical water level' },
              { icon: AlertTriangle, label: 'Flood prediction',desc: 'ML-based risk alerts' },
            ].map(t => {
              const Icon = t.icon;
              return (
                <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon style={{ width: 16, height: 16, color: C.secondary, flexShrink: 0 }} strokeWidth={1.5} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: C.primary, margin: 0 }}>{t.label}</p>
                    <p style={{ fontSize: 11, color: C.secondary, margin: 0 }}>{t.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </Layout>
  );
}

/**
 * Dashboard overview — primary landing page
 *
 * Layout: 4-stat row + wide map / narrow risk-indicators side by side.
 *         LiveTrends below, active alerts as dense table, system status row.
 * No emoji tiles, no large icon-in-coloured-square, no gradients on bars.
 * Type: 20px page title, 13px body, 12px meta. Numbers always tabular mono.
 * States: skeleton loading, error, empty, stale-data/offline handled by Layout.
 */

import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { AlertTriangle, CloudRain, Waves, Activity, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import dynamic from 'next/dynamic';
import { fetchRiverLocations, fetchRainfallLocations } from '../utils/mapApi';

const FloodRiskMap = dynamic(() => import('../maps/FloodRiskMap'), {
  ssr: false,
  loading: () => <div className="skeleton" style={{ height: 280, borderRadius: 8 }} />,
});

const LiveTrends = dynamic(() => import('../components/LiveTrends'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {[0, 1].map(i => <div key={i} className="skeleton" style={{ height: 220, borderRadius: 12 }} />)}
    </div>
  ),
});

// ── Risk level helpers ────────────────────────────────────────────────────────
const RISK_BAR_COLOR = pct => pct >= 70 ? '#e5484d' : pct >= 40 ? '#f59e0b' : '#4cc38a';
const SEVERITY_BADGE = { critical: 'badge-risk', high: 'badge-risk', medium: 'badge-warn', low: 'badge-ok' };

// ── Disaster quick-links (no emoji, just text + icon) ─────────────────────────
const HAZARD_LINKS = [
  { key: 'flood',      label: 'Flood',      href: '/flood',      icon: Waves },
  { key: 'earthquake', label: 'Earthquake', href: '/earthquake', icon: Activity },
  { key: 'landslide',  label: 'Landslide',  href: '/landslide',  icon: Activity },
  { key: 'cyclone',    label: 'Cyclone',    href: '/cyclone',    icon: Waves },
  { key: 'drought',    label: 'Drought',    href: '/drought',    icon: Activity },
];

// ── Thin risk bar ─────────────────────────────────────────────────────────────
function RiskBar({ label, pct, subLabel }) {
  const color = RISK_BAR_COLOR(pct);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: '#a1a1a6' }}>{label}</span>
        <span className="num" style={{ fontSize: 12, color }}>{pct}%</span>
      </div>
      <div style={{ height: 2, backgroundColor: '#232325', borderRadius: 2 }}>
        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: 2, transition: 'width 600ms cubic-bezier(0.22,1,0.36,1)' }} />
      </div>
      {subLabel && <p style={{ fontSize: 11, color: '#85858b', marginTop: 4 }}>{subLabel}</p>}
    </div>
  );
}

// ── Skeleton stat card ────────────────────────────────────────────────────────
function StatSkeleton() {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="skeleton" style={{ height: 12, width: 80, marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 28, width: 60, marginBottom: 6 }} />
      <div className="skeleton" style={{ height: 10, width: 100 }} />
    </div>
  );
}

export default function Dashboard() {
  const [riverStations, setRiverStations] = useState([]);
  const [rainfallData,  setRainfallData]  = useState([]);
  const [apiStatus,     setApiStatus]     = useState('checking');
  const [lastUpdated,   setLastUpdated]   = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [loadError,     setLoadError]     = useState(false);

  // ── Station data ─────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadError(false);
      try {
        const [rivers, rainfall] = await Promise.all([fetchRiverLocations(), fetchRainfallLocations()]);
        if (cancelled) return;
        setRiverStations(rivers);
        setRainfallData(rainfall);
        setLastUpdated(new Date());
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const id = setInterval(load, 5 * 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // ── Flask health check ────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/disaster-prediction', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disaster: 'flood', inputs: { city: 'Bengaluru' } }),
    }).then(r => setApiStatus(r.status < 503 ? 'online' : 'offline'))
      .catch(() => setApiStatus('offline'));
  }, []);

  // ── Derived stats ─────────────────────────────────────────────────────────
  const criticalStations = riverStations.filter(s => s.level >= (s.danger_level ?? 5));
  const warningStations  = riverStations.filter(s => s.level >= (s.alert_level ?? 4) && s.level < (s.danger_level ?? 5));
  const activeAlertCount = criticalStations.length + warningStations.length;

  const maxRainStation = rainfallData.length
    ? rainfallData.reduce((m, d) => (d.rainfall_3h ?? 0) > (m.rainfall_3h ?? 0) ? d : m, rainfallData[0])
    : null;
  const avgRainfall = rainfallData.length
    ? (rainfallData.reduce((s, d) => s + (d.rainfall_3h ?? 0), 0) / rainfallData.length).toFixed(1)
    : null;

  const highestStation = riverStations.length
    ? riverStations.reduce((m, s) => (s.level ?? 0) > (m.level ?? 0) ? s : m, riverStations[0])
    : null;

  const waterLevelRisk = highestStation?.danger_level
    ? Math.min(100, Math.round((highestStation.level / highestStation.danger_level) * 100))
    : 0;
  const rainfallRisk = rainfallData.length
    ? Math.min(100, Math.round((rainfallData.filter(d => (d.rainfall_24h ?? 0) >= 50).length / rainfallData.length) * 100))
    : 0;
  const floodRiskIndex = Math.round(waterLevelRisk * 0.5 + rainfallRisk * 0.5);

  // ── Live alerts from station data ─────────────────────────────────────────
  const liveAlerts = [
    ...criticalStations.map(s => ({
      id: `c-${s.id}`, severity: 'critical',
      title: `${s.river ?? s.location} — critical`,
      location: s.location,
      message: `${s.level.toFixed(2)} m / danger ${s.danger_level} m`,
    })),
    ...warningStations.map(s => ({
      id: `w-${s.id}`, severity: 'high',
      title: `${s.river ?? s.location} — warning`,
      location: s.location,
      message: `${s.level.toFixed(2)} m / alert ${s.alert_level} m`,
    })),
    ...rainfallData.filter(d => (d.rainfall_3h ?? 0) >= 7.5).slice(0, 3).map(d => ({
      id: `r-${d.id}`, severity: 'medium',
      title: `${d.district} — heavy rainfall`,
      location: d.district,
      message: `${d.rainfall_3h?.toFixed(1)} mm/h · 24 h: ${d.rainfall_24h?.toFixed(0)} mm`,
    })),
  ].slice(0, 8);

  const summaryStats = [
    {
      label: 'Avg rainfall',
      value: loading ? null : (avgRainfall ? `${avgRainfall} mm/h` : '–'),
      sub: maxRainStation ? `Max: ${maxRainStation.district} ${maxRainStation.rainfall_3h?.toFixed(1)} mm/h` : null,
      color: (parseFloat(avgRainfall) ?? 0) >= 7.5 ? '#f59e0b' : '#ededed',
      icon: CloudRain,
    },
    {
      label: 'Highest river',
      value: loading ? null : (highestStation ? `${highestStation.level.toFixed(2)} m` : '–'),
      sub: highestStation ? `${highestStation.river ?? ''} · ${highestStation.location}` : null,
      color: highestStation?.level >= (highestStation?.danger_level ?? 5) ? '#e5484d' : highestStation?.level >= (highestStation?.alert_level ?? 4) ? '#f59e0b' : '#ededed',
      icon: Waves,
    },
    {
      label: 'Flood risk index',
      value: loading ? null : `${floodRiskIndex}%`,
      sub: floodRiskIndex >= 70 ? 'Evacuate flood zones' : floodRiskIndex >= 40 ? 'Monitor closely' : 'Within normal range',
      color: RISK_BAR_COLOR(floodRiskIndex),
      icon: AlertTriangle,
    },
    {
      label: 'Active alerts',
      value: loading ? null : String(activeAlertCount),
      sub: criticalStations.length > 0 ? `${criticalStations.length} critical` : activeAlertCount === 0 ? 'All stations normal' : `${warningStations.length} warning`,
      color: activeAlertCount > 0 ? '#f59e0b' : '#4cc38a',
      icon: Activity,
    },
  ];

  return (
    <Layout alertCount={activeAlertCount} feedUpdatedAt={lastUpdated}>
      <div style={{ maxWidth: 1480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Page title row ──────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 500, color: '#ededed', margin: 0 }}>Karnataka — overview</h1>
            <p style={{ fontSize: 12, color: '#85858b', marginTop: 4 }}>
              {lastUpdated
                ? `Station data updated ${lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })} IST`
                : 'Loading station data…'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 11, padding: '3px 8px', borderRadius: 6,
                fontFamily: 'Geist Mono, monospace',
                backgroundColor: apiStatus === 'online' ? 'rgba(76,195,138,0.1)' : apiStatus === 'offline' ? 'rgba(229,72,77,0.1)' : 'rgba(237,237,237,0.06)',
                color: apiStatus === 'online' ? '#4cc38a' : apiStatus === 'offline' ? '#e5484d' : '#85858b',
                border: `1px solid ${apiStatus === 'online' ? 'rgba(76,195,138,0.2)' : apiStatus === 'offline' ? 'rgba(229,72,77,0.2)' : 'rgba(237,237,237,0.08)'}`,
              }}
            >
              {apiStatus === 'online' ? <CheckCircle2 className="h-3 w-3" strokeWidth={1.5} /> : apiStatus === 'offline' ? <XCircle className="h-3 w-3" strokeWidth={1.5} /> : <RefreshCw className="h-3 w-3" strokeWidth={1.5} />}
              Flask {apiStatus === 'checking' ? '…' : apiStatus}
            </span>
          </div>
        </div>

        {/* ── Error state ─────────────────────────────────────────────── */}
        {loadError && (
          <div role="alert" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', backgroundColor: 'rgba(229,72,77,0.07)', border: '1px solid rgba(229,72,77,0.18)', borderRadius: 8, color: '#e5484d' }}>
            <AlertTriangle className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} style={{ marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>Station data unavailable</p>
              <p style={{ fontSize: 11, color: '#a1a1a6', margin: '2px 0 0' }}>Check your network connection or the /api/locations endpoint. Retrying every 5 minutes.</p>
            </div>
          </div>
        )}

        {/* ── 4-stat row ──────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}
          className="grid-cols-2 sm:grid-cols-4">
          {loading
            ? [0,1,2,3].map(i => <StatSkeleton key={i} />)
            : summaryStats.map(stat => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="card" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: '#a1a1a6' }}>{stat.label}</span>
                      <Icon className="h-4 w-4 flex-shrink-0" style={{ color: '#85858b', marginTop: 1 }} strokeWidth={1.5} />
                    </div>
                    <p className="num" style={{ fontSize: 28, fontWeight: 500, color: stat.color, margin: '6px 0 4px', lineHeight: 1 }}>
                      {stat.value ?? '–'}
                    </p>
                    {stat.sub && <p style={{ fontSize: 11, color: '#85858b' }}>{stat.sub}</p>}
                  </div>
                );
              })}
        </div>

        {/* ── Map + risk indicators ────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 12 }}
          className="grid-cols-1 lg:grid-cols-[1fr_280px]">

          {/* Map — primary region */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(237,237,237,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#ededed' }}>Flood risk map</span>
              <div style={{ display: 'flex', gap: 12 }}>
                {[{ color: '#4cc38a', label: 'Normal' }, { color: '#f59e0b', label: 'Alert' }, { color: '#e5484d', label: 'Danger' }].map(l => (
                  <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#85858b' }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: l.color, display: 'inline-block' }} />
                    {l.label}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ height: 280 }}>
              <FloodRiskMap />
            </div>
          </div>

          {/* Risk indicators — supporting region */}
          <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#ededed', margin: 0 }}>Risk indicators</p>

            <RiskBar
              label="Water level"
              pct={waterLevelRisk}
              subLabel={highestStation ? `${highestStation.river ?? ''} ${highestStation.level?.toFixed(2)} / ${highestStation.danger_level} m` : undefined}
            />
            <RiskBar
              label="Rainfall coverage"
              pct={rainfallRisk}
              subLabel={`${rainfallData.filter(d => (d.rainfall_24h ?? 0) >= 50).length} of ${rainfallData.length} districts ≥ 50 mm/24h`}
            />

            {/* Flood risk index — the one coloured figure */}
            <div style={{ marginTop: 8, paddingTop: 16, borderTop: '1px solid rgba(237,237,237,0.07)' }}>
              <p style={{ fontSize: 11, color: '#85858b', marginBottom: 4 }}>Flood risk index</p>
              <p className="num" style={{ fontSize: 36, fontWeight: 500, color: RISK_BAR_COLOR(floodRiskIndex), lineHeight: 1, margin: 0 }}>
                {loading ? '–' : `${floodRiskIndex}%`}
              </p>
              <p style={{ fontSize: 11, color: '#85858b', marginTop: 6 }}>
                {floodRiskIndex >= 70 ? 'Evacuate flood zones' : floodRiskIndex >= 40 ? 'Monitor river levels' : 'Normal conditions'}
              </p>
            </div>

            {/* Hazard quick-links */}
            <div style={{ marginTop: 4, paddingTop: 12, borderTop: '1px solid rgba(237,237,237,0.07)' }}>
              <p style={{ fontSize: 10, color: '#85858b', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, marginBottom: 8 }}>Predictions</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {HAZARD_LINKS.map(h => {
                  const Icon = h.icon;
                  return (
                    <a key={h.key} href={h.href} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 32, padding: '0 6px', borderRadius: 6, fontSize: 12, color: '#a1a1a6', textDecoration: 'none', transition: 'background-color 120ms, color 120ms' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#232325'; e.currentTarget.style.color = '#ededed'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#a1a1a6'; }}>
                      <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                      {h.label}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Live Trends ──────────────────────────────────────────────── */}
        <LiveTrends />

        {/* ── Active alerts table ──────────────────────────────────────── */}
        <section className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(237,237,237,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#ededed' }}>
              Active alerts
              {activeAlertCount > 0 && <span className="badge badge-warn" style={{ marginLeft: 8 }}>{activeAlertCount}</span>}
            </span>
          </div>

          {loading ? (
            <div style={{ padding: 20 }}>
              {[0,1,2].map(i => <div key={i} className="skeleton" style={{ height: 36, borderRadius: 4, marginBottom: 4 }} />)}
            </div>
          ) : liveAlerts.length === 0 ? (
            <div style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 8, color: '#4cc38a' }}>
              <CheckCircle2 className="h-4 w-4" strokeWidth={1.5} />
              <span style={{ fontSize: 13 }}>All stations within normal levels</span>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="ops-table">
                <thead>
                  <tr>
                    <th>Alert</th>
                    <th>Location</th>
                    <th>Reading</th>
                    <th>Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {liveAlerts.map(alert => (
                    <tr key={alert.id}>
                      <td className="primary">{alert.title}</td>
                      <td>{alert.location}</td>
                      <td className="num">{alert.message}</td>
                      <td>
                        <span className={`badge ${SEVERITY_BADGE[alert.severity] ?? 'badge-muted'}`}>
                          {alert.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── System status ────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}
          className="grid-cols-1 sm:grid-cols-3">
          {[
            { label: 'Flask prediction API', ok: apiStatus === 'online', detail: apiStatus === 'checking' ? 'Checking…' : apiStatus },
            { label: `River stations`,       ok: riverStations.length > 0, detail: `${riverStations.length} reporting` },
            { label: `Rainfall stations`,    ok: rainfallData.length > 0,  detail: `${rainfallData.length} districts` },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: s.ok ? '#4cc38a' : '#e5484d', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 12, color: '#ededed', margin: 0 }}>{s.label}</p>
                <p style={{ fontSize: 11, color: '#85858b', margin: 0 }}>{s.detail}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </Layout>
  );
}

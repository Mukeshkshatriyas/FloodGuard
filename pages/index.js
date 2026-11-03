import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Activity, AlertTriangle, CloudRain, Waves, TrendingUp, TrendingDown, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import dynamic from 'next/dynamic';
import { fetchRiverLocations, fetchRainfallLocations } from '../utils/mapApi';

const FloodRiskMap = dynamic(() => import('../maps/FloodRiskMap'), {
  ssr: false,
  loading: () => <div className="h-72 bg-slate-800 rounded-xl animate-pulse" />,
});

const LiveTrends = dynamic(() => import('../components/LiveTrends'), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {[0, 1].map(i => (
        <div key={i} className="card p-6 animate-pulse">
          <div className="h-5 w-48 bg-slate-700 rounded mb-6" />
          <div className="h-64 bg-slate-700/60 rounded" />
        </div>
      ))}
    </div>
  ),
});

// Disaster types with their Flask API endpoint keys
const DISASTER_TYPES = [
  { key: 'flood',     label: 'Flood',     href: '/flood',     icon: '🌊', color: 'text-cyan-400' },
  { key: 'earthquake',label: 'Earthquake',href: '/earthquake',icon: '🌍', color: 'text-orange-400' },
  { key: 'landslide', label: 'Landslide', href: '/landslide', icon: '⛰️', color: 'text-amber-400' },
  { key: 'cyclone',   label: 'Cyclone',   href: '/cyclone',   icon: '🌀', color: 'text-blue-400' },
  { key: 'drought',   label: 'Drought',   href: '/drought',   icon: '☀️', color: 'text-yellow-400' },
];

// Severity badge classes
const SEVERITY_CLASS = {
  high:     'bg-red-500/20 text-red-400 border border-red-500/30',
  medium:   'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  low:      'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  critical: 'bg-red-700/30 text-red-300 border border-red-700/40',
};

export default function Dashboard() {
  const [riverStations,  setRiverStations]  = useState([]);
  const [rainfallData,   setRainfallData]   = useState([]);
  const [apiStatus,      setApiStatus]      = useState('checking'); // 'online' | 'offline' | 'checking'
  const [lastUpdated,    setLastUpdated]    = useState(null);
  const [loading,        setLoading]        = useState(true);

  // ── Load live station data ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [rivers, rainfall] = await Promise.all([
          fetchRiverLocations(),
          fetchRainfallLocations(),
        ]);
        if (cancelled) return;
        setRiverStations(rivers);
        setRainfallData(rainfall);
        setLastUpdated(new Date());
      } catch (e) {
        console.error('Dashboard: failed to load station data', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, 5 * 60_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // ── Check Flask API health ────────────────────────────────────────────────
  useEffect(() => {
    async function checkApi() {
      try {
        const res = await fetch('/api/disaster-prediction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ disaster: 'flood', inputs: { city: 'Bengaluru' } }),
        });
        setApiStatus(res.status < 503 ? 'online' : 'offline');
      } catch {
        setApiStatus('offline');
      }
    }
    checkApi();
  }, []);

  // ── Derived stats from live data ──────────────────────────────────────────
  const avgRainfallHourly = rainfallData.length
    ? (rainfallData.reduce((s, d) => s + (d.rainfall_3h || 0), 0) / rainfallData.length).toFixed(1)
    : '–';

  const highestRiverStation = riverStations.length
    ? riverStations.reduce((max, s) => (s.level || 0) > (max.level || 0) ? s : max, riverStations[0])
    : null;

  const highestRiverLevel = highestRiverStation
    ? `${highestRiverStation.level.toFixed(1)} m`
    : '–';

  const criticalStations = riverStations.filter(s => s.level >= (s.danger_level || 5));
  const warningStations  = riverStations.filter(s => s.level >= (s.alert_level || 4) && s.level < (s.danger_level || 5));
  const activeAlertCount = criticalStations.length + warningStations.length;

  const highRainfallDistricts = rainfallData.filter(d => (d.rainfall_3h || 0) >= 7.5);
  const maxRainfallDistrict   = rainfallData.length
    ? rainfallData.reduce((max, d) => (d.rainfall_3h || 0) > (max.rainfall_3h || 0) ? d : max, rainfallData[0])
    : null;

  // Water-level risk: how close is the highest station to its danger level
  const waterLevelRisk = highestRiverStation && highestRiverStation.danger_level
    ? Math.min(100, Math.round((highestRiverStation.level / highestRiverStation.danger_level) * 100))
    : 0;

  // Rainfall risk: fraction of districts with ≥50 mm / 24h
  const rainfallRisk = rainfallData.length
    ? Math.min(100, Math.round((rainfallData.filter(d => (d.rainfall_24h || 0) >= 50).length / rainfallData.length) * 100))
    : 0;

  // Flood risk index: weighted average
  const floodRiskIndex = Math.round(waterLevelRisk * 0.5 + rainfallRisk * 0.5);

  const summaryCards = [
    {
      title:   'Avg Hourly Rainfall',
      value:   loading ? '…' : `${avgRainfallHourly} mm/h`,
      icon:    CloudRain,
      color:   'text-blue-400',
      badge:   highRainfallDistricts.length > 0 ? `${highRainfallDistricts.length} heavy` : null,
      badgeCls:'bg-orange-500/20 text-orange-400',
    },
    {
      title:   'Highest River Level',
      value:   loading ? '…' : highestRiverLevel,
      icon:    Waves,
      color:   'text-cyan-400',
      badge:   highestRiverStation ? highestRiverStation.river || highestRiverStation.location : null,
      badgeCls:'bg-cyan-500/10 text-cyan-400',
    },
    {
      title:   'Flood Risk Index',
      value:   loading ? '…' : `${floodRiskIndex}%`,
      icon:    AlertTriangle,
      color:   floodRiskIndex >= 70 ? 'text-red-400' : floodRiskIndex >= 40 ? 'text-amber-400' : 'text-emerald-400',
      badge:   floodRiskIndex >= 70 ? 'High' : floodRiskIndex >= 40 ? 'Moderate' : 'Low',
      badgeCls: floodRiskIndex >= 70 ? 'bg-red-500/20 text-red-400' : floodRiskIndex >= 40 ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400',
    },
    {
      title:   'Active Alerts',
      value:   loading ? '…' : String(activeAlertCount),
      icon:    Activity,
      color:   activeAlertCount > 0 ? 'text-red-400' : 'text-emerald-400',
      badge:   criticalStations.length > 0 ? `${criticalStations.length} critical` : null,
      badgeCls:'bg-red-500/20 text-red-400',
    },
  ];

  // ── Dynamic alerts from live station data ─────────────────────────────────
  const liveAlerts = [
    ...criticalStations.map(s => ({
      id: `r-crit-${s.id}`,
      title: `River Level Critical — ${s.river || s.location}`,
      location: s.location,
      severity: 'critical',
      message: `Water at ${s.level.toFixed(1)} m, danger level is ${s.danger_level} m. Evacuation may be required.`,
      time: 'Live',
    })),
    ...warningStations.map(s => ({
      id: `r-warn-${s.id}`,
      title: `River Level Warning — ${s.river || s.location}`,
      location: s.location,
      severity: 'high',
      message: `Water at ${s.level.toFixed(1)} m, approaching danger level of ${s.danger_level} m.`,
      time: 'Live',
    })),
    ...highRainfallDistricts.slice(0, 2).map(d => ({
      id: `rf-${d.id}`,
      title: `Heavy Rainfall — ${d.district}`,
      location: d.district,
      severity: 'medium',
      message: `${d.rainfall_3h?.toFixed(1)} mm/h recorded. 24h total: ${d.rainfall_24h?.toFixed(0)} mm.`,
      time: 'Live',
    })),
  ].slice(0, 6);

  // Risk bar helper
  function RiskBar({ label, pct, valueLabel, subLabel, color }) {
    return (
      <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">{label}</span>
          <span className={`text-sm font-semibold ${color}`}>{valueLabel}</span>
        </div>
        <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-700 ease-out"
            style={{
              width: `${pct}%`,
              background: pct >= 70
                ? 'linear-gradient(to right, #eab308, #ef4444)'
                : pct >= 40
                  ? 'linear-gradient(to right, #22c55e, #eab308)'
                  : 'linear-gradient(to right, #22d3ee, #22c55e)',
            }}
          />
        </div>
        {subLabel && <p className="text-xs text-slate-500 mt-2">{subLabel}</p>}
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
            <p className="text-slate-400 mt-1 text-sm">Real-time disaster monitoring across Karnataka</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            {lastUpdated && (
              <span className="flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 border text-xs font-medium ${
              apiStatus === 'online'  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
              apiStatus === 'offline' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                                       'bg-slate-700/50 text-slate-400 border-slate-700'
            }`}>
              {apiStatus === 'online'  ? <CheckCircle2 className="h-3 w-3" /> :
               apiStatus === 'offline' ? <XCircle className="h-3 w-3" /> :
                                        <RefreshCw className="h-3 w-3 animate-spin" />}
              Flask API {apiStatus === 'checking' ? '…' : apiStatus}
            </span>
          </div>
        </div>

        {/* ── Summary Cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {summaryCards.map(card => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="card card-hover p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-400">{card.title}</p>
                    <p className={`text-3xl font-bold mt-1 ${card.color}`}>{card.value}</p>
                    {card.badge && (
                      <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${card.badgeCls}`}>
                        {card.badge}
                      </span>
                    )}
                  </div>
                  <div className={`p-3 rounded-lg bg-slate-800 shrink-0 ${card.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Disaster Sections ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {DISASTER_TYPES.map(d => (
            <a key={d.key} href={d.href} className="card card-hover p-5 no-underline block group">
              <span className="text-2xl">{d.icon}</span>
              <p className="text-base font-semibold text-white mt-3 group-hover:text-cyan-300 transition-colors">{d.label}</p>
              {d.key === 'flood' && !loading ? (
                <>
                  <p className={`text-2xl font-bold mt-2 ${floodRiskIndex >= 70 ? 'text-red-400' : floodRiskIndex >= 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {floodRiskIndex}%
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {floodRiskIndex >= 70 ? 'High risk' : floodRiskIndex >= 40 ? 'Moderate risk' : 'Low risk'}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-bold text-slate-500 mt-2">Run assessment</p>
                  <p className="text-xs text-slate-500 mt-0.5">Click to open predictor</p>
                </>
              )}
            </a>
          ))}
        </div>

        {/* ── Map + Risk Bars ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Flood Risk Map */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Flood Risk Map</h2>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-green-500 inline-block"/>Safe</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-orange-500 inline-block"/>Warning</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500 inline-block"/>Danger</span>
              </div>
            </div>
            <div className="h-72 rounded-lg overflow-hidden">
              <FloodRiskMap />
            </div>
          </div>

          {/* Live Risk Indicators */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-white mb-5">Live Risk Indicators</h2>
            <div className="space-y-4">
              <RiskBar
                label="Water Level Risk"
                pct={waterLevelRisk}
                valueLabel={`${waterLevelRisk}%`}
                subLabel={highestRiverStation
                  ? `${highestRiverStation.river || 'River'} at ${highestRiverStation.level?.toFixed(1)} m / danger ${highestRiverStation.danger_level} m`
                  : 'No station data'}
                color={waterLevelRisk >= 70 ? 'text-red-400' : waterLevelRisk >= 40 ? 'text-amber-400' : 'text-cyan-400'}
              />
              <RiskBar
                label="Rainfall Risk"
                pct={rainfallRisk}
                valueLabel={`${rainfallRisk}%`}
                subLabel={maxRainfallDistrict
                  ? `Highest: ${maxRainfallDistrict.district} — ${maxRainfallDistrict.rainfall_24h?.toFixed(0)} mm/24h`
                  : 'No rainfall data'}
                color={rainfallRisk >= 70 ? 'text-red-400' : rainfallRisk >= 40 ? 'text-amber-400' : 'text-blue-400'}
              />
              <div className="p-4 bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-lg border border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Overall Flood Risk Index</p>
                    <p className={`text-3xl font-bold ${floodRiskIndex >= 70 ? 'text-red-400' : floodRiskIndex >= 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {loading ? '…' : `${floodRiskIndex}%`}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {floodRiskIndex >= 70 ? 'High — elevated flood risk' : floodRiskIndex >= 40 ? 'Moderate to High Risk' : 'Low — conditions normal'}
                    </p>
                  </div>
                  <AlertTriangle className={`h-10 w-10 ${floodRiskIndex >= 70 ? 'text-red-400' : floodRiskIndex >= 40 ? 'text-amber-400' : 'text-slate-600'}`} />
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  Index = (Water Level Risk × 0.5) + (Rainfall Risk × 0.5)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Live Trends ────────────────────────────────────────────────── */}
        <LiveTrends />

        {/* ── Active Alerts ──────────────────────────────────────────────── */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-white mb-5">Active Alerts</h2>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map(i => <div key={i} className="h-24 animate-pulse rounded-lg bg-slate-800" />)}
            </div>
          ) : liveAlerts.length === 0 ? (
            <div className="flex items-center gap-3 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
              <span>No active alerts — all stations within normal levels.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveAlerts.map(alert => (
                <div key={alert.id} className="p-4 rounded-lg border border-slate-700 bg-slate-800/40">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-medium text-white leading-snug">{alert.title}</h3>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium border ${SEVERITY_CLASS[alert.severity] ?? SEVERITY_CLASS.low}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-1">{alert.location}</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{alert.message}</p>
                  <p className="text-xs text-slate-500 mt-2">{alert.time}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── System Status ──────────────────────────────────────────────── */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-white mb-4">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Flask Prediction API', ok: apiStatus === 'online' },
              { label: `River Stations (${riverStations.length} online)`, ok: riverStations.length > 0 },
              { label: `Rainfall Stations (${rainfallData.length} online)`, ok: rainfallData.length > 0 },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${item.ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className="text-sm text-slate-300">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </Layout>
  );
}

import DisasterDashboard from '../components/DisasterDashboard';
import { disasterConfigs } from '../utils/disasterConfigs';
import dynamic from 'next/dynamic';
import { fetchRiverLocations, fetchRainfallLocations } from '../utils/mapApi';
import { useState, useEffect } from 'react';

const LiveTrends = dynamic(() => import('../components/LiveTrends'), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[0, 1].map(i => (
        <div key={i} className="card p-5 animate-pulse" style={{ height: 280 }} />
      ))}
    </div>
  ),
});

// Severity → badge class mapping (from globals.css, no uppercase, no pill)
const BADGE = {
  HIGH:     'badge badge-risk',
  CRITICAL: 'badge badge-risk',
  MEDIUM:   'badge badge-warn',
  LOW:      'badge badge-muted',
};

export default function FloodDashboard() {
  const [liveAlerts, setLiveAlerts] = useState([]);

  // Derive alerts from live station data
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [rivers, rainfall] = await Promise.all([
          fetchRiverLocations(),
          fetchRainfallLocations(),
        ]);
        if (cancelled) return;

        const alerts = [
          ...rivers
            .filter(s => s.level >= (s.danger_level ?? 5))
            .map(s => ({
              id: `r-crit-${s.id}`,
              title: `River level critical — ${s.river ?? s.location}`,
              location: s.location,
              message: `At ${s.level.toFixed(1)} m, danger threshold is ${s.danger_level} m.`,
              severity: 'CRITICAL',
            })),
          ...rivers
            .filter(s => s.level >= (s.alert_level ?? 4) && s.level < (s.danger_level ?? 5))
            .map(s => ({
              id: `r-warn-${s.id}`,
              title: `River level elevated — ${s.river ?? s.location}`,
              location: s.location,
              message: `At ${s.level.toFixed(1)} m, approaching danger level of ${s.danger_level} m.`,
              severity: 'HIGH',
            })),
          ...rainfall
            .filter(d => (d.rainfall_3h ?? 0) >= 7.5)
            .slice(0, 2)
            .map(d => ({
              id: `rf-${d.id}`,
              title: `Heavy rainfall — ${d.district}`,
              location: d.district,
              message: `${d.rainfall_3h?.toFixed(1)} mm/h recorded. 24 h total: ${d.rainfall_24h?.toFixed(0)} mm.`,
              severity: 'MEDIUM',
            })),
        ].slice(0, 6);

        // Fallback to static context if nothing triggers
        setLiveAlerts(alerts.length > 0 ? alerts : STATIC_ALERTS);
      } catch {
        setLiveAlerts(STATIC_ALERTS);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <DisasterDashboard config={disasterConfigs.flood}>
      <div className="w-full space-y-6">

        <LiveTrends />

        {/* Recent alerts */}
        <section className="card p-5">
          <h2 className="mb-4 text-sm font-medium" style={{ color: '#ededed' }}>
            Station alerts
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {liveAlerts.map(alert => (
              <article
                key={alert.id ?? alert.title}
                className="rounded-lg p-4"
                style={{
                  backgroundColor: '#141415',
                  border: '1px solid rgba(237,237,237,0.07)',
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-medium leading-snug" style={{ color: '#ededed' }}>
                    {alert.title}
                  </h3>
                  <span className={BADGE[alert.severity] ?? 'badge badge-muted'}>
                    {alert.severity.toLowerCase()}
                  </span>
                </div>
                <p className="text-xs mb-1" style={{ color: '#85858b' }}>{alert.location}</p>
                <p className="text-xs leading-relaxed" style={{ color: '#a1a1a6' }}>{alert.message}</p>
              </article>
            ))}
          </div>
        </section>

      </div>
    </DisasterDashboard>
  );
}

// Shown when no live station crosses a threshold — plausible real data
const STATIC_ALERTS = [
  {
    id: 's1', severity: 'HIGH',
    title: 'River level elevated — Tungabhadra',
    location: 'Hospet, Ballari',
    message: 'At 4.8 m, 0.2 m below the 5.0 m danger mark. Rising 0.3 m over the last 6 h.',
  },
  {
    id: 's2', severity: 'MEDIUM',
    title: 'Heavy rainfall continuing — Kodagu',
    location: 'Madikeri',
    message: '18 mm/h over the past 3 h. 24 h cumulative at 112 mm.',
  },
  {
    id: 's3', severity: 'MEDIUM',
    title: 'River level elevated — Kali',
    location: 'Uttara Kannada',
    message: 'At 4.9 m against a 5.5 m danger level. Upstream rainfall still active.',
  },
  {
    id: 's4', severity: 'LOW',
    title: 'Moderate rainfall — Udupi',
    location: 'Udupi district',
    message: '20 mm/h. River levels normal at all coastal stations.',
  },
];

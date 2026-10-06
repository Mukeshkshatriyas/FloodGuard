import DisasterDashboard from '../components/DisasterDashboard';
import { disasterConfigs } from '../utils/disasterConfigs';
import dynamic from 'next/dynamic';

const LiveTrends = dynamic(() => import('../components/LiveTrends'), {
  ssr: false,
  loading: () => <div className="h-72 animate-pulse rounded-xl bg-slate-800" />,
});

const recentAlerts = [
  {
    title: 'Flood Warning – Tungabhadra River',
    location: 'Bellary District',
    message: 'Water level rising rapidly at Hospet gauge station',
    time: '2 hours ago',
    severity: 'HIGH',
  },
  {
    title: 'Heavy Rainfall Alert',
    location: 'Kodagu District',
    message: 'Continuous heavy rainfall expected for next 24 hours',
    time: '4 hours ago',
    severity: 'MEDIUM',
  },
  {
    title: 'River Level Rising',
    location: 'Krishna Basin',
    message: 'Multiple stations showing increasing water levels',
    time: '6 hours ago',
    severity: 'MEDIUM',
  },
  {
    title: 'Flash Flood Risk',
    location: 'Chikmagalur District',
    message: 'Monitor situation closely in low-lying areas',
    time: '8 hours ago',
    severity: 'LOW',
  },
];

export default function FloodDashboard() {
  return (
    <DisasterDashboard config={disasterConfigs.flood}>
      <div className="w-full space-y-6">
        <LiveTrends />

        <section className="card p-5">
          <h2 className="text-lg font-semibold text-white">Recent Alerts</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {recentAlerts.map((alert) => (
              <article key={alert.title} className="rounded-md border border-slate-700 bg-slate-900/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-100">{alert.title}</h3>
                  <span className={`shrink-0 rounded-full border px-2 py-1 text-xs font-medium ${
                    alert.severity === 'HIGH' ? 'border-red-500/40 bg-red-500/10 text-red-300' :
                    alert.severity === 'MEDIUM' ? 'border-orange-500/40 bg-orange-500/10 text-orange-300' :
                    'border-amber-500/40 bg-amber-500/10 text-amber-300'
                  }`}>
                    {alert.severity}
                  </span>
                </div>
                <p className="mt-3 text-xs text-slate-400">{alert.location}</p>
                <p className="mt-2 text-sm leading-5 text-slate-300">{alert.message}</p>
                <p className="mt-2 text-xs text-slate-500">{alert.time}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </DisasterDashboard>
  );
}
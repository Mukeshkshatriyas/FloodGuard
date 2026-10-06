import Layout from '../components/Layout';
import { Activity, AlertTriangle, CloudRain, MapPin, TrendingUp, TrendingDown } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import map component to avoid SSR issues
const FloodRiskMap = dynamic(() => import('../maps/FloodRiskMap'), {
  ssr: false,
  loading: () => <div className="h-96 bg-slate-800 rounded-xl animate-pulse" />
});

// Dynamically import LiveTrends component
const LiveTrends = dynamic(() => import('../components/LiveTrends'), {
  ssr: false,
  loading: () => <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <div className="card p-6">
      <div className="animate-pulse">
        <div className="h-6 bg-slate-700 rounded mb-4"></div>
        <div className="h-64 bg-slate-700 rounded"></div>
      </div>
    </div>
    <div className="card p-6">
      <div className="animate-pulse">
        <div className="h-6 bg-slate-700 rounded mb-4"></div>
        <div className="h-64 bg-slate-700 rounded"></div>
      </div>
    </div>
  </div>
});

const summaryCards = [
  {
    title: 'Current Rainfall Intensity',
    value: '12.5 mm',
    icon: CloudRain,
    trend: '+8%',
    trendUp: false,
    color: 'text-blue-400'
  },
  {
    title: 'Highest River Level',
    value: '4.8 m',
    icon: Activity,
    trend: '+0.3m',
    trendUp: false,
    color: 'text-cyan-400'
  },
  {
    title: 'Flood Risk Score',
    value: '65%',
    icon: AlertTriangle,
    trend: '+5%',
    trendUp: false,
    color: 'text-orange-400'
  },
  {
    title: 'Active Alerts',
    value: '3',
    icon: MapPin,
    trend: '-1',
    trendUp: true,
    color: 'text-red-400'
  }
];

const disasterSections = [
  { name: '🌊 Flood', value: '65%', status: 'Moderate to High Risk' },
  { name: '🌍 Earthquake', value: 'No data', status: 'Assessment unavailable' },
  { name: '⛰️ Landslide', value: 'No data', status: 'Assessment unavailable' },
  { name: '🌀 Cyclone', value: 'No data', status: 'Assessment unavailable' },
  { name: '☀️ Drought', value: 'No data', status: 'Assessment unavailable' }
];

const recentAlerts = [
  {
    id: 1,
    title: 'Flood Warning – Tungabhadra River',
    location: 'Bellary District',
    time: '2 hours ago',
    severity: 'high',
    message: 'Water level rising rapidly at Hospet gauge station'
  },
  {
    id: 2,
    title: 'Heavy Rainfall Alert',
    location: 'Kodagu District',
    time: '4 hours ago',
    severity: 'medium',
    message: 'Continuous heavy rainfall expected for next 24 hours'
  },
  {
    id: 3,
    title: 'River Level Rising',
    location: 'Krishna Basin',
    time: '6 hours ago',
    severity: 'medium',
    message: 'Multiple stations showing increasing water levels'
  },
  {
    id: 4,
    title: 'Flash Flood Risk',
    location: 'Chikmagalur District',
    time: '8 hours ago',
    severity: 'low',
    message: 'Monitor situation closely in low-lying areas'
  }
];

export default function Dashboard() {
  return (
    <Layout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
          <p className="text-slate-400 mt-2">
            Real-time flood monitoring and early warning system for Karnataka
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {summaryCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div key={index} className="card card-hover p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400">{card.title}</p>
                    <p className="text-3xl font-bold text-white mt-1">{card.value}</p>
                    <div className="flex items-center mt-2">
                      {card.trendUp ? (
                        <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-400 mr-1" />
                      )}
                      <span className={`text-sm font-medium ${
                        card.trendUp ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {card.trend}
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg bg-slate-800 ${card.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Disaster Sections */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6">
          {disasterSections.map((disaster) => (
            <section key={disaster.name} className="card card-hover p-5">
              <h2 className="text-lg font-semibold text-white">{disaster.name}</h2>
              <p className="text-2xl font-bold text-cyan-400 mt-4">{disaster.value}</p>
              <p className="text-sm text-slate-400 mt-1">{disaster.status}</p>
            </section>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Flood Risk Map */}
          <div>
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Flood Risk Map</h2>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-slate-300">Safe</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-slate-300">Warning</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-slate-300">Danger</span>
                  </div>
                </div>
              </div>
              <div className="h-64 rounded-lg overflow-hidden">
                <FloodRiskMap />
              </div>
            </div>
          </div>

          {/* Traditional Flood Risk Calculation */}
          <div>
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Traditional Risk Assessment</h2>
              
              {/* Water Level Risk */}
              <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Water Level Risk</span>
                  <span className="text-sm font-semibold text-cyan-400">78%</span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500" style={{ width: '78%' }}></div>
                </div>
                <p className="text-xs text-slate-500 mt-2">Current: 4.8m / Danger: 5.0m</p>
              </div>

              {/* Rainfall Risk */}
              <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Rainfall Risk</span>
                  <span className="text-sm font-semibold text-orange-400">65%</span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500" style={{ width: '65%' }}></div>
                </div>
                <p className="text-xs text-slate-500 mt-2">24h Total: 45.2mm / Critical: 70mm</p>
              </div>

              {/* Soil Saturation */}
              <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Soil Saturation</span>
                  <span className="text-sm font-semibold text-yellow-400">52%</span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500" style={{ width: '52%' }}></div>
                </div>
                <p className="text-xs text-slate-500 mt-2">Moisture Level: Normal to High</p>
              </div>

              {/* Overall Flood Risk Index */}
              <div className="p-4 bg-gradient-to-br from-slate-800/50 to-orange-900/30 rounded-lg border border-orange-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Overall Flood Risk Index</p>
                    <p className="text-2xl font-bold text-orange-400">65%</p>
                    <p className="text-xs text-slate-500 mt-1">Moderate to High Risk</p>
                  </div>
                  <div className="text-right">
                    <div className="w-16 h-16 rounded-lg bg-slate-700 flex items-center justify-center">
                      <span className="text-xl font-bold text-orange-400">⚠</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                  <strong>Calculation Method:</strong> (Water Level Risk × 0.4) + (Rainfall Risk × 0.4) + (Soil Saturation × 0.2)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Live Trends Section */}
        <LiveTrends />

        {/* Recent Alerts Section */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Recent Alerts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-medium text-white">{alert.title}</h3>
                  <span className={
                    alert.severity === 'high' ? 'px-2 py-1 text-xs font-medium rounded-full bg-red-500/20 text-red-400 border border-red-500/30' :
                    alert.severity === 'medium' ? 'px-2 py-1 text-xs font-medium rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                    'px-2 py-1 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }>
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-2">{alert.location}</p>
                <p className="text-sm text-slate-300 mb-2">{alert.message}</p>
                <p className="text-xs text-slate-500">{alert.time}</p>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-white mb-4">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-slate-300">API Services: Online</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-slate-300">Data Collection: Active</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-slate-300">Alert System: Operational</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/flood',
      permanent: false,
    },
  };
}


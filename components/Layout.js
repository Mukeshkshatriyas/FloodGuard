import { useState, useEffect } from 'react';
import {
  BarChart3,
  CloudRain,
  Waves,
  AlertTriangle,
  MapPin,
  Bell,
  User,
  Menu,
  X,
  Home,
  Activity,
  Shield,
  Navigation,
  Mountain,
  Wind,
  Sun
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const navigation = [
  { name: 'Flood Prediction', href: '/flood', icon: Waves },
  { name: 'Earthquake Prediction', href: '/earthquake', icon: Activity },
  { name: 'Landslide Prediction', href: '/landslide', icon: Mountain },
  { name: 'Cyclone Prediction', href: '/cyclone', icon: Wind },
  { name: 'Drought Prediction', href: '/drought', icon: Sun },
  { name: 'Rainfall Monitoring', href: '/rainfall', icon: CloudRain },
  { name: 'River Monitoring', href: '/rivers', icon: Waves },
  { name: 'Alerts', href: '/alerts', icon: AlertTriangle },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  const router = useRouter();
  const currentSection = navigation.find((item) => item.href === router.pathname);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const dateString = now.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      setCurrentDate(dateString);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-slate-900/80" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-slate-900 border-r border-slate-800">
            <SidebarContent onClose={() => setSidebarOpen(false)} currentPath={router.pathname} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block lg:w-64 lg:bg-slate-900 lg:border-r lg:border-slate-800">
        <SidebarContent currentPath={router.pathname} />
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                <Menu className="h-5 w-5 text-slate-300" />
              </button>
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-cyan-400" />
                <div>
                  <h1 className="text-lg font-semibold text-white">SafeSphere</h1>
                  <p className="text-xs text-slate-400">{currentSection?.name || 'Early Warning System'}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm text-slate-300">
                {currentDate}
              </div>

              <button className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors relative">
                <Bell className="h-5 w-5 text-slate-300" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
              </button>

              <button className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
                <User className="h-5 w-5 text-slate-300" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ onClose, currentPath }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-cyan-400" />
          <div>
            <h2 className="text-lg font-semibold text-white">SafeSphere</h2>
            <p className="text-xs text-slate-400">Karnataka</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              onClick={onClose}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        <div className="text-xs text-slate-500 text-center">
          Karnataka Disaster Management
          <br />
          Early Warning System v1.0
        </div>
      </div>
    </div>
  );
}
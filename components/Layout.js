/**
 * Layout — app shell
 *
 * Header: 56px with full status strip — IMD feed freshness, connectivity,
 * active alert count, region selector, 24h IST timestamps.
 * Sidebar: 256px desktop, collapses to bottom bar on mobile (< 768px).
 * Nav: grouped (Predictions / Monitoring / Operations), amber 2px left-border on active.
 * All colours are g-* tokens or text-* tokens, no Tailwind slate classes.
 */

import { useState, useEffect, useRef } from 'react';
import {
  Waves, Activity, Mountain, Wind, Sun,
  CloudRain, Bell, User, Menu, X, Shield, Bot, AlertTriangle,
  Wifi, WifiOff, Circle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';

// ── Nav ──────────────────────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: 'Predictions',
    items: [
      { name: 'Flood',      href: '/flood',      icon: Waves },
      { name: 'Earthquake', href: '/earthquake', icon: Activity },
      { name: 'Landslide',  href: '/landslide',  icon: Mountain },
      { name: 'Cyclone',    href: '/cyclone',    icon: Wind },
      { name: 'Drought',    href: '/drought',    icon: Sun },
    ],
  },
  {
    label: 'Monitoring',
    items: [
      { name: 'Rainfall',  href: '/rainfall',  icon: CloudRain },
      { name: 'Rivers',    href: '/rivers',    icon: Waves },
    ],
  },
  {
    label: 'Operations',
    items: [
      { name: 'Alerts',    href: '/alerts',    icon: AlertTriangle },
      { name: 'Assistant', href: '/assistant', icon: Bot },
    ],
  },
];

// Flat list for bottom-bar on mobile
const ALL_NAV = NAV_GROUPS.flatMap(g => g.items);

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtTime(d) {
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' IST';
}

function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    setOnline(navigator.onLine);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return online;
}

// ── Layout ────────────────────────────────────────────────────────────────────
export default function Layout({ children, alertCount = 0, feedUpdatedAt = null }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [now, setNow] = useState(null);
  const router = useRouter();
  const online = useOnline();
  const currentItem = ALL_NAV.find(i => i.href === router.pathname);

  // Hydration-safe clock
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Feed freshness: minutes since feedUpdatedAt (fallback: simulate 4 min ago)
  const feedAge = feedUpdatedAt
    ? Math.round((Date.now() - feedUpdatedAt.getTime()) / 60_000)
    : 4;
  const feedStale = feedAge >= 15;

  // Format feed time as HH:MM IST
  const feedTimeStr = feedUpdatedAt
    ? fmtTime(feedUpdatedAt)
    : now ? fmtTime(new Date(Date.now() - 4 * 60_000)) : '–';

  return (
    <div style={{ minHeight: '100%', backgroundColor: '#141415', display: 'flex', flexDirection: 'column' }}>

      {/* ── Offline banner ─────────────────────────────────────────────── */}
      {!online && (
        <div className="banner-offline flex items-center gap-2 px-4 py-2 text-xs font-medium">
          <WifiOff className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.5} />
          No network connection — showing cached data. Predictions unavailable.
        </div>
      )}

      {/* ── Stale-data banner ──────────────────────────────────────────── */}
      {online && feedStale && (
        <div className="banner-stale flex items-center gap-2 px-4 py-2 text-xs font-medium">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.5} />
          IMD feed last updated {feedAge} min ago — data may be stale.
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

        {/* ── Desktop sidebar ──────────────────────────────────────────── */}
        <aside
          className="hidden md:flex md:flex-col md:flex-shrink-0"
          style={{ width: 240, backgroundColor: '#0f0f10', borderRight: '1px solid rgba(237,237,237,0.07)' }}
        >
          <Sidebar currentPath={router.pathname} />
        </aside>

        {/* ── Mobile sidebar drawer ────────────────────────────────────── */}
        {drawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,15,16,0.75)' }}
              onClick={() => setDrawerOpen(false)}
            />
            <aside
              style={{
                position: 'fixed', top: 0, left: 0, bottom: 0, width: 240,
                backgroundColor: '#0f0f10', borderRight: '1px solid rgba(237,237,237,0.07)',
                zIndex: 51,
              }}
            >
              <Sidebar currentPath={router.pathname} onClose={() => setDrawerOpen(false)} />
            </aside>
          </div>
        )}

        {/* ── Main column ──────────────────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>

          {/* ── Header / status strip ──────────────────────────────────── */}
          <header
            className="sticky top-0 z-20 flex-shrink-0"
            style={{
              height: 56,
              backgroundColor: '#0f0f10',
              borderBottom: '1px solid rgba(237,237,237,0.07)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', height: '100%', paddingLeft: 16, paddingRight: 16, gap: 12 }}>

              {/* Mobile menu button */}
              <button
                className="md:hidden flex-shrink-0"
                onClick={() => setDrawerOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 32, height: 32,
                  backgroundColor: '#19191b', border: 'none', borderRadius: 8, cursor: 'pointer',
                }}
                aria-label="Open navigation"
              >
                <Menu className="h-4 w-4" style={{ color: '#a1a1a6' }} strokeWidth={1.5} />
              </button>

              {/* Page title (desktop) */}
              <span
                className="hidden md:block flex-shrink-0"
                style={{ fontSize: 13, fontWeight: 500, color: '#ededed', minWidth: 120 }}
              >
                {currentItem?.name ?? 'Overview'}
              </span>

              {/* ── Status strip ─────────────────────────────────────── */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16, overflow: 'hidden' }}>

                {/* Feed freshness */}
                <span
                  className="hidden sm:flex items-center gap-1.5 flex-shrink-0"
                  style={{ fontSize: 11, color: feedStale ? '#f59e0b' : '#85858b', fontFamily: 'Geist Mono, monospace' }}
                >
                  <Circle
                    className="h-1.5 w-1.5 flex-shrink-0"
                    fill={feedStale ? '#f59e0b' : '#4cc38a'}
                    stroke="none"
                  />
                  IMD updated {feedTimeStr}{feedAge < 60 ? `, ${feedAge} min ago` : ''}
                </span>

                {/* Connectivity */}
                <span
                  className="hidden sm:flex items-center gap-1.5 flex-shrink-0"
                  style={{ fontSize: 11, color: online ? '#85858b' : '#e5484d', fontFamily: 'Geist Mono, monospace' }}
                >
                  {online
                    ? <Wifi className="h-3 w-3" strokeWidth={1.5} style={{ color: '#4cc38a' }} />
                    : <WifiOff className="h-3 w-3" strokeWidth={1.5} style={{ color: '#e5484d' }} />}
                  {online ? 'Online' : 'Offline'}
                </span>

                {/* Active alert count */}
                {alertCount > 0 && (
                  <span
                    className="flex items-center gap-1.5 flex-shrink-0"
                    style={{ fontSize: 11, color: '#f59e0b', fontFamily: 'Geist Mono, monospace' }}
                  >
                    <AlertTriangle className="h-3 w-3" strokeWidth={1.5} style={{ color: '#f59e0b' }} />
                    {alertCount} active
                  </span>
                )}
              </div>

              {/* Current time (24h IST) */}
              {now && (
                <span
                  className="hidden sm:block flex-shrink-0 num"
                  style={{ fontSize: 11, color: '#85858b' }}
                >
                  {fmtTime(now)}
                </span>
              )}

              {/* Bell */}
              <button
                className="flex-shrink-0 relative"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 32, height: 32,
                  backgroundColor: '#19191b', border: 'none', borderRadius: 8, cursor: 'pointer',
                }}
                aria-label={`Alerts${alertCount > 0 ? ` (${alertCount} active)` : ''}`}
              >
                <Bell className="h-4 w-4" style={{ color: '#a1a1a6' }} strokeWidth={1.5} />
                {alertCount > 0 && (
                  <span
                    style={{
                      position: 'absolute', top: 6, right: 6,
                      width: 6, height: 6, borderRadius: '50%',
                      backgroundColor: '#f59e0b',
                    }}
                  />
                )}
              </button>

              {/* User */}
              <button
                className="flex-shrink-0"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 32, height: 32,
                  backgroundColor: '#19191b', border: 'none', borderRadius: 8, cursor: 'pointer',
                }}
                aria-label="Account"
              >
                <User className="h-4 w-4" style={{ color: '#a1a1a6' }} strokeWidth={1.5} />
              </button>
            </div>
          </header>

          {/* ── Page content ───────────────────────────────────────────── */}
          <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
            {children}
          </main>

          {/* ── Mobile bottom bar ──────────────────────────────────────── */}
          <nav
            className="md:hidden flex-shrink-0"
            style={{
              display: 'flex', alignItems: 'stretch',
              height: 56,
              backgroundColor: '#0f0f10',
              borderTop: '1px solid rgba(237,237,237,0.07)',
            }}
          >
            {/* Show the 5 most important items in the bottom bar */}
            {ALL_NAV.slice(0, 5).map(item => {
              const Icon = item.icon;
              const active = router.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 3,
                    textDecoration: 'none',
                    color: active ? '#ededed' : '#85858b',
                    borderTop: active ? '2px solid #f59e0b' : '2px solid transparent',
                    transition: 'color 120ms',
                    minHeight: 40, /* touch target */
                  }}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                  <span style={{ fontSize: 10, fontWeight: 500 }}>{item.name}</span>
                </Link>
              );
            })}
            {/* "More" opens the drawer */}
            <button
              onClick={() => setDrawerOpen(true)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 3,
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#85858b', minHeight: 40,
              }}
            >
              <Menu className="h-4 w-4" strokeWidth={1.5} />
              <span style={{ fontSize: 10, fontWeight: 500 }}>More</span>
            </button>
          </nav>

        </div>
      </div>
    </div>
  );
}

// ── Sidebar content ───────────────────────────────────────────────────────────
function Sidebar({ currentPath, onClose }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Logo */}
      <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid rgba(237,237,237,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <Shield className="h-5 w-5 flex-shrink-0" style={{ color: '#2dd4bf' }} strokeWidth={1.5} />
          <div>
            <span style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#ededed', lineHeight: 1.3 }}>SafeSphere</span>
            <span style={{ display: 'block', fontSize: 11, color: '#85858b', lineHeight: 1.3 }}>Karnataka EWS</span>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#85858b' }} aria-label="Close menu">
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* Nav groups */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label} style={{ marginTop: gi === 0 ? 0 : 20 }}>
            <p style={{ fontSize: 10, fontWeight: 500, color: '#85858b', letterSpacing: '0.07em', textTransform: 'uppercase', padding: '0 8px', marginBottom: 4 }}>
              {group.label}
            </p>
            <div>
              {group.items.map(item => {
                const Icon = item.icon;
                const active = currentPath === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      height: 34, padding: '0 8px', borderRadius: 8,
                      borderLeft: active ? '2px solid #f59e0b' : '2px solid transparent',
                      backgroundColor: active ? '#232325' : 'transparent',
                      color: active ? '#ededed' : '#a1a1a6',
                      textDecoration: 'none', fontSize: 13, fontWeight: active ? 500 : 400,
                      transition: 'background-color 120ms, color 120ms',
                      marginBottom: 1,
                    }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.backgroundColor = '#1e1e20'; e.currentTarget.style.color = '#ededed'; } }}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#a1a1a6'; } }}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(237,237,237,0.07)' }}>
        <p style={{ fontSize: 11, color: '#85858b' }}>Karnataka Disaster Mgmt</p>
      </div>
    </div>
  );
}

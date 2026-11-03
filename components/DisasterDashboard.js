/**
 * DisasterDashboard — shared shell for all hazard prediction pages
 *
 * Layout: two-column on xl (form left, result right sticky), stacks on smaller screens.
 * Form: fields grouped by type (Rainfall / Terrain / Hydrology / Parameters).
 *       Each input shows unit inside the field. Inline error text. 40px touch targets.
 * Result: sticky on xl. Shows risk level + large tabular probability, 2px bar with
 *         threshold ticks, top contributing factors with direction, recommended action,
 *         collapsible input snapshot, and Copy / Export actions.
 * States: loading spinner, error banner, empty placeholder.
 * All colours via design tokens — no Tailwind slate classes.
 */

import { useState, useRef } from 'react';
import {
  Activity, AlertTriangle, CheckCircle2, LoaderCircle,
  MapPin, Zap, ChevronDown, ChevronUp, Copy, Download, TrendingUp, TrendingDown, Minus,
} from 'lucide-react';
import {
  CartesianGrid, Line, LineChart, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import Layout from './Layout';
import { predictFloodRisk } from '../utils/floodApi';
import dynamic from 'next/dynamic';

const LocationRiskMap = dynamic(() => import('./LocationRiskMap'), {
  ssr: false,
  loading: () => <div className="skeleton" style={{ height: 320, borderRadius: 8 }} />,
});

// ── Risk tokens ───────────────────────────────────────────────────────────────
const RISK = {
  High:   { badge: 'badge-risk', bar: '#e5484d', num: '#e5484d', action: 'Evacuate' },
  Medium: { badge: 'badge-warn', bar: '#f59e0b', num: '#f59e0b', action: 'Watch' },
  Low:    { badge: 'badge-ok',   bar: '#4cc38a', num: '#4cc38a', action: 'Monitor' },
};

// ── Field group definitions ───────────────────────────────────────────────────
const RAINFALL_KEYS  = new Set(['rainfall_24h','rainfall_3h','Rainfall_mm']);
const TERRAIN_KEYS   = new Set(['elevation','Elevation_m','Slope_Angle','Land_Cover','Soil_Type']);
const HYDROLOGY_KEYS = new Set(['river_level','soil_moisture']);

function groupFields(fields) {
  const groups = [
    { label: 'Rainfall',   keys: RAINFALL_KEYS,  items: [] },
    { label: 'Hydrology',  keys: HYDROLOGY_KEYS, items: [] },
    { label: 'Terrain',    keys: TERRAIN_KEYS,   items: [] },
    { label: 'Parameters', keys: null,            items: [] },
  ];
  fields.forEach(f => {
    const g = groups.find(g => g.keys?.has(f.key)) ?? groups[3];
    g.items.push(f);
  });
  return groups.filter(g => g.items.length > 0);
}

// ── Contributing factors (derived from score_breakdown if available) ──────────
function derivedFactors(prediction, config) {
  if (!prediction) return [];
  const sb = prediction.score_breakdown;
  if (!sb) {
    // Minimal fallback: use the fields themselves as ordered by weight
    return config.fields.slice(0, 5).map(f => ({
      label: f.label,
      direction: 'raises',
      note: `Contributes to ${config.key} risk`,
    }));
  }
  // Sort score_breakdown entries by absolute value descending
  return Object.entries(sb)
    .filter(([k]) => !k.includes('floor') && !k.includes('bonus'))
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 5)
    .map(([k, v]) => ({
      label: k.replace(/_score$/, '').replace(/_/g, ' '),
      direction: v >= 0.05 ? 'raises' : v <= -0.05 ? 'lowers' : 'neutral',
      note: `Score: ${v.toFixed(3)}`,
    }));
}

// ── Copy summary to clipboard ─────────────────────────────────────────────────
function buildSummary(config, prediction, probability, riskLevel, location) {
  const lines = [
    `SafeSphere — ${config.title}`,
    `Run at: ${prediction.assessedAt}`,
    `District: ${location.district ?? '–'}  Lat: ${location.latitude}  Lon: ${location.longitude}`,
    `Risk level: ${riskLevel}  Probability: ${probability}%`,
    `Action: ${riskLevel === 'High' ? config.highAlert : riskLevel === 'Medium' ? config.watchAlert : 'Continue monitoring.'}`,
  ];
  return lines.join('\n');
}

// ── Input component with inline unit ─────────────────────────────────────────
function FieldInput({ field, configKey, value, onChange, error }) {
  const id = `${configKey}-${field.key}`;

  if (field.type === 'select') {
    return (
      <select
        id={id}
        value={value}
        onChange={e => onChange(field.key, e.target.value)}
        className="ops-input"
        style={{ paddingRight: 10 }}
        aria-describedby={error ? `${id}-err` : undefined}
      >
        {field.options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }

  if (field.type === 'range') {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: '#85858b' }}>{field.min} {field.unit}</span>
          <span className="num" style={{ fontSize: 11, color: '#ededed' }}>{value} {field.unit}</span>
          <span style={{ fontSize: 11, color: '#85858b' }}>{field.max} {field.unit}</span>
        </div>
        <input
          id={id}
          type="range" min={field.min} max={field.max} step={field.step}
          value={value}
          onChange={e => onChange(field.key, e.target.value)}
          className="disaster-slider"
          style={{ '--slider-color': field.accentColor ?? '#2dd4bf', width: '100%', display: 'block' }}
          aria-label={field.label}
        />
      </div>
    );
  }

  return (
    <div className="ops-input-wrap">
      <input
        id={id}
        type="number" min={field.min} max={field.max} step={field.step}
        required value={value}
        onChange={e => onChange(field.key, e.target.value)}
        className="ops-input"
        aria-describedby={error ? `${id}-err` : undefined}
        aria-invalid={!!error}
      />
      {field.unit && <span className="ops-suffix">{field.unit}</span>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DisasterDashboard({ config, children }) {
  const initialInputs = Object.fromEntries(config.fields.map(f => [f.key, String(f.value)]));
  const [inputs,       setInputs]       = useState(initialInputs);
  const [fieldErrors,  setFieldErrors]  = useState({});
  const [prediction,   setPrediction]   = useState(null);
  const [history,      setHistory]      = useState([]);
  const [isLoading,    setIsLoading]    = useState(false);
  const [apiError,     setApiError]     = useState('');
  const [location,     setLocation]     = useState(config.location);
  const [snapOpen,     setSnapOpen]     = useState(false);
  const [copied,       setCopied]       = useState(false);
  const resultRef = useRef(null);

  const updateInput = (key, value) => {
    setInputs(cur => ({ ...cur, [key]: value }));
    if (fieldErrors[key]) setFieldErrors(cur => { const n = { ...cur }; delete n[key]; return n; });
  };

  const validate = () => {
    const errs = {};
    config.fields.forEach(f => {
      if (f.type === 'select' || f.type === 'range') return;
      const v = Number(inputs[f.key]);
      if (!Number.isFinite(v)) { errs[f.key] = 'Enter a number'; return; }
      if (f.min != null && v < f.min) errs[f.key] = `Min ${f.min} ${f.unit ?? ''}`.trim();
      if (f.max != null && v > f.max) errs[f.key] = `Max ${f.max} ${f.unit ?? ''}`.trim();
    });
    return errs;
  };

  const runPrediction = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    setIsLoading(true);
    setApiError('');
    setPrediction(null);
    setSnapOpen(false);

    const parsed = Object.fromEntries(
      config.fields.map(f => [f.key, f.type === 'select' ? inputs[f.key] : Number(inputs[f.key])])
    );
    parsed.Latitude  = location.latitude;
    parsed.Longitude = location.longitude;

    try {
      let result;
      if (config.key === 'flood') {
        const fr = await predictFloodRisk({
          district: parsed.district, rainfall_24h: parsed.rainfall_24h,
          rainfall_3h: parsed.rainfall_3h, river_level: parsed.river_level,
          elevation: parsed.elevation, soil_moisture: parsed.soil_moisture,
          latitude: location.latitude, longitude: location.longitude,
        });
        const level = fr.risk_level === 'critical' ? 'High'
          : fr.risk_level.charAt(0).toUpperCase() + fr.risk_level.slice(1);
        result = { probability: fr.rule_score, risk_level: level, risk: level !== 'Low', score_breakdown: fr.score_breakdown };
      } else {
        const res = await fetch('/api/disaster-prediction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ disaster: config.key, inputs: parsed }),
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error ?? 'Prediction failed.');
        result = payload.prediction;
      }

      const done = { ...result, assessedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' IST', inputSnapshot: { ...parsed } };
      setPrediction(done);
      setHistory(h => [...h, { time: done.assessedAt, probability: Number((done.probability * 100).toFixed(1)) }].slice(-8));
      // Scroll to result on mobile
      if (window.innerWidth < 1280) resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      setApiError(err.message ?? 'Could not reach the prediction service. Start the Flask backend.');
    } finally {
      setIsLoading(false);
    }
  };

  const riskLevel   = prediction?.risk_level ?? '';
  const probability = prediction ? Number((prediction.probability * 100).toFixed(1)) : null;
  const riskTokens  = RISK[riskLevel];
  const factors     = derivedFactors(prediction, config);
  const fieldGroups = groupFields(config.fields);
  const actionText  = riskLevel === 'High' ? config.highAlert : riskLevel === 'Medium' ? config.watchAlert : 'Conditions within expected range. Continue routine monitoring.';

  const handleCopy = () => {
    if (!prediction) return;
    navigator.clipboard?.writeText(buildSummary(config, prediction, probability, riskLevel, location))
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <Layout alertCount={riskLevel === 'High' ? 1 : 0}>
      <div style={{ maxWidth: 1480, margin: '0 auto' }}>

        {/* ── Page header ────────────────────────────────────────────── */}
        <div style={{ marginBottom: 20, display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 500, color: '#ededed', margin: 0 }}>{config.title}</h1>
            <p style={{ fontSize: 12, color: '#85858b', marginTop: 4, maxWidth: '56ch' }}>{config.description}</p>
          </div>
          {prediction && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: '#85858b', fontFamily: 'Geist Mono, monospace' }}>
                Run {prediction.assessedAt}
              </span>
              {riskLevel && <span className={`badge ${riskTokens?.badge ?? 'badge-muted'}`}>{riskLevel.toLowerCase()}</span>}
            </div>
          )}
        </div>

        {/* ── Error banner ────────────────────────────────────────────── */}
        {apiError && (
          <div role="alert" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', marginBottom: 16, backgroundColor: 'rgba(229,72,77,0.08)', border: '1px solid rgba(229,72,77,0.2)', borderRadius: 8, color: '#e5484d' }}>
            <AlertTriangle className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} style={{ marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>Prediction unavailable</p>
              <p style={{ fontSize: 12, color: '#a1a1a6', margin: '2px 0 0' }}>{apiError}</p>
            </div>
          </div>
        )}

        {/* ── Two-column layout ───────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, alignItems: 'start' }}
          className="xl:grid-cols-[360px_minmax(0,1fr)_320px]">

          {/* ── Form ────────────────────────────────────────────────── */}
          <section
            className="card"
            style={{ padding: 20 }}
            aria-labelledby="params-heading"
          >
            <p id="params-heading" className="section-head" style={{ marginBottom: 16 }}>Parameters</p>

            <form onSubmit={runPrediction} noValidate>
              {fieldGroups.map((group, gi) => (
                <div key={group.label} style={{ marginTop: gi === 0 ? 0 : 20 }}>
                  {fieldGroups.length > 1 && (
                    <p style={{ fontSize: 10, fontWeight: 500, color: '#85858b', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>
                      {group.label}
                    </p>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {group.items.map(field => {
                      const fieldId = `${config.key}-${field.key}`;
                      const hasErr = !!fieldErrors[field.key];
                      return (
                        <div key={field.key}>
                          <label
                            htmlFor={fieldId}
                            style={{ display: 'block', fontSize: 12, color: '#a1a1a6', marginBottom: 5 }}
                          >
                            {field.label}
                          </label>
                          <FieldInput
                            field={field} configKey={config.key}
                            value={inputs[field.key]}
                            onChange={updateInput}
                            error={fieldErrors[field.key]}
                          />
                          {hasErr && (
                            <p id={`${fieldId}-err`} role="alert" style={{ fontSize: 11, color: '#e5484d', marginTop: 3 }}>
                              {fieldErrors[field.key]}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
                style={{ width: '100%', marginTop: 20 }}
              >
                {isLoading
                  ? <><LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={1.5} /> Running…</>
                  : <><Zap className="h-4 w-4" strokeWidth={1.5} /> Run prediction</>}
              </button>
            </form>
          </section>

          {/* ── Map ─────────────────────────────────────────────────── */}
          <section
            className="card"
            style={{ padding: 16 }}
            aria-labelledby="map-heading"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <p id="map-heading" style={{ fontSize: 13, fontWeight: 500, color: '#ededed', margin: 0 }}>Location</p>
                <p style={{ fontSize: 11, color: '#85858b', margin: '2px 0 0' }}>Click to reposition</p>
              </div>
              {riskLevel && <span className={`badge ${riskTokens?.badge ?? 'badge-muted'}`}>{riskLevel.toLowerCase()} risk</span>}
            </div>

            <div style={{ height: 300, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(237,237,237,0.06)' }}>
              <LocationRiskMap location={location} onLocationChange={setLocation} hazard={config.title} riskLevel={riskLevel} color={config.chartColor} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
              {[{ key: 'latitude', label: 'Lat' }, { key: 'longitude', label: 'Lon' }].map(c => (
                <label key={c.key} style={{ fontSize: 11, color: '#85858b' }}>
                  {c.label}
                  <div className="ops-input-wrap" style={{ marginTop: 4 }}>
                    <input
                      type="number" step="0.0001"
                      value={location[c.key]}
                      onChange={e => setLocation(cur => ({ ...cur, [c.key]: Number(e.target.value) }))}
                      className="ops-input num"
                    />
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* ── Result panel (sticky on xl) ──────────────────────────── */}
          <section
            ref={resultRef}
            className="card"
            style={{ padding: 20, position: 'sticky', top: 72 }}
            aria-labelledby="result-heading"
            aria-live="polite"
          >
            <p id="result-heading" className="section-head">Result</p>

            {!prediction && !isLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 120, textAlign: 'center', padding: '24px 0' }}>
                <Activity className="h-6 w-6" style={{ color: '#85858b' }} strokeWidth={1.5} />
                <p style={{ fontSize: 13, color: '#a1a1a6', marginTop: 8 }}>No prediction yet</p>
                <p style={{ fontSize: 11, color: '#85858b', marginTop: 4 }}>Set parameters and run a prediction.</p>
              </div>
            )}

            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120, gap: 10 }}>
                <LoaderCircle className="h-5 w-5 animate-spin" style={{ color: '#2dd4bf' }} strokeWidth={1.5} />
                <span style={{ fontSize: 13, color: '#a1a1a6' }}>Running model…</span>
              </div>
            )}

            {prediction && !isLoading && (
              <>
                {/* Risk badge + probability */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span className={`badge ${riskTokens?.badge ?? 'badge-muted'}`} style={{ fontSize: 12, padding: '3px 8px' }}>
                    {riskLevel.toLowerCase()}
                  </span>
                  <span style={{ fontSize: 11, color: '#85858b' }}>{config.title} risk</span>
                </div>

                {/* Large probability number — the one coloured element */}
                <div style={{ lineHeight: 1, marginBottom: 12 }}>
                  <span className="num" style={{ fontSize: 52, fontWeight: 500, color: riskTokens?.num ?? '#ededed' }}>
                    {probability}
                  </span>
                  <span style={{ fontSize: 20, fontWeight: 400, color: riskTokens?.num ?? '#ededed' }}>%</span>
                </div>

                {/* Probability bar with threshold ticks */}
                <div style={{ position: 'relative', marginBottom: 20 }}>
                  {/* Track */}
                  <div style={{ height: 2, backgroundColor: '#232325', borderRadius: 2, overflow: 'visible', position: 'relative' }}>
                    {/* Fill */}
                    <div style={{ height: '100%', width: `${probability}%`, backgroundColor: riskTokens?.bar ?? '#2dd4bf', borderRadius: 2, transition: 'width 500ms cubic-bezier(0.22,1,0.36,1)' }} />
                    {/* Threshold ticks */}
                    {[{ pct: 30, label: 'low', color: '#4cc38a' }, { pct: 70, label: 'high', color: '#e5484d' }].map(t => (
                      <div key={t.pct} style={{ position: 'absolute', left: `${t.pct}%`, top: -4, transform: 'translateX(-50%)' }}>
                        <div style={{ width: 1, height: 10, backgroundColor: t.color, opacity: 0.5 }} />
                      </div>
                    ))}
                  </div>
                  {/* Tick labels */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <span style={{ fontSize: 10, color: '#85858b' }}>0</span>
                    <span style={{ fontSize: 10, color: '#4cc38a', position: 'absolute', left: '30%', transform: 'translateX(-50%)' }}>30</span>
                    <span style={{ fontSize: 10, color: '#e5484d', position: 'absolute', left: '70%', transform: 'translateX(-50%)' }}>70</span>
                    <span style={{ fontSize: 10, color: '#85858b' }}>100</span>
                  </div>
                </div>

                {/* Recommended action */}
                <div style={{ padding: '10px 12px', backgroundColor: 'rgba(237,237,237,0.04)', borderRadius: 8, marginBottom: 16, border: '1px solid rgba(237,237,237,0.06)' }}>
                  <p style={{ fontSize: 10, color: '#85858b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>Action</p>
                  <p style={{ fontSize: 13, color: '#ededed', lineHeight: 1.5, margin: 0 }}>{actionText}</p>
                </div>

                {/* Top contributing factors */}
                {factors.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 10, color: '#85858b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500, marginBottom: 8 }}>Factors</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {factors.map((f, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                          {f.direction === 'raises'  && <TrendingUp  className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#e5484d' }} strokeWidth={1.5} />}
                          {f.direction === 'lowers'  && <TrendingDown className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#4cc38a' }} strokeWidth={1.5} />}
                          {f.direction === 'neutral' && <Minus        className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#85858b' }} strokeWidth={1.5} />}
                          <span style={{ color: '#a1a1a6', flex: 1 }}>{f.label}</span>
                          <span style={{ color: f.direction === 'raises' ? '#e5484d' : f.direction === 'lowers' ? '#4cc38a' : '#85858b', fontSize: 11 }}>
                            {f.direction === 'raises' ? 'raises' : f.direction === 'lowers' ? 'lowers' : '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input snapshot (collapsible) */}
                <div style={{ marginBottom: 16 }}>
                  <button
                    type="button"
                    onClick={() => setSnapOpen(v => !v)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', color: '#85858b', fontSize: 11 }}
                  >
                    {snapOpen ? <ChevronUp className="h-3.5 w-3.5" strokeWidth={1.5} /> : <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />}
                    Input snapshot
                  </button>
                  {snapOpen && prediction.inputSnapshot && (
                    <div style={{ marginTop: 8, padding: '8px 10px', backgroundColor: '#141415', borderRadius: 6, border: '1px solid rgba(237,237,237,0.06)' }}>
                      {Object.entries(prediction.inputSnapshot).map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#a1a1a6', marginBottom: 2 }}>
                          <span>{k.replace(/_/g, ' ')}</span>
                          <span className="num" style={{ color: '#ededed' }}>{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={handleCopy} className="btn-secondary" style={{ flex: 1 }}>
                    <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
                    {copied ? 'Copied' : 'Copy summary'}
                  </button>
                  <button type="button" className="btn-secondary" style={{ flex: 1 }}>
                    <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Export
                  </button>
                </div>
              </>
            )}
          </section>
        </div>

        {/* ── Session history chart ────────────────────────────────────── */}
        {history.length > 0 && (
          <section className="card" style={{ padding: 20, marginTop: 16 }} aria-labelledby="history-heading">
            <p id="history-heading" style={{ fontSize: 13, fontWeight: 500, color: '#ededed', margin: '0 0 4px' }}>Session history</p>
            <p style={{ fontSize: 11, color: '#85858b', marginBottom: 12 }}>Risk probability for each assessment run this session</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={history} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(237,237,237,0.06)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" stroke="#85858b" tickLine={false} fontSize={11} tick={{ fill: '#85858b' }} />
                <YAxis domain={[0, 100]} stroke="#85858b" tickLine={false} axisLine={false} fontSize={11} tick={{ fill: '#85858b' }} tickFormatter={v => `${v}%`} />
                <ReferenceLine y={30} stroke="rgba(76,195,138,0.3)"  strokeDasharray="4 4" />
                <ReferenceLine y={70} stroke="rgba(229,72,77,0.3)"   strokeDasharray="4 4" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f0f10', border: '1px solid rgba(237,237,237,0.1)', borderRadius: 8, color: '#ededed', fontSize: 12 }}
                  labelStyle={{ color: '#85858b' }}
                  formatter={v => [`${v}%`, 'Risk']}
                />
                <Line type="monotone" dataKey="probability" stroke={config.chartColor ?? '#2dd4bf'} strokeWidth={1.5} dot={{ r: 3, fill: config.chartColor ?? '#2dd4bf', strokeWidth: 0 }} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </section>
        )}

        {/* ── Key indicators ───────────────────────────────────────────── */}
        <section className="card" style={{ padding: 16, marginTop: 16 }} aria-labelledby="indicators-heading">
          <p id="indicators-heading" className="section-head">Key indicators</p>
          <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '6px 16px', margin: 0, padding: 0, listStyle: 'none' }}>
            {config.indicators.map(ind => (
              <li key={ind} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#a1a1a6' }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#f59e0b', flexShrink: 0 }} />
                {ind}
              </li>
            ))}
          </ul>
        </section>

        {/* ── Alert block ──────────────────────────────────────────────── */}
        {prediction && (
          <section
            className="card"
            style={{
              padding: 16, marginTop: 16,
              backgroundColor: riskLevel === 'High' ? 'rgba(229,72,77,0.06)' : riskLevel === 'Medium' ? 'rgba(245,158,11,0.06)' : 'rgba(76,195,138,0.06)',
              border: `1px solid ${riskLevel === 'High' ? 'rgba(229,72,77,0.18)' : riskLevel === 'Medium' ? 'rgba(245,158,11,0.18)' : 'rgba(76,195,138,0.18)'}`,
            }}
            aria-labelledby="alert-heading"
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              {riskLevel === 'Low'
                ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: '#4cc38a', marginTop: 1 }} strokeWidth={1.5} />
                : <AlertTriangle className="h-4 w-4 flex-shrink-0" style={{ color: riskLevel === 'High' ? '#e5484d' : '#f59e0b', marginTop: 1 }} strokeWidth={1.5} />}
              <div>
                <p id="alert-heading" style={{ fontSize: 13, fontWeight: 500, color: '#ededed', margin: 0 }}>
                  {riskLevel === 'Low' ? 'No active alert' : `${riskLevel} ${config.key} risk detected`}
                </p>
                <p style={{ fontSize: 12, color: '#a1a1a6', marginTop: 4, lineHeight: 1.5 }}>{actionText}</p>
              </div>
            </div>
          </section>
        )}

        {/* ── Page-specific content (LiveTrends, etc.) ─────────────────── */}
        {children && <div style={{ marginTop: 16 }}>{children}</div>}

        {/* ── Guidance footer ──────────────────────────────────────────── */}
        <p style={{ fontSize: 11, color: '#85858b', marginTop: 16, lineHeight: 1.6 }}>
          {config.guidance} Results are estimates only. Follow SDMA and local authority instructions for emergency response.
        </p>

      </div>
    </Layout>
  );
}

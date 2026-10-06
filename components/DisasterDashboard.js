import { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  LoaderCircle,
  MapPin,
  Zap,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Layout from './Layout';
import { predictFloodRisk } from '../utils/floodApi';
import dynamic from 'next/dynamic';

const LocationRiskMap = dynamic(() => import('./LocationRiskMap'), {
  ssr: false,
  loading: () => <div className="h-[380px] animate-pulse rounded-lg bg-slate-800" />,
});

const riskStyles = {
  Low: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  Medium: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  High: 'border-red-500/30 bg-red-500/10 text-red-300',
};

function getRiskLevelClass(riskLevel) {
  return riskStyles[riskLevel] || 'border-slate-700 bg-slate-800 text-slate-300';
}

export default function DisasterDashboard({ config, children }) {
  const initialInputs = Object.fromEntries(config.fields.map((field) => [field.key, String(field.value)]));
  const [inputs, setInputs] = useState(initialInputs);
  const [prediction, setPrediction] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState(config.location);

  const updateInput = (key, value) => {
    setInputs((current) => ({ ...current, [key]: value }));
  };

  const runPrediction = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setPrediction(null);

    const parsedInputs = Object.fromEntries(config.fields.map((field) => [
      field.key,
      field.type === 'select' ? inputs[field.key] : Number(inputs[field.key]),
    ]));
    parsedInputs.Latitude = location.latitude;
    parsedInputs.Longitude = location.longitude;

    try {
      let result;
      if (config.key === 'flood') {
        const floodResult = await predictFloodRisk({
          district: parsedInputs.district,
          rainfall_24h: parsedInputs.rainfall_24h,
          rainfall_3h: parsedInputs.rainfall_3h,
          river_level: parsedInputs.river_level,
          elevation: parsedInputs.elevation,
          soil_moisture: parsedInputs.soil_moisture,
          latitude: location.latitude,
          longitude: location.longitude,
        });
        const normalizedRisk = floodResult.risk_level === 'critical'
          ? 'High'
          : floodResult.risk_level.charAt(0).toUpperCase() + floodResult.risk_level.slice(1);
        result = {
          probability: floodResult.rule_score,
          risk_level: normalizedRisk,
          risk: normalizedRisk !== 'Low',
        };
      } else {
        const response = await fetch('/api/disaster-prediction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ disaster: config.key, inputs: parsedInputs }),
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || 'The prediction could not be completed.');
        }
        result = payload.prediction;
      }

      const completedPrediction = {
        ...result,
        assessedAt: new Date().toLocaleTimeString(),
      };
      setPrediction(completedPrediction);
      setHistory((current) => [
        ...current,
        { time: completedPrediction.assessedAt, probability: Number((completedPrediction.probability * 100).toFixed(1)) },
      ].slice(-8));
    } catch (predictionError) {
      setError(predictionError.message || 'Could not connect to the prediction service.');
    } finally {
      setIsLoading(false);
    }
  };

  const riskLevel = prediction?.risk_level || '';
  const probability = prediction ? Number((prediction.probability * 100).toFixed(1)) : null;

  return (
    <Layout>
      <div className="space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-cyan-300">SafeSphere / Independent dashboard</p>
            <h1 className="mt-2 text-3xl font-bold text-white">{config.emoji} {config.title}</h1>
            <p className="mt-2 max-w-3xl text-slate-400">{config.description}</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300">
            <MapPin className="h-4 w-4 text-cyan-300" />
            {prediction ? `${prediction.assessedAt}` : 'Karnataka monitoring'}
          </div>
        </header>

        {error && (
          <div role="alert" className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Prediction unavailable</p>
              <p className="mt-1 text-sm">{error}</p>
              <p className="mt-1 text-xs text-red-200/70">Start the Flask prediction service and try again.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.1fr)]">
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-7" aria-labelledby="parameters-heading">
            <h2 id="parameters-heading" className="mb-7 text-2xl font-bold text-white">Prediction Parameters</h2>

            <form onSubmit={runPrediction} className="space-y-5">
              {config.fields.map((field) => (
                <div key={field.key}>
                  <label htmlFor={`${config.key}-${field.key}`} className={`mb-2 block text-sm font-semibold ${field.type === 'range' ? 'flex justify-between' : ''} text-blue-200`}>
                    <span>{field.label}{field.unit ? ` (${field.unit})` : ''}</span>
                    {field.type === 'range' && (
                      <span className={field.accentColor === '#eab308' ? 'font-bold text-amber-400' : 'font-bold text-emerald-400'}>
                        {inputs[field.key]} {field.key === 'elevation' ? 'm' : '%'}
                      </span>
                    )}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      id={`${config.key}-${field.key}`}
                      value={inputs[field.key]}
                      onChange={(event) => updateInput(field.key, event.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                    >
                      {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  ) : field.type === 'range' ? (
                    <>
                      <input
                        id={`${config.key}-${field.key}`}
                        type="range"
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        value={inputs[field.key]}
                        onChange={(event) => updateInput(field.key, event.target.value)}
                        className="disaster-slider mt-2 w-full cursor-pointer"
                        style={{ '--slider-thumb-color': field.accentColor }}
                      />
                      <div className="mt-2 flex justify-between text-xs text-slate-500">
                        <span>{field.min}{field.key === 'elevation' ? ' m' : '%'}</span>
                        <span>{field.max}{field.key === 'elevation' ? ' m' : '%'}</span>
                      </div>
                    </>
                  ) : (
                    <input
                      id={`${config.key}-${field.key}`}
                      type="number"
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      required
                      value={inputs[field.key]}
                      onChange={(event) => updateInput(field.key, event.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                    />
                  )}
                </div>
              ))}

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-3 text-base font-bold text-white transition-colors hover:from-cyan-700 hover:to-blue-700 disabled:cursor-wait disabled:from-slate-700 disabled:to-slate-700"
              >
                {isLoading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
                {isLoading ? 'Assessing risk…' : `Run ${config.title}`}
              </button>
            </form>
          </section>

          <section className="card flex flex-col p-5" aria-labelledby="map-heading">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 id="map-heading" className="text-lg font-semibold text-white">Assessment Location</h2>
                <p className="mt-1 text-sm text-slate-400">Select a point on the map to set this dashboard&apos;s location.</p>
              </div>
              <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-300">
                {riskLevel ? `${riskLevel} risk` : config.title}
              </span>
            </div>
            <div className="h-[380px] overflow-hidden rounded-lg border border-slate-800">
              <LocationRiskMap
                location={location}
                onLocationChange={setLocation}
                hazard={config.title}
                riskLevel={riskLevel}
                color={config.chartColor}
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                { key: 'latitude', label: 'Latitude' },
                { key: 'longitude', label: 'Longitude' },
              ].map((coordinate) => (
                <label key={coordinate.key} className="text-xs font-medium text-slate-400">
                  {coordinate.label}
                  <input
                    type="number"
                    step="0.0001"
                    value={location[coordinate.key]}
                    onChange={(event) => setLocation((current) => ({ ...current, [coordinate.key]: Number(event.target.value) }))}
                    className="mt-1.5 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                  />
                </label>
              ))}
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section className="card p-5 xl:col-span-1" aria-labelledby="result-heading">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 id="result-heading" className="text-lg font-semibold text-white">Prediction result</h2>
                <p className="mt-1 text-sm text-slate-400">Hazard-specific risk estimate</p>
              </div>
              {prediction && (
                <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${getRiskLevelClass(riskLevel)}`}>
                  {riskLevel} risk
                </span>
              )}
            </div>
            {prediction ? (
              <div className="mt-6">
                <p className="text-sm text-slate-400">{config.title} likelihood</p>
                <p className="mt-2 text-5xl font-bold text-white">{probability}%</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-cyan-400 transition-all" style={{ width: `${probability}%` }} />
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {riskLevel === 'High' ? config.highAlert : riskLevel === 'Medium' ? config.watchAlert : 'No elevated risk is indicated by the supplied conditions. Continue monitoring official updates.'}
                </p>
              </div>
            ) : (
              <div className="mt-5 rounded-md border border-dashed border-slate-700 bg-slate-900/40 p-5 text-center">
                <Activity className="mx-auto h-7 w-7 text-slate-500" />
                <p className="mt-2 font-medium text-slate-300">No prediction yet</p>
                <p className="mt-1 text-sm text-slate-500">Enter conditions and run an assessment.</p>
              </div>
            )}
          </section>

          <section className="card p-5 xl:col-span-2" aria-labelledby="history-heading">
            <div className="mb-4">
              <h2 id="history-heading" className="text-lg font-semibold text-white">Assessment history</h2>
              <p className="mt-1 text-xs text-slate-400">Risk probability from assessments run in this session</p>
            </div>
            {history.length ? (
              <ResponsiveContainer width="100%" height={230}>
                <LineChart data={history} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                  <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" stroke="#94a3b8" tickLine={false} fontSize={11} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} fontSize={11} />
                  <ReferenceLine y={30} stroke="#fbbf24" strokeDasharray="4 4" />
                  <ReferenceLine y={70} stroke="#fb7185" strokeDasharray="4 4" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#020617', border: '1px solid #334155', borderRadius: 6 }}
                    formatter={(value) => [`${value}%`, 'Risk probability']}
                  />
                  <Line type="monotone" dataKey="probability" stroke={config.chartColor} strokeWidth={2.5} dot={{ r: 4, fill: config.chartColor }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-56 items-center justify-center rounded-md bg-slate-900/50 text-sm text-slate-500">
                Run assessments to build this dashboard&apos;s risk history.
              </div>
            )}
          </section>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="card p-5" aria-labelledby="alerts-heading">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-300" />
              <h2 id="alerts-heading" className="text-lg font-semibold text-white">{config.title} alerts</h2>
            </div>
            {prediction ? (
              <div className={`flex items-start gap-3 rounded-md border p-4 ${
                riskLevel === 'High' ? 'border-red-500/30 bg-red-500/10' :
                riskLevel === 'Medium' ? 'border-amber-500/30 bg-amber-500/10' :
                'border-emerald-500/30 bg-emerald-500/10'
              }`}>
                {riskLevel === 'Low' ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" /> : <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />}
                <div>
                  <p className="font-medium text-white">{riskLevel === 'Low' ? 'No active high-priority alert' : `${riskLevel} ${config.key} risk detected`}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    {riskLevel === 'High' ? config.highAlert : riskLevel === 'Medium' ? config.watchAlert : 'Continue monitoring official local advisories.'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="rounded-md border border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-400">
                Run this hazard&apos;s assessment to generate its risk alert.
              </p>
            )}
            <div className="mt-5 border-t border-slate-800 pt-4">
              <h3 className="text-sm font-semibold text-slate-200">Key indicators</h3>
              <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {config.indicators.map((indicator) => (
                  <li key={indicator} className="flex items-center gap-2 text-sm text-slate-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />{indicator}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        {children}

        <section className="card flex items-start gap-3 p-5">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
          <div>
            <h2 className="text-sm font-semibold text-white">About this assessment</h2>
            <p className="mt-1 text-sm leading-6 text-slate-400">{config.guidance} Results are estimates, not official warnings. Follow local authorities for emergency instructions.</p>
          </div>
        </section>
      </div>
    </Layout>
  );
}
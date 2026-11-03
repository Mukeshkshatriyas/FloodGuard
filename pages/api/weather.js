const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'Weather API key is not configured' });
  }

  const { type, lat, lon } = req.query;
  const latitude = Number(lat);
  const longitude = Number(lon);
  if (
    !['current', 'forecast'].includes(type) ||
    !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
    !Number.isFinite(longitude) || longitude < -180 || longitude > 180
  ) {
    return res.status(400).json({ error: 'Invalid weather request' });
  }

  try {
    const endpoint = type === 'current' ? 'weather' : 'forecast';
    const params = new URLSearchParams({
      lat: String(latitude),
      lon: String(longitude),
      appid: apiKey,
      units: 'metric'
    });
    const upstream = await fetch(`${WEATHER_BASE_URL}/${endpoint}?${params}`);
    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch {
    return res.status(502).json({ error: 'Weather service is unavailable' });
  }
}
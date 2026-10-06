const backendUrl = (process.env.DISASTER_BACKEND_URL || 'http://127.0.0.1:5000').replace(/\/$/, '');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch(`${backendUrl}/api/predict-disaster`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const payload = await response.json();
    return res.status(response.status).json(payload);
  } catch (error) {
    return res.status(503).json({
      error: 'Prediction service is unavailable. Start the Flask app or set DISASTER_BACKEND_URL.',
    });
  }
}
const backendUrl = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.DISASTER_BACKEND_URL ||
  'http://127.0.0.1:5000'
).replace(/\/$/, '');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';
  if (!question) {
    return res.status(400).json({ error: 'Enter a question for the project assistant.' });
  }

  try {
    const response = await fetch(`${backendUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, context: {} }),
    });
    const payload = await response.json();
    return res.status(response.status).json(payload);
  } catch (error) {
    return res.status(503).json({
      error: 'The assistant service is unavailable. Start the Flask backend and try again.',
    });
  }
}

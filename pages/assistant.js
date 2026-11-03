import { useEffect, useRef, useState } from 'react';
import { Bot, LoaderCircle, MessageCircle, Send } from 'lucide-react';
import Layout from '../components/Layout';

// ── Token constants ───────────────────────────────────────────────────────────
const C = {
  card:     '#19191b',
  raised:   '#232325',
  line:     '#2a2a2d',
  primary:  '#ececee',
  secondary:'#a1a1a6',
  muted:    '#85858b',
  teal:     '#2dd4bf',
};

const starterQuestions = [
  'What does this project do?',
  'How are disaster risks predicted?',
  'What do the map and alert features need?',
];

export default function ProjectAssistant() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "I'm the SafeSphere project assistant. Ask me what the project does, how its prediction pages work, or what its weather, map, and alert features are for.",
    },
  ]);
  const [question,  setQuestion]  = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error,     setError]     = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isSending]);

  // ── API call — logic unchanged ────────────────────────────────────────────
  async function sendQuestion(value) {
    const text = value.trim();
    if (!text || isSending) return;
    setMessages(cur => [...cur, { role: 'user', content: text }]);
    setQuestion('');
    setError('');
    setIsSending(true);
    try {
      const res = await fetch('/api/project-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'The assistant could not answer right now.');
      setMessages(cur => [...cur, { role: 'assistant', content: payload.answer }]);
    } catch (err) {
      setError(err.message || 'Could not connect to the assistant.');
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(e) { e.preventDefault(); sendQuestion(question); }

  return (
    <Layout>
      <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 10rem)' }}>

        {/* ── Page title — no card wrapper, no cyan eyebrow ────────────── */}
        <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${C.line}` }}>
          <h1 style={{ fontSize: 20, fontWeight: 500, color: C.primary, margin: 0 }}>Assistant</h1>
          <p style={{ fontSize: 12, color: C.secondary, marginTop: 4 }}>
            Ask about the dashboard, predictions, or how the project fits together.
          </p>
        </div>

        {/* ── Conversation ─────────────────────────────────────────────── */}
        <section
          style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          aria-label="Conversation"
        >
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 8 }} aria-live="polite">
            {messages.map((msg, i) => (
              <article
                key={`${msg.role}-${i}`}
                style={{
                  display: 'flex',
                  gap: 10,
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                {/* Bot avatar — neutral bg-g-raised square, no teal border */}
                {msg.role === 'assistant' && (
                  <span style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 32, height: 32, flexShrink: 0,
                    backgroundColor: C.raised, border: `1px solid ${C.line}`,
                    borderRadius: 8,
                  }}>
                    <Bot style={{ width: 16, height: 16, color: C.secondary }} strokeWidth={1.5} />
                  </span>
                )}

                {/* Message bubble */}
                <div style={{
                  maxWidth: 'min(42rem, 85%)',
                  whiteSpace: 'pre-wrap',
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontSize: 13,
                  lineHeight: 1.55,
                  // user = bg-g-raised; assistant = bg-g-card — both with hairline, no blue/cyan
                  backgroundColor: msg.role === 'user' ? C.raised : C.card,
                  border:          `1px solid ${C.line}`,
                  color:           C.primary,
                }}>
                  {msg.content}
                </div>
              </article>
            ))}

            {/* Thinking indicator */}
            {isSending && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.secondary }} role="status">
                <LoaderCircle style={{ width: 14, height: 14, color: C.teal }} className="animate-spin" strokeWidth={1.5} />
                Thinking…
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* ── Starter suggestion chips ────────────────────────────────── */}
          {messages.length === 1 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '12px 0' }}>
              {starterQuestions.map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => sendQuestion(q)}
                  disabled={isSending}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px', fontSize: 12,
                    backgroundColor: C.card, border: `1px solid ${C.line}`,
                    borderRadius: 8, color: C.secondary, cursor: 'pointer',
                    transition: 'background-color 120ms',
                    opacity: isSending ? 0.5 : 1,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.raised; e.currentTarget.style.color = C.primary; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.card;   e.currentTarget.style.color = C.secondary; }}
                >
                  <MessageCircle style={{ width: 12, height: 12 }} strokeWidth={1.5} />
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* ── Error ───────────────────────────────────────────────────── */}
          {error && (
            <p role="alert" style={{ fontSize: 12, color: '#e5484d', marginBottom: 8 }}>{error}</p>
          )}

          {/* ── Input bar ────────────────────────────────────────────────── */}
          <form
            onSubmit={handleSubmit}
            style={{
              display: 'flex', alignItems: 'flex-end', gap: 8,
              marginTop: 12, paddingTop: 12,
              borderTop: `1px solid ${C.line}`,
            }}
          >
            <label htmlFor="project-question" className="sr-only">Ask the project assistant</label>
            <textarea
              id="project-question"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
              rows={2}
              maxLength={2000}
              placeholder="Ask a question about the project…"
              style={{
                flex: 1,
                minHeight: 48, resize: 'vertical',
                backgroundColor: C.raised,
                border: `1px solid ${C.line}`,
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 13,
                color: C.primary,
                outline: 'none',
                fontFamily: 'inherit',
                // Teal focus ring only — no cyan border
                transition: 'border-color 120ms',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = C.teal; }}
              onBlur={e =>  { e.currentTarget.style.borderColor = C.line;  }}
            />

            {/* Send button — solid teal (single accent usage) */}
            <button
              type="submit"
              disabled={!question.trim() || isSending}
              aria-label="Send question"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 40, height: 40, flexShrink: 0,
                backgroundColor: C.teal,
                border: 'none', borderRadius: 8, cursor: 'pointer',
                opacity: (!question.trim() || isSending) ? 0.4 : 1,
                transition: 'opacity 120ms',
              }}
            >
              <Send style={{ width: 16, height: 16, color: '#0f0f10' }} strokeWidth={1.5} />
            </button>
          </form>

          <p style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>
            For emergencies, follow official local alerts and instructions.
          </p>
        </section>

      </div>
    </Layout>
  );
}

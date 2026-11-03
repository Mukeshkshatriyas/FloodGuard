import { useEffect, useRef, useState } from 'react';
import { Bot, LoaderCircle, MessageCircle, Send, Sparkles } from 'lucide-react';
import Layout from '../components/Layout';

const starterQuestions = [
  'What does this project do?',
  'How are disaster risks predicted?',
  'What do the map and alert features need?',
];

export default function ProjectAssistant() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'I’m the SafeSphere project assistant. Ask me what the project does, how its prediction pages work, or what its weather, map, and alert features are for.',
    },
  ]);
  const [question, setQuestion] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isSending]);

  async function sendQuestion(value) {
    const text = value.trim();
    if (!text || isSending) return;

    setMessages((current) => [...current, { role: 'user', content: text }]);
    setQuestion('');
    setError('');
    setIsSending(true);

    try {
      const response = await fetch('/api/project-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'The assistant could not answer right now.');
      setMessages((current) => [...current, { role: 'assistant', content: payload.answer }]);
    } catch (requestError) {
      setError(requestError.message || 'Could not connect to the assistant.');
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendQuestion(question);
  }

  return (
    <Layout>
      <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-5xl flex-col">
        <header className="mb-6 border-b border-slate-800 pb-5">
          <p className="flex items-center gap-2 text-sm font-medium text-cyan-300">
            <Sparkles className="h-4 w-4" /> SafeSphere help
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">Project Assistant</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Ask about the dashboard, disaster predictions, or how the project’s integrations fit together.
          </p>
        </header>

        <section className="flex min-h-[420px] flex-1 flex-col" aria-label="Conversation">
          <div className="flex-1 space-y-5 overflow-y-auto py-2" aria-live="polite">
            {messages.map((message, index) => (
              <article key={`${message.role}-${index}`} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                {message.role === 'assistant' && (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
                    <Bot className="h-5 w-5" />
                  </span>
                )}
                <div className={`max-w-[min(42rem,85%)] whitespace-pre-wrap rounded-lg border px-4 py-3 text-sm leading-6 ${
                  message.role === 'user'
                    ? 'border-cyan-500/30 bg-cyan-950/50 text-cyan-50'
                    : 'border-slate-800 bg-slate-900 text-slate-200'
                }`}>
                  {message.content}
                </div>
              </article>
            ))}
            {isSending && (
              <div className="flex items-center gap-3 text-sm text-slate-400" role="status">
                <LoaderCircle className="h-4 w-4 animate-spin text-cyan-300" /> Thinking…
              </div>
            )}
            <div ref={endOfMessagesRef} />
          </div>

          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2 py-4">
              {starterQuestions.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => sendQuestion(starter)}
                  disabled={isSending}
                  className="rounded-md border border-slate-700 px-3 py-2 text-left text-sm text-slate-300 transition hover:border-cyan-500/60 hover:text-white disabled:opacity-50"
                >
                  <MessageCircle className="mr-2 inline h-4 w-4 text-cyan-300" />{starter}
                </button>
              ))}
            </div>
          )}

          {error && <p className="mb-3 text-sm text-red-300" role="alert">{error}</p>}

          <form onSubmit={handleSubmit} className="mt-4 flex items-end gap-3 border-t border-slate-800 pt-4">
            <label htmlFor="project-question" className="sr-only">Ask the project assistant</label>
            <textarea
              id="project-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleSubmit(event);
                }
              }}
              rows={2}
              maxLength={2000}
              placeholder="Ask a question about the project…"
              className="min-h-12 flex-1 resize-y rounded-md border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            />
            <button
              type="submit"
              disabled={!question.trim() || isSending}
              title="Send question"
              aria-label="Send question"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-cyan-600 text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
          <p className="mt-2 text-xs text-slate-500">For emergencies, follow official local alerts and instructions.</p>
        </section>
      </div>
    </Layout>
  );
}
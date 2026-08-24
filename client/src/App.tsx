import { useEffect, useRef, useState } from 'react';
import './App.css';

type SessionState = {
  sessionId: string;
  url: string | null;
  status: string;
  html: string | null;
};

const POLL_INTERVAL_MS = 5000;

type GenerateResponse = { sessionId: string; url: string | null };
type SessionResponse = { sessionId: string; status: string; url: string | null; html: string | null };

async function requestJson<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const text = await res.text();
  let data: (Partial<T> & { error?: string }) | null = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    throw new Error(data?.error || `Request failed with status ${res.status}`);
  }
  return data as T;
}

export default function App() {
  const [session, setSession] = useState<SessionState | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    if (!session || session.html) return;

    const poll = async () => {
      try {
        const data = await requestJson<SessionResponse>(`/api/sessions/${session.sessionId}`);
        setSession((prev) =>
          prev && prev.sessionId === data.sessionId
            ? { ...prev, status: data.status, html: data.html, url: data.url ?? prev.url }
            : prev
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    };

    poll();
    pollRef.current = window.setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [session?.sessionId, session?.html]);

  const start = async () => {
    setStarting(true);
    setError(null);
    setSession(null);
    try {
      const data = await requestJson<GenerateResponse>('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
      });
      setSession({ sessionId: data.sessionId, url: data.url, status: 'starting', html: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setStarting(false);
    }
  };

  const download = () => {
    if (!session?.html) return;
    const blob = new Blob([session.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'devin-output.html';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="page">
      <h1>Devin HTML Generator</h1>
      <p className="subtitle">Kick off a Devin session and download the HTML it produces.</p>

      <button className="primary" onClick={start} disabled={starting || (!!session && !session.html)}>
        {starting ? 'Starting…' : session && !session.html ? 'Working…' : 'Generate HTML'}
      </button>

      {error && <p className="error">{error}</p>}

      {session && (
        <section className="status">
          <div>
            Session: {session.url ? <a href={session.url} target="_blank" rel="noreferrer">{session.sessionId}</a> : session.sessionId}
          </div>
          <div>Status: {session.status}</div>
          {session.html ? (
            <button className="primary" onClick={download}>Download HTML</button>
          ) : (
            <div className="hint">Polling every {POLL_INTERVAL_MS / 1000}s for the finished HTML…</div>
          )}
        </section>
      )}

      {session?.html && (
        <iframe className="preview" title="Generated HTML preview" srcDoc={session.html} sandbox="" />
      )}
    </main>
  );
}

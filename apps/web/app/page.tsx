
'use client';

import { useEffect, useState } from 'react';

type ApiStatus = 'checking' | 'connected' | 'unavailable';

interface HealthResponse {
  status: 'ok';
  timestamp: string;
}

export default function Home() {
  const [apiStatus, setApiStatus] = useState<ApiStatus>('checking');
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      setApiStatus('unavailable');
      return;
    }

    const controller = new AbortController();

    async function checkApiHealth() {
      try {
        const response = await fetch(`${apiUrl}/health`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Health check failed with status ${response.status}`);
        }

        const health = (await response.json()) as HealthResponse;
        setApiStatus(health.status === 'ok' ? 'connected' : 'unavailable');
        setCheckedAt(health.timestamp);
      } catch {
        if (!controller.signal.aborted) {
          setApiStatus('unavailable');
        }
      }
    }

    void checkApiHealth();

    return () => controller.abort();
  }, []);

  return (
    <div>
      <h1>Career Switch Assistant</h1>
      <p>Turn your career goal into an actionable roadmap.</p>
      <p>
        API Status: <span>{apiStatus}</span>
      </p>
      {checkedAt && <p>Last checked: {new Date(checkedAt).toLocaleString()}</p>}
    </div>
  );
}

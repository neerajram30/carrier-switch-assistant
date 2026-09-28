
'use client';

import { useEffect, useState } from 'react';

type ApiStatus = 'checking' | 'connected' | 'unavailable';
type DbStatus = 'checking' | 'connected' | 'disconnected' | 'unknown';

interface ApiHealthResponse {
  status: 'ok';
  timestamp: string;
}

interface DbHealthResponse {
  status: 'ok' | 'error';
  database: 'connected' | 'disconnected';
  timestamp: string;
}

export default function Home() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const [apiStatus, setApiStatus] = useState<ApiStatus>(
    apiUrl ? 'checking' : 'unavailable',
  );
  const [dbStatus, setDbStatus] = useState<DbStatus>(
    apiUrl ? 'checking' : 'unknown',
  );
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!apiUrl) {
      return;
    }

    const controller = new AbortController();

    async function checkHealth() {
      // Check API liveness
      try {
        const apiRes = await fetch(`${apiUrl}/health`, {
          signal: controller.signal,
        });

        if (!apiRes.ok) {
          throw new Error(`API health check failed with status ${apiRes.status}`);
        }

        const apiHealth = (await apiRes.json()) as ApiHealthResponse;
        setApiStatus(apiHealth.status === 'ok' ? 'connected' : 'unavailable');
        setCheckedAt(apiHealth.timestamp);
      } catch {
        if (!controller.signal.aborted) {
          setApiStatus('unavailable');
          setDbStatus('unknown');
        }
        return;
      }

      // Check database connectivity (only if API is reachable)
      try {
        const dbRes = await fetch(`${apiUrl}/health/db`, {
          signal: controller.signal,
        });

        if (!dbRes.ok) {
          throw new Error(`DB health check failed with status ${dbRes.status}`);
        }

        const dbHealth = (await dbRes.json()) as DbHealthResponse;
        setDbStatus(dbHealth.database);
      } catch {
        if (!controller.signal.aborted) {
          setDbStatus('unknown');
        }
      }
    }

    void checkHealth();

    return () => controller.abort();
  }, [apiUrl]);

  const statusEmoji = (status: string) => {
    switch (status) {
      case 'connected':
        return '🟢';
      case 'checking':
        return '🟡';
      case 'disconnected':
      case 'unavailable':
        return '🔴';
      default:
        return '⚪';
    }
  };

  return (
    <div>
      <h1>Career Switch Assistant</h1>
      <p>Turn your career goal into an actionable roadmap.</p>
      <p>
        API Status: {statusEmoji(apiStatus)} <span>{apiStatus}</span>
      </p>
      <p>
        Database Status: {statusEmoji(dbStatus)} <span>{dbStatus}</span>
      </p>
      {checkedAt && <p>Last checked: {new Date(checkedAt).toLocaleString()}</p>}
    </div>
  );
}

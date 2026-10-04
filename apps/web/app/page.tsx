'use client';

import { useEffect, useState } from 'react';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';

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
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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

      // Check database connectivity
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
  }, [apiUrl, refreshTrigger]);

  const handleRefresh = () => {
    setApiStatus('checking');
    setDbStatus('checking');
    setRefreshTrigger((prev) => prev + 1);
  };

  const getDotVariant = (
    status: ApiStatus | DbStatus,
  ): 'success' | 'warning' | 'error' | 'neutral' => {
    switch (status) {
      case 'connected':
        return 'success';
      case 'checking':
        return 'warning';
      case 'unavailable':
      case 'disconnected':
        return 'error';
      default:
        return 'neutral';
    }
  };

  return (
    <VStack as="main" padding={6} gap={4}>
      <Card padding={5} maxWidth={520} width="100%">
        <VStack gap={3}>
          <Heading level={1}>Career Switch Assistant</Heading>
          <Text color="secondary">
            Turn your career goal into an actionable roadmap.
          </Text>

          <HStack gap={2} align="center">
            <Text>API Status:</Text>
            <StatusDot
              variant={getDotVariant(apiStatus)}
              label={`API status: ${apiStatus}`}
            />
            <Text color="secondary">{apiStatus}</Text>
          </HStack>

          <HStack gap={2} align="center">
            <Text>Database Status:</Text>
            <StatusDot
              variant={getDotVariant(dbStatus)}
              label={`Database status: ${dbStatus}`}
            />
            <Text color="secondary">{dbStatus}</Text>
          </HStack>

          {checkedAt && (
            <Text type="supporting" color="secondary">
              Last checked: {new Date(checkedAt).toLocaleString()}
            </Text>
          )}

          <Button
            label="Re-check Status"
            variant="secondary"
            onClick={handleRefresh}
          />
        </VStack>
      </Card>
    </VStack>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Divider } from "@astryxdesign/core/Divider";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack, VStack } from "@astryxdesign/core/Stack";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import { Text } from "@astryxdesign/core/Text";

type ApiStatus = "checking" | "connected" | "unavailable";
type DbStatus = "checking" | "connected" | "disconnected" | "unknown";

interface ApiHealthResponse {
  status: "ok";
  timestamp: string;
}

interface DbHealthResponse {
  status: "ok" | "error";
  database: "connected" | "disconnected";
  timestamp: string;
}

export default function SystemStatusPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const [apiStatus, setApiStatus] = useState<ApiStatus>(
    apiUrl ? "checking" : "unavailable",
  );
  const [dbStatus, setDbStatus] = useState<DbStatus>(
    apiUrl ? "checking" : "unknown",
  );
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
          throw new Error(
            `API health check failed with status ${apiRes.status}`,
          );
        }

        const apiHealth = (await apiRes.json()) as ApiHealthResponse;
        setApiStatus(apiHealth.status === "ok" ? "connected" : "unavailable");
        setCheckedAt(apiHealth.timestamp);
      } catch {
        if (!controller.signal.aborted) {
          setApiStatus("unavailable");
          setDbStatus("unknown");
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
          setDbStatus("unknown");
        }
      } finally {
        setIsRefreshing(false);
      }
    }

    void checkHealth();

    return () => controller.abort();
  }, [apiUrl, refreshTrigger]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setApiStatus("checking");
    setDbStatus("checking");
    setRefreshTrigger((prev) => prev + 1);
  };

  const getDotVariant = (
    status: ApiStatus | DbStatus,
  ): "success" | "warning" | "error" | "neutral" => {
    switch (status) {
      case "connected":
        return "success";
      case "checking":
        return "warning";
      case "unavailable":
      case "disconnected":
        return "error";
      default:
        return "neutral";
    }
  };

  return (
    <VStack
      as="main"
      hAlign="center"
      vAlign="center"
      width="100%"
      minHeight="100vh"
      padding={4}
    >
      <Card maxWidth={620} width="100%" elevation="low" padding={4}>
        <VStack gap={5} padding={4}>
          <VStack gap={1}>
            <Heading level={1} weight="semibold">
              Career Switch Assistant
            </Heading>
            <Text type="supporting" color="secondary">
              Turn your career goal into an actionable roadmap.
            </Text>
          </VStack>

          <Divider />

          <VStack gap={3}>
            <Heading level={2} weight="medium">
              System Health & Connectivity
            </Heading>

            <VStack gap={2}>
              <HStack justify="between" align="center" paddingBlock={1}>
                <HStack gap={2} align="center">
                  <StatusDot
                    variant={getDotVariant(apiStatus)}
                    label={`API status: ${apiStatus}`}
                    isPulsing={apiStatus === "checking"}
                  />
                  <Text type="label">API Gateway</Text>
                </HStack>
                <Text type="supporting" color="secondary">
                  {apiStatus}
                </Text>
              </HStack>

              <HStack justify="between" align="center" paddingBlock={1}>
                <HStack gap={2} align="center">
                  <StatusDot
                    variant={getDotVariant(dbStatus)}
                    label={`Database status: ${dbStatus}`}
                    isPulsing={dbStatus === "checking"}
                  />
                  <Text type="label">PostgreSQL Database</Text>
                </HStack>
                <Text type="supporting" color="secondary">
                  {dbStatus}
                </Text>
              </HStack>
            </VStack>

            {checkedAt && (
              <Text type="supporting" color="secondary">
                Last checked: {new Date(checkedAt).toLocaleString()}
              </Text>
            )}
          </VStack>

          <Divider />

          <HStack justify="between" align="center" width="100%">
            <Button
              label="Refresh Status"
              variant="secondary"
              isLoading={isRefreshing}
              onClick={handleRefresh}
            />
            <Button
              label="Go to Onboarding →"
              variant="primary"
              href="/"
            />
          </HStack>
        </VStack>
      </Card>
    </VStack>
  );
}

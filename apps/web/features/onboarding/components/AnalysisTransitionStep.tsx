'use client';

import { useEffect, useState } from 'react';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Divider } from '@astryxdesign/core/Divider';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import type { CareerProfileData } from '../types';

interface AnalysisTransitionStepProps {
  data: CareerProfileData;
  onEdit: () => void;
}

export function AnalysisTransitionStep({
  data,
  onEdit,
}: AnalysisTransitionStepProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnalyzing(false);
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  if (isAnalyzing) {
    return (
      <VStack gap={6} align="center" padding={6} width="100%">
        <StatusDot variant="accent" label="Analyzing" isPulsing />
        <VStack gap={2} align="center">
          <Heading level={2} weight="semibold" style={{ color: 'var(--color-text-cyan)' }}>
            Analyzing your career transition...
          </Heading>
          <Text type="supporting" color="secondary" justify="center">
            Comparing your baseline skills against market requirements for {data.targetRole}.
          </Text>
        </VStack>
        <Card variant="cyan" elevation="none" padding={4}>
          <Text type="supporting" style={{ color: 'var(--color-text-cyan)' }}>
            ✦ Profile &amp; Goal saved successfully. Generating AI skill gap analysis and transition milestones...
          </Text>
        </Card>
      </VStack>
    );
  }

  return (
    <VStack gap={5} width="100%">
      <VStack gap={1}>
        <Heading level={1} weight="semibold">
          Your Career Baseline &amp; Goal
        </Heading>
        <Text type="supporting" color="secondary">
          Review your configured career profile and transition goal.
        </Text>
      </VStack>

      <Card variant="default" elevation="none" padding={4}>
        <VStack gap={4}>
          <HStack justify="between" align="start">
            <VStack gap={1}>
              <Text type="label" color="secondary">
                Current Role
              </Text>
              <Text type="body" weight="semibold">
                {data.currentRole}
              </Text>
            </VStack>
            <VStack gap={1} align="end">
              <Text type="label" color="secondary">
                Target Goal
              </Text>
              <Text type="body" weight="semibold">
                {data.targetRole}
              </Text>
            </VStack>
          </HStack>

          <Divider />

          <HStack justify="between" align="start">
            <VStack gap={1}>
              <Text type="label" color="secondary">
                Experience
              </Text>
              <Text type="body">
                {data.yearsOfExperience} years
              </Text>
            </VStack>
            <VStack gap={1} align="end">
              <Text type="label" color="secondary">
                Profile Source
              </Text>
              <Text
                type="supporting"
                style={{
                  color:
                    data.source === 'ai_extracted'
                      ? 'var(--color-text-cyan)'
                      : 'var(--color-text-secondary)',
                }}
              >
                {data.source === 'ai_extracted' ? '✦ AI Extracted' : 'Manual Entry'}
              </Text>
            </VStack>
          </HStack>

          {data.summary && (
            <>
              <Divider />
              <VStack gap={1}>
                <Text type="label" color="secondary">
                  Profile Summary
                </Text>
                <Text type="supporting">
                  {data.summary}
                </Text>
              </VStack>
            </>
          )}

          <Divider />

          <VStack gap={2}>
            <Text type="label" color="secondary">
              Active Skills ({data.skills.length})
            </Text>
            <HStack gap={2} wrap="wrap">
              {data.skills.map((skill) => (
                <Token
                  key={skill}
                  label={skill}
                  color={data.source === 'ai_extracted' ? 'cyan' : 'blue'}
                />
              ))}
            </HStack>
          </VStack>
        </VStack>
      </Card>

      <HStack justify="between" align="center" width="100%" paddingBlockStart={4}>
        <Button label="Edit Profile" variant="secondary" onClick={onEdit} />
        <Button
          label="View Career Roadmap →"
          variant="primary"
          onClick={() => {
            alert('Roadmap engine integration will be connected in milestone 2!');
          }}
        />
      </HStack>
    </VStack>
  );
}

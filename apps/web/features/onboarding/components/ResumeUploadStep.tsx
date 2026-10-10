"use client";

import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Divider } from "@astryxdesign/core/Divider";
import { FileInput } from "@astryxdesign/core/FileInput";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack, VStack } from "@astryxdesign/core/Stack";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import { Text } from "@astryxdesign/core/Text";
import { useResumeUpload } from "../hooks/useResumeUpload";
import type { UploadedResumeInfo } from "../types";
import type { UploadResumeResult } from "../services/resume-storage.service";

interface ResumeUploadStepProps {
  onSuccess?: (file: File, resumeInfo: UploadedResumeInfo) => void;
  onSwitchToManual: () => void;
  uploadFn?: (file: File) => Promise<UploadResumeResult>;
}

export function ResumeUploadStep({
  onSuccess,
  onSwitchToManual,
  uploadFn,
}: ResumeUploadStepProps) {
  const {
    selectedFile,
    validationError,
    uploadState,
    isProcessing,
    handleFileChange,
    clearError,
  } = useResumeUpload(onSuccess, uploadFn);

  return (
    <VStack gap={6} width="100%">
      {/* Title & Prompt */}
      <VStack gap={2}>
        <Heading level={1} weight="semibold">
          Build your career baseline
        </Heading>
        <Text type="supporting" color="secondary">
          Upload your resume to automatically extract your skills, experience,
          and current role.
        </Text>
      </VStack>

      {/* Screen 1A: Inline Validation Error Alert if file is rejected (Red) */}
      {validationError && (
        <Card variant="red" elevation="none">
          <VStack gap={3} padding={3}>
            <HStack gap={2} align="center">
              <StatusDot variant="error" label="Validation Error" />
              <Heading level={3} weight="semibold" style={{ color: 'var(--color-text-red)' }}>
                Resume couldn&apos;t be uploaded
              </Heading>
            </HStack>
            <Text type="body" style={{ color: 'var(--color-text-red)' }}>{validationError.message}</Text>
            <HStack gap={3} justify="end">
              <Button
                label="Choose another file"
                variant="secondary"
                onClick={clearError}
              />
              <Button
                label="Enter details manually"
                variant="ghost"
                onClick={onSwitchToManual}
              />
            </HStack>
          </VStack>
        </Card>
      )}

      {/* Screen 1B: Uploaded Success State */}
      {uploadState === 'uploaded' && selectedFile ? (
        <Card variant="default" elevation="none">
          <VStack gap={4} align="center" padding={6}>
            <StatusDot variant="success" label="Uploaded" />
            <VStack gap={1} align="center">
              <Heading level={3} weight="medium">
                Resume uploaded
              </Heading>
              <Text type="supporting" color="secondary">
                Your resume has been securely uploaded and is ready for analysis.
              </Text>
            </VStack>
            <Text type="supporting" color="secondary">
              File: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
            </Text>
            <HStack gap={3}>
              <Button
                label="Choose another file"
                variant="secondary"
                size="sm"
                onClick={clearError}
              />
            </HStack>
          </VStack>
        </Card>
      ) : isProcessing && selectedFile ? (
        /* Screen 1B: Validating / Uploading State (AI Cyan) */
        <Card variant="cyan" elevation="none">
          <VStack gap={4} align="center" padding={6}>
            <StatusDot
              variant="accent"
              label={uploadState === 'validating' ? 'Validating' : 'Uploading'}
              isPulsing
            />
            <VStack gap={1} align="center">
              <Heading level={3} weight="medium" style={{ color: 'var(--color-text-cyan)' }}>
                {uploadState === 'validating'
                  ? 'Validating your resume...'
                  : 'Uploading your resume...'}
              </Heading>
              <Text type="supporting" style={{ color: 'var(--color-text-cyan)' }}>
                {uploadState === 'validating'
                  ? 'Checking file format and size...'
                  : 'Uploading your resume to secure storage...'}
              </Text>
            </VStack>
            <Text type="supporting" color="secondary">
              File: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
            </Text>
            <Text type="supporting" color="secondary">
              Taking longer than expected?
            </Text>
            <HStack gap={3}>
              <Button
                label="Choose another file"
                variant="secondary"
                size="sm"
                onClick={clearError}
              />
              <Button
                label="Enter details manually"
                variant="ghost"
                size="sm"
                onClick={onSwitchToManual}
              />
            </HStack>
          </VStack>
        </Card>
      ) : (
        /* Screen 1: Standard Dropzone */
        <VStack gap={4}>
          <FileInput
            label="Upload your resume"
            mode="dropzone"
            value={selectedFile}
            onChange={handleFileChange}
            description="Supports PDF or DOCX (Max 5 MB)"
            placeholder="Drop your resume here, or browse files"
          />

          <Text type="supporting" color="secondary">
            🔒 Your resume is used to build your career profile. We respect your
            privacy.
          </Text>
        </VStack>
      )}

      <HStack gap={3} align="center" width="100%">
        <Divider />
        <Text type="supporting" color="secondary">
          or
        </Text>
        <Divider />
      </HStack>

      {/* Manual Entry Fallback CTA */}
      <HStack justify="center" width="100%">
        <Button
          label="Enter details manually →"
          variant="secondary"
          onClick={onSwitchToManual}
        />
      </HStack>
    </VStack>
  );
}

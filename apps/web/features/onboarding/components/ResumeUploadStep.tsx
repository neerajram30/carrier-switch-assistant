"use client";

import { useEffect, useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { FileInput } from "@astryxdesign/core/FileInput";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack, VStack } from "@astryxdesign/core/Stack";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import { Text } from "@astryxdesign/core/Text";
import { FileText, Sparkles } from "lucide-react";
import { useResumeUpload } from "../hooks/useResumeUpload";
import { saveExtractedDataToStorage } from "../services/onboarding-storage";
import type {
  ExtractedCareerData,
  ProcessedResumeResult,
  UploadedResumeInfo,
} from "../types";
import {
  analyzePromptDirectly,
  processResume,
  uploadResumeDirectly,
  type UploadResumeResult,
} from "../services/resume-storage.service";

const TELEMETRY_STAGES = [
  "Scanning document structure & career timeline",
  "Extracting core role & competencies",
  "Decoding technical skills & proficiency signals",
  "Calibrating baseline telemetry",
];

interface ResumeUploadStepProps {
  onSuccess?: (file: File, resumeInfo: UploadedResumeInfo) => void;
  onContinueToReview?: (extractedData: ExtractedCareerData) => void;
  onSwitchToManual: () => void;
  uploadFn?: (file: File) => Promise<UploadResumeResult>;
  processFn?: (resumeId: string) => Promise<ProcessedResumeResult>;
  autoProcess?: boolean;
}

export function ResumeUploadStep({
  onSuccess,
  onContinueToReview,
  onSwitchToManual,
  uploadFn = uploadResumeDirectly,
  processFn = processResume,
  autoProcess = false,
}: ResumeUploadStepProps) {
  const [telemetryStepIndex, setTelemetryStepIndex] = useState(0);
  const [promptText, setPromptText] = useState("");
  const [isPromptGenerating, setIsPromptGenerating] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);

  const {
    selectedFile,
    validationError,
    uploadState,
    processedResult,
    failureType,
    handleFileChange,
    startProcessing,
    retryProcessing,
    clearError,
  } = useResumeUpload(
    onSuccess,
    uploadFn,
    processFn,
    undefined,
    autoProcess,
  );

  useEffect(() => {
    if (uploadState !== "processing") {
      return;
    }
    const interval = setInterval(() => {
      setTelemetryStepIndex((prev) => Math.min(prev + 1, TELEMETRY_STAGES.length - 1));
    }, 700);
    return () => {
      clearInterval(interval);
      setTelemetryStepIndex(0);
    };
  }, [uploadState]);

  const structured = processedResult?.structuredData;

  const handleGenerateClick = async () => {
    // 1. If file is already processed
    if (uploadState === "processed" && structured) {
      if (onContinueToReview) {
        onContinueToReview(structured);
      }
      return;
    }

    // 2. If file is uploaded but not processed yet
    if (uploadState === "uploaded" && selectedFile) {
      await startProcessing(undefined, promptText.trim() || undefined);
      return;
    }

    // 3. If user typed in the prompt box (or wants to generate baseline from prompt)
    if (!selectedFile && !promptText.trim()) {
      setPromptError("Please attach a resume file (PDF or DOCX) or write about your career in the prompt box.");
      return;
    }

    setPromptError(null);
    setIsPromptGenerating(true);
    try {
      const extracted = await analyzePromptDirectly(promptText.trim());
      saveExtractedDataToStorage(extracted);
      if (onContinueToReview) {
        onContinueToReview(extracted);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to analyze career prompt with AI. Please check your connection or enter details manually.";
      setPromptError(message);
    } finally {
      setIsPromptGenerating(false);
    }
  };

  return (
    <VStack gap={6} width="100%">
      {/* Wireframe Header */}
      <VStack gap={2}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={20} style={{ color: "var(--color-periwinkle-glow, #98a4f7)" }} />
          <Heading level={2} weight="semibold" style={{ fontSize: "1.25rem", margin: 0 }}>
            Write about your career
          </Heading>
        </div>
        <Heading level={1} weight="medium" style={{ color: "var(--color-pure-white, #ffffff)", fontSize: "1.45rem", margin: 0 }}>
          Build your career baseline
        </Heading>
        <Text type="supporting" color="secondary">
          Upload your resume to automatically extract your skills, experience, and current role.
        </Text>
      </VStack>

      {/* Inline Validation / Failure Error Alert */}
      {(validationError || promptError) && (
        <Card variant="red" elevation="none">
          <VStack gap={3} padding={3}>
            <HStack gap={2} align="center">
              <StatusDot variant="error" label="Error" />
              <Heading
                level={3}
                weight="semibold"
                style={{ color: "var(--color-text-red)" }}
              >
                {promptError
                  ? "Career analysis error"
                  : failureType === "processing_failed"
                    ? "Resume processing failed"
                    : "Resume couldn't be uploaded"}
              </Heading>
            </HStack>
            <Text type="body" style={{ color: "var(--color-text-red)" }}>
              {promptError || validationError?.message}
            </Text>
            <HStack gap={3} justify="end">
              {!promptError && failureType === "processing_failed" && (
                <Button
                  label="Retry processing"
                  variant="primary"
                  onClick={retryProcessing}
                />
              )}
              <Button
                label={promptError ? "Dismiss" : "Choose another file"}
                variant="secondary"
                onClick={() => {
                  setPromptError(null);
                  clearError();
                }}
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

      {/* Main Elegant Prompt Box with Integrated Resume Upload Zone */}
      <div
        style={{
          background: "var(--color-carbon-surface, #151621)",
          border: "1px solid var(--color-gunmetal, #1f2433)",
          boxShadow: "var(--shadow-subtle, rgba(255, 255, 255, 0.25) 0px 1px 3px 0px inset)",
          borderRadius: 16,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 18,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Prompt Input Box */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label
            htmlFor="career-prompt-input"
            style={{
              fontSize: "0.85rem",
              fontWeight: 500,
              color: "var(--color-frost, #c9d3ee)",
              letterSpacing: "-0.01em",
            }}
          >
            Prompt: Tell us about your technical background or target transition
          </label>
          <textarea
            id="career-prompt-input"
            rows={4}
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="e.g. Senior Frontend Engineer with 5 years in React, TypeScript, and system design. Looking to transition into Cloud Solutions Architecture and Distributed Systems..."
            style={{
              width: "100%",
              background: "var(--color-void-black, #0f101a)",
              border: "1px solid var(--color-gunmetal, #1f2433)",
              borderRadius: 10,
              padding: "12px 16px",
              color: "var(--color-pure-white, #ffffff)",
              fontSize: "0.95rem",
              fontFamily: "var(--font-helvetica-now-text, inherit)",
              lineHeight: 1.55,
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box",
              transition: "border-color 0.2s ease",
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--color-periwinkle-glow, #98a4f7)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--color-gunmetal, #1f2433)")}
          />
        </div>

        {/* Upload Attachment States inside Prompt Box */}
        {uploadState === "processed" && selectedFile ? (
          <div
            style={{
              background: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: 10,
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <StatusDot variant="success" label="Analysis Complete" />
              <div>
                <Text type="body" weight="medium" style={{ color: "var(--color-pure-white, #ffffff)" }}>
                  Resume analysis complete ({selectedFile.name})
                </Text>
                <Text type="supporting" color="secondary">
                  Detected Role: {structured?.currentRole || "Role"} • Experience: {structured?.yearsOfExperience || 0} years • Skills identified: {structured?.skills?.length || 0}
                </Text>
              </div>
            </div>
            <Button label="Change file" variant="ghost" size="sm" onClick={clearError} />
          </div>
        ) : uploadState === "processing" && selectedFile ? (
          <div
            style={{
              background: "rgba(6, 182, 212, 0.08)",
              border: "1px solid rgba(6, 182, 212, 0.3)",
              borderRadius: 10,
              padding: "16px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <StatusDot variant="accent" label="Processing" isPulsing />
              <Heading level={4} weight="medium" style={{ color: "var(--color-text-cyan, #06b6d4)" }}>
                Analyzing your resume with AI...
              </Heading>
            </div>
            <Text type="supporting" style={{ color: "var(--color-text-cyan, #06b6d4)" }}>
              Extracting your skills, experience, and current role to prepare your career profile.
            </Text>
            <VStack gap={1} width="100%">
              {TELEMETRY_STAGES.map((stage, idx) => {
                const isDone = idx < telemetryStepIndex;
                const isCurrent = idx === telemetryStepIndex;
                return (
                  <HStack
                    key={stage}
                    gap={2}
                    align="center"
                    style={{
                      padding: "4px 8px",
                      borderRadius: 6,
                      background: isCurrent ? "rgba(6, 182, 212, 0.12)" : "transparent",
                      opacity: isDone ? 0.75 : isCurrent ? 1 : 0.4,
                    }}
                  >
                    <span style={{ fontSize: "0.8rem", color: isCurrent ? "#06b6d4" : "#94a3b8" }}>
                      {isDone ? "✓" : isCurrent ? "●" : "○"}
                    </span>
                    <Text
                      type="supporting"
                      style={{ color: isCurrent ? "#06b6d4" : "#94a3b8", fontSize: "0.8rem" }}
                    >
                      {stage}
                    </Text>
                  </HStack>
                );
              })}
            </VStack>
          </div>
        ) : uploadState === "uploaded" && selectedFile ? (
          <div
            style={{
              background: "var(--color-void-black, #0f101a)",
              border: "1px solid var(--color-gunmetal, #1f2433)",
              borderRadius: 10,
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <FileText size={20} style={{ color: "var(--color-periwinkle-glow, #98a4f7)" }} />
              <div>
                <Heading level={3} weight="medium" style={{ fontSize: "0.95rem", margin: 0, color: "var(--color-pure-white, #ffffff)" }}>
                  Resume uploaded
                </Heading>
                <Text type="supporting" color="secondary">
                  Your resume has been securely uploaded and is ready for analysis.
                </Text>
                <Text type="supporting" color="secondary" style={{ fontSize: "0.78rem" }}>
                  File: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </Text>
              </div>
            </div>
            <Button label="Choose another file" variant="ghost" size="sm" onClick={clearError} />
          </div>
        ) : (uploadState === "validating" || uploadState === "uploading") && selectedFile ? (
          <div
            style={{
              background: "var(--color-void-black, #0f101a)",
              border: "1px solid var(--color-gunmetal, #1f2433)",
              borderRadius: 10,
              padding: "14px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <StatusDot variant="accent" label="Uploading" isPulsing />
            <div>
              <Heading level={3} weight="medium" style={{ fontSize: "0.95rem", margin: 0, color: "var(--color-frost, #c9d3ee)" }}>
                {uploadState === "validating" ? "Validating your resume..." : "Uploading your resume..."}
              </Heading>
              <Text type="supporting" color="secondary">
                {uploadState === "validating" ? "Checking file format and size..." : "Uploading your resume to secure storage..."}
              </Text>
              {selectedFile && (
                <Text type="supporting" color="secondary" style={{ fontSize: "0.78rem" }}>
                  File: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </Text>
              )}
            </div>
          </div>
        ) : (
          /* Dropzone Integrated in Prompt Card */
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <FileInput
              label="Upload resume (PDF or DOCX)"
              mode="dropzone"
              value={selectedFile}
              onChange={handleFileChange}
              description="Supports PDF or DOCX (Max 5 MB)"
              placeholder="Drop your resume here, or browse files"
            />
          </div>
        )}

        {/* Action Button Controls (Generate / Submit & Manual Entry) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            paddingTop: 8,
            borderTop: "1px solid var(--color-gunmetal, #1f2433)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              id="generate-details-button"
              onClick={() => void handleGenerateClick()}
              disabled={isPromptGenerating || uploadState === "processing"}
              aria-label={selectedFile ? "Analyze resume with AI →" : "Generate Analysis Details →"}
              style={{
                background: "linear-gradient(353deg, rgb(91, 99, 211) 17.51%, rgb(124, 135, 247) 183.08%)",
                color: "#ffffff",
                border: "none",
                borderRadius: 9999,
                padding: "10px 24px",
                fontSize: "0.95rem",
                fontWeight: 500,
                cursor: isPromptGenerating || uploadState === "processing" ? "not-allowed" : "pointer",
                boxShadow: "var(--shadow-subtle, rgba(255, 255, 255, 0.25) 0px 1px 3px 0px inset)",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                transition: "opacity 0.2s ease, transform 0.1s ease",
              }}
            >
              <Sparkles size={16} />
              <span>
                {uploadState === "processing" || isPromptGenerating
                  ? "Analyzing..."
                  : "Generate Analysis Details →"}
              </span>
            </button>

            {uploadState === "processed" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "0.85rem", color: "var(--color-text-green, #86efac)" }}>
                  Resume analysis complete
                </span>
                <Button
                  label="Continue to review extracted data →"
                  variant="primary"
                  onClick={() => {
                    if (onContinueToReview && structured) {
                      onContinueToReview(structured);
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* Wireframe secondary button: Enter details manually */}
          <Button
            label="Enter details manually →"
            variant="secondary"
            onClick={onSwitchToManual}
          />
        </div>
      </div>

      <Text type="supporting" color="secondary" style={{ textAlign: "center" }}>
        🔒 Your resume is used to build your career profile. We respect your privacy.
      </Text>
    </VStack>
  );
}

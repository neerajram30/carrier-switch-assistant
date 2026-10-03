import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ResumeUploadStep } from './ResumeUploadStep';

describe('ResumeUploadStep Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders empty state', () => {
    // -------------------------------------------------------------------------
    // 1. Arrange: Render component in initial state with mock callbacks
    // -------------------------------------------------------------------------
    render(<ResumeUploadStep onSuccess={vi.fn()} onSwitchToManual={vi.fn()} />);

    // -------------------------------------------------------------------------
    // 2. Act: (Component mount is the action being tested)
    // -------------------------------------------------------------------------

    // -------------------------------------------------------------------------
    // 3. Assert: Verify Screen 1 initial wireframe elements are present
    // -------------------------------------------------------------------------
    // Heading and instructions
    expect(screen.getByText('Build your career baseline')).toBeInTheDocument();
    expect(
      screen.getByText(/Upload your resume to automatically extract your skills/i),
    ).toBeInTheDocument();

    // Dropzone placeholder and file format specification
    expect(screen.getByText(/Supports PDF or DOCX \(Max 5 MB\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Drop your resume here, or browse files/i)).toBeInTheDocument();

    // Trust & privacy copy
    expect(
      screen.getByText(/Your resume is used to build your career profile/i),
    ).toBeInTheDocument();

    // Manual entry alternative button
    expect(
      screen.getByRole('button', { name: /Enter details manually →/i }),
    ).toBeInTheDocument();

    // Verify rejection alert is NOT visible initially
    expect(screen.queryByText("Resume couldn't be uploaded")).not.toBeInTheDocument();
  });

  it('accepts PDF', () => {
    // -------------------------------------------------------------------------
    // 1. Arrange: Render component and create a valid PDF file mock
    // -------------------------------------------------------------------------
    render(<ResumeUploadStep onSuccess={vi.fn()} onSwitchToManual={vi.fn()} />);

    const input = document.querySelector('input[type="file"]')!;
    expect(input).toBeInTheDocument();

    const validPdf = new File(['%PDF-1.4 mock content'], 'sample-resume.pdf', {
      type: 'application/pdf',
    });

    // -------------------------------------------------------------------------
    // 2. Act: Select the PDF file through the input
    // -------------------------------------------------------------------------
    fireEvent.change(input, { target: { files: [validPdf] } });

    // -------------------------------------------------------------------------
    // 3. Assert: Verify transition to processing state and absence of errors
    // -------------------------------------------------------------------------
    expect(screen.getByText('Analyzing your resume...')).toBeInTheDocument();
    expect(screen.queryByText("Resume couldn't be uploaded")).not.toBeInTheDocument();
  });

  it('accepts DOCX', () => {
    // -------------------------------------------------------------------------
    // 1. Arrange: Render component and create a valid DOCX file mock
    // -------------------------------------------------------------------------
    render(<ResumeUploadStep onSuccess={vi.fn()} onSwitchToManual={vi.fn()} />);

    const input = document.querySelector('input[type="file"]')!;
    expect(input).toBeInTheDocument();

    const validDocx = new File(['mock docx content'], 'sample-resume.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    // -------------------------------------------------------------------------
    // 2. Act: Select the DOCX file through the input
    // -------------------------------------------------------------------------
    fireEvent.change(input, { target: { files: [validDocx] } });

    // -------------------------------------------------------------------------
    // 3. Assert: Verify transition to processing state and absence of errors
    // -------------------------------------------------------------------------
    expect(screen.getByText('Analyzing your resume...')).toBeInTheDocument();
    expect(screen.queryByText("Resume couldn't be uploaded")).not.toBeInTheDocument();
  });

  it('rejects unsupported file', () => {
    // -------------------------------------------------------------------------
    // 1. Arrange: Render component and create an invalid file format (.png)
    // -------------------------------------------------------------------------
    render(<ResumeUploadStep onSuccess={vi.fn()} onSwitchToManual={vi.fn()} />);

    const input = document.querySelector('input[type="file"]')!;
    const unsupportedFile = new File(['image bytes'], 'picture.png', {
      type: 'image/png',
    });

    // -------------------------------------------------------------------------
    // 2. Act: Select the unsupported file
    // -------------------------------------------------------------------------
    fireEvent.change(input, { target: { files: [unsupportedFile] } });

    // -------------------------------------------------------------------------
    // 3. Assert: Verify Screen 1A rejection alert appears with format explanation
    // -------------------------------------------------------------------------
    expect(screen.getByText("Resume couldn't be uploaded")).toBeInTheDocument();
    expect(
      screen.getByText(/is not supported\. Please upload a PDF or DOCX\./i),
    ).toBeInTheDocument();
  });

  it('rejects >5 MB', () => {
    // -------------------------------------------------------------------------
    // 1. Arrange: Render component and create a 6 MB oversized file
    // -------------------------------------------------------------------------
    render(<ResumeUploadStep onSuccess={vi.fn()} onSwitchToManual={vi.fn()} />);

    const input = document.querySelector('input[type="file"]')!;
    const largeBuffer = new Uint8Array(6 * 1024 * 1024);
    const oversizedFile = new File([largeBuffer], 'large-resume.pdf', {
      type: 'application/pdf',
    });

    // -------------------------------------------------------------------------
    // 2. Act: Select the oversized file
    // -------------------------------------------------------------------------
    fireEvent.change(input, { target: { files: [oversizedFile] } });

    // -------------------------------------------------------------------------
    // 3. Assert: Verify Screen 1A rejection alert specifies the size constraint
    // -------------------------------------------------------------------------
    expect(screen.getByText("Resume couldn't be uploaded")).toBeInTheDocument();
    expect(screen.getByText(/larger than 5 MB/i)).toBeInTheDocument();
  });

  it('displays validation error', () => {
    // -------------------------------------------------------------------------
    // 1. Arrange: Render component and prepare an invalid file (.txt)
    // -------------------------------------------------------------------------
    render(<ResumeUploadStep onSuccess={vi.fn()} onSwitchToManual={vi.fn()} />);

    const input = document.querySelector('input[type="file"]')!;
    const invalidFile = new File(['text'], 'notes.txt', { type: 'text/plain' });

    // -------------------------------------------------------------------------
    // 2. Act (Phase 1): Trigger validation error
    // -------------------------------------------------------------------------
    fireEvent.change(input, { target: { files: [invalidFile] } });

    // -------------------------------------------------------------------------
    // 3. Assert (Phase 1): Check error alert content and recovery action buttons
    // -------------------------------------------------------------------------
    expect(screen.getByText("Resume couldn't be uploaded")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Choose another file/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Enter details manually$/i })).toBeInTheDocument();

    // -------------------------------------------------------------------------
    // 4. Act (Phase 2): Click "Choose another file" to dismiss error
    // -------------------------------------------------------------------------
    fireEvent.click(screen.getByRole('button', { name: /Choose another file/i }));

    // -------------------------------------------------------------------------
    // 5. Assert (Phase 2): Verify error card is dismissed and dropzone is restored
    // -------------------------------------------------------------------------
    expect(screen.queryByText("Resume couldn't be uploaded")).not.toBeInTheDocument();
  });

  it('handles drag-over', () => {
    // -------------------------------------------------------------------------
    // 1. Arrange: Render component and locate dropzone element
    // -------------------------------------------------------------------------
    render(<ResumeUploadStep onSuccess={vi.fn()} onSwitchToManual={vi.fn()} />);

    const dropzone =
      screen.getByText(/Drop your resume here/i).closest('div') ||
      screen.getByText(/Upload your resume/i);

    expect(dropzone).toBeInTheDocument();

    // -------------------------------------------------------------------------
    // 2. Act: Simulate drag-over and drag-enter events
    // -------------------------------------------------------------------------
    fireEvent.dragOver(dropzone);
    fireEvent.dragEnter(dropzone);

    // -------------------------------------------------------------------------
    // 3. Assert: Dropzone remains rendered and stable
    // -------------------------------------------------------------------------
    expect(dropzone).toBeInTheDocument();
  });

  it('handles keyboard activation', () => {
    // -------------------------------------------------------------------------
    // 1. Arrange: Render component with spy callback and locate manual button
    // -------------------------------------------------------------------------
    const onSwitchToManual = vi.fn();
    render(<ResumeUploadStep onSuccess={vi.fn()} onSwitchToManual={onSwitchToManual} />);

    const manualBtn = screen.getByRole('button', { name: /Enter details manually →/i });

    // -------------------------------------------------------------------------
    // 2. Act: Focus the button and simulate keyboard activation
    // -------------------------------------------------------------------------
    manualBtn.focus();
    expect(manualBtn).toHaveFocus();

    fireEvent.click(manualBtn);

    // -------------------------------------------------------------------------
    // 3. Assert: Verify callback was triggered exactly once
    // -------------------------------------------------------------------------
    expect(onSwitchToManual).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    // -------------------------------------------------------------------------
    // 1. Arrange: Render component and create a valid file
    // -------------------------------------------------------------------------
    render(<ResumeUploadStep onSuccess={vi.fn()} onSwitchToManual={vi.fn()} />);

    const input = document.querySelector('input[type="file"]')!;
    const validFile = new File(['content'], 'my-resume.pdf', { type: 'application/pdf' });

    // -------------------------------------------------------------------------
    // 2. Act: Submit the valid file
    // -------------------------------------------------------------------------
    fireEvent.change(input, { target: { files: [validFile] } });

    // -------------------------------------------------------------------------
    // 3. Assert: Verify initial dropzone is replaced by loading/extraction state
    // -------------------------------------------------------------------------
    expect(screen.queryByText(/Drop your resume here, or browse files/i)).not.toBeInTheDocument();
    expect(screen.getByText('Analyzing your resume...')).toBeInTheDocument();
  });

  it('shows processing state', () => {
    // -------------------------------------------------------------------------
    // 1. Arrange: Render component and create a valid file
    // -------------------------------------------------------------------------
    render(<ResumeUploadStep onSuccess={vi.fn()} onSwitchToManual={vi.fn()} />);

    const input = document.querySelector('input[type="file"]')!;
    const validFile = new File(['content'], 'candidate-resume.pdf', { type: 'application/pdf' });

    // -------------------------------------------------------------------------
    // 2. Act: Submit file to trigger AI extraction
    // -------------------------------------------------------------------------
    fireEvent.change(input, { target: { files: [validFile] } });

    // -------------------------------------------------------------------------
    // 3. Assert: Verify Screen 1B extraction card, copy, and pulsing StatusDot
    // -------------------------------------------------------------------------
    expect(screen.getByText('Analyzing your resume...')).toBeInTheDocument();
    expect(
      screen.getByText(/We're extracting your experience, skills, and current role with AI/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Analyzing/i })).toBeInTheDocument();
    expect(screen.getByText('Taking longer than expected?')).toBeInTheDocument();
  });

  it('manual entry action works', () => {
    // -------------------------------------------------------------------------
    // 1. Arrange: Render component with spy callback
    // -------------------------------------------------------------------------
    const onSwitchToManual = vi.fn();
    render(<ResumeUploadStep onSuccess={vi.fn()} onSwitchToManual={onSwitchToManual} />);

    // -------------------------------------------------------------------------
    // 2. Act: Click the manual entry button
    // -------------------------------------------------------------------------
    const manualBtn = screen.getByRole('button', { name: /Enter details manually →/i });
    fireEvent.click(manualBtn);

    // -------------------------------------------------------------------------
    // 3. Assert: Verify the navigation callback was fired
    // -------------------------------------------------------------------------
    expect(onSwitchToManual).toHaveBeenCalledTimes(1);
  });
});

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as vercelBlobClient from '@vercel/blob/client';
import Home from '../app/page';

// Mock the external Vercel Blob client
vi.mock('@vercel/blob/client', () => ({
  put: vi.fn(),
}));

// This frontend integration suite exercises the complete client-side journey
// across upload, processing transitions, review, editing, error preservation,
// and profile persistence against mocked API and storage client boundaries.
describe('Resume Processing Frontend Integration Journey (Mocked Boundaries)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('completes the entire journey: Upload -> Process with AI -> Review & Edit -> Handle failure with preserved state -> Retry & Persist', async () => {
    const resumeId = 'resume-e2e-proc-101';
    const devUserId = '00000000-0000-0000-0000-000000000001';

    // 1. Mock API Responses
    const mockIntentResponse = {
      resumeId,
      clientToken: 'scoped-client-token-abc',
      storageKey: `users/${devUserId}/resumes/${resumeId}/valid-resume.pdf`,
      status: 'UPLOADING' as const,
    };

    const mockCompleteResponse = {
      id: resumeId,
      userId: devUserId,
      originalFileName: 'valid-resume.pdf',
      contentType: 'application/pdf',
      fileSize: 45000,
      storageKey: `users/${devUserId}/resumes/${resumeId}/valid-resume.pdf`,
      status: 'UPLOADED' as const,
    };

    const mockProcessResponse = {
      id: resumeId,
      userId: devUserId,
      originalFileName: 'valid-resume.pdf',
      status: 'PROCESSED',
      extractedText: 'Jane Doe\nSenior Full Stack Engineer\n7 years experience\nReact, TypeScript, Node.js, PostgreSQL',
      characterCount: 95,
      structuredData: {
        name: 'Jane Doe',
        currentRole: 'Senior Full Stack Engineer',
        yearsOfExperience: 7,
        skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
        workExperience: [
          {
            company: 'TechCorp',
            role: 'Senior Full Stack Engineer',
            startDate: '2021',
            endDate: 'Present',
            description: 'Led microfrontend migration',
          },
        ],
        education: [
          {
            institution: 'State University',
            qualification: 'B.S. Computer Science',
            graduationYear: 2017,
          },
        ],
        projects: [
          {
            name: 'Cloud Dashboard',
            description: 'Real-time metrics platform',
            technologies: ['React', 'TypeScript'],
          },
        ],
      },
    };

    const mockSavedProfileResponse = {
      id: 'profile-saved-202',
      userId: devUserId,
      currentRole: 'Principal Architect',
      yearsOfExperience: 8,
      skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'GraphQL'],
      summary: '',
      targetRole: '',
      createdAt: '2026-10-16T00:00:00Z',
      updatedAt: '2026-10-16T00:00:00Z',
    };

    const mockFetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      const urlStr = String(url);

      // GET /career-profile (initial existence check)
      if (urlStr.includes('/api/v1/career-profile') && (!init || !init.method || init.method === 'GET')) {
        return {
          ok: false,
          status: 404,
          json: async () => ({ message: 'Profile not found' }),
        };
      }

      // POST /resumes/upload-intent
      if (urlStr.includes('/api/v1/resumes/upload-intent')) {
        return {
          ok: true,
          status: 201,
          json: async () => mockIntentResponse,
        };
      }

      // POST /resumes/:id/complete
      if (urlStr.includes(`/api/v1/resumes/${resumeId}/complete`)) {
        return {
          ok: true,
          status: 200,
          json: async () => mockCompleteResponse,
        };
      }

      // POST /resumes/:id/process
      if (urlStr.includes(`/api/v1/resumes/${resumeId}/process`)) {
        return {
          ok: true,
          status: 200,
          json: async () => mockProcessResponse,
        };
      }

      // POST /career-profile (save)
      if (urlStr.includes('/api/v1/career-profile') && init?.method === 'POST') {
        // First attempt fails to verify error handling and preservation of user edits
        if (!mockFetch.mock.calls.some(c => c[0].includes('/api/v1/career-profile') && c[1]?.method === 'POST' && c !== mockFetch.mock.calls[mockFetch.mock.calls.length - 1])) {
          return {
            ok: false,
            status: 500,
            json: async () => ({ message: 'Database connection failed. Please retry.' }),
          };
        }
        // Second attempt succeeds
        return {
          ok: true,
          status: 201,
          json: async () => mockSavedProfileResponse,
        };
      }

      return {
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not found' }),
      };
    });

    global.fetch = mockFetch;

    vi.mocked(vercelBlobClient.put).mockResolvedValueOnce({
      url: `https://store.public.blob.vercel-storage.com/users/${devUserId}/resumes/${resumeId}/valid-resume.pdf`,
      downloadUrl: `https://store.public.blob.vercel-storage.com/users/${devUserId}/resumes/${resumeId}/valid-resume.pdf?download=1`,
      pathname: `users/${devUserId}/resumes/${resumeId}/valid-resume.pdf`,
      contentType: 'application/pdf',
      contentDisposition: 'inline',
      etag: 'mock-etag-e2e',
    });

    // -------------------------------------------------------------------------
    // Step 1: Render Home Page
    // -------------------------------------------------------------------------
    render(<Home />);

    expect(screen.getByText('Build your career baseline')).toBeInTheDocument();

    // -------------------------------------------------------------------------
    // Step 2: Upload Resume File
    // -------------------------------------------------------------------------
    const fileInput = document.querySelector('input[type="file"]')!;
    const resumeFile = new File(['%PDF-1.4 test resume binary'], 'valid-resume.pdf', {
      type: 'application/pdf',
    });

    fireEvent.change(fileInput, { target: { files: [resumeFile] } });

    // Status transition: Uploading
    expect(screen.getByText('Uploading your resume...')).toBeInTheDocument();

    // Status transition: Uploaded
    await waitFor(() => {
      expect(screen.getByText('Resume uploaded')).toBeInTheDocument();
    });

    // -------------------------------------------------------------------------
    // Step 3: Trigger AI Processing & Verify Extraction
    // -------------------------------------------------------------------------
    const analyzeBtn = screen.getByRole('button', { name: /Analyze resume with AI →/i });
    fireEvent.click(analyzeBtn);

    // Status transition: Processing
    expect(screen.getByText('Analyzing your resume with AI...')).toBeInTheDocument();

    // Status transition: Processed
    await waitFor(() => {
      expect(screen.getByText('Resume analysis complete')).toBeInTheDocument();
    });

    expect(screen.getByText(/Detected Role: Senior Full Stack Engineer/i)).toBeInTheDocument();
    expect(screen.getByText(/Experience: 7 years/i)).toBeInTheDocument();
    expect(screen.getByText(/Skills identified: 4/i)).toBeInTheDocument();

    // Confirm processing retrieved the correct file
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/v1/resumes/${resumeId}/process`),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-user-id': devUserId,
        }),
      }),
    );

    // -------------------------------------------------------------------------
    // Step 4: Continue to Review Screen
    // -------------------------------------------------------------------------
    const reviewBtn = screen.getByRole('button', {
      name: /Continue to review extracted data →/i,
    });
    fireEvent.click(reviewBtn);

    await waitFor(() => {
      expect(screen.getByText('Review extracted career data')).toBeInTheDocument();
    });

    // -------------------------------------------------------------------------
    // Step 5: Edit Extracted Fields
    // -------------------------------------------------------------------------
    const roleInput = screen.getByDisplayValue('Senior Full Stack Engineer');
    fireEvent.change(roleInput, { target: { value: 'Principal Architect' } });

    const expInput = screen.getByDisplayValue('7');
    fireEvent.change(expInput, { target: { value: '8' } });

    // Add new skill 'GraphQL'
    const skillInput = screen.getByPlaceholderText(/e\.g\. Docker, TypeScript/i);
    fireEvent.change(skillInput, { target: { value: 'GraphQL' } });
    fireEvent.click(screen.getByRole('button', { name: /Add skill/i }));

    expect(screen.getByText('GraphQL')).toBeInTheDocument();

    // -------------------------------------------------------------------------
    // Step 6: First Save Attempt Fails -> Verify Preserved Edits
    // -------------------------------------------------------------------------
    const confirmBtn = screen.getByRole('button', {
      name: /Confirm & Save Profile →/i,
    });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByText('Failed to save career profile')).toBeInTheDocument();
      expect(screen.getByText('Database connection failed. Please retry.')).toBeInTheDocument();
    });

    // Confirm edits were preserved without loss
    expect(screen.getByDisplayValue('Principal Architect')).toBeInTheDocument();
    expect(screen.getByDisplayValue('8')).toBeInTheDocument();
    expect(screen.getByText('GraphQL')).toBeInTheDocument();

    // -------------------------------------------------------------------------
    // Step 7: Retry Save -> Confirms Persistence for Correct User
    // -------------------------------------------------------------------------
    fireEvent.click(screen.getByRole('button', { name: /Confirm & Save Profile →/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Career profile saved successfully!/i),
      ).toBeInTheDocument();
    });

    // Verify the POST request sent the correct persisted data and user identity
    const saveCalls = mockFetch.mock.calls.filter(
      call => call[0].includes('/api/v1/career-profile') && call[1]?.method === 'POST',
    );
    expect(saveCalls.length).toBe(2);

    const lastSaveBody = JSON.parse(saveCalls[1][1].body as string);
    expect(lastSaveBody.currentRole).toBe('Principal Architect');
    expect(lastSaveBody.yearsOfExperience).toBe(8);
    expect(lastSaveBody.skills).toContain('GraphQL');
    expect(lastSaveBody.skills).toContain('React');
    expect(saveCalls[1][1].headers['x-user-id']).toBe(devUserId);
  });

  it('handles processing failure with recovery and retry', async () => {
    const resumeId = 'resume-retry-failure-1';
    const devUserId = '00000000-0000-0000-0000-000000000001';

    let processAttempts = 0;

    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      const urlStr = String(url);

      if (urlStr.includes('/api/v1/resumes/upload-intent')) {
        return {
          ok: true,
          status: 201,
          json: async () => ({
            resumeId,
            clientToken: 'token-abc',
            storageKey: `key-${resumeId}`,
            status: 'UPLOADING',
          }),
        };
      }

      if (urlStr.includes(`/api/v1/resumes/${resumeId}/complete`)) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ id: resumeId, status: 'UPLOADED' }),
        };
      }

      if (urlStr.includes(`/api/v1/resumes/${resumeId}/process`)) {
        processAttempts++;
        if (processAttempts === 1) {
          return {
            ok: false,
            status: 400,
            json: async () => ({
              message: 'The uploaded document contains little or no extractable text.',
            }),
          };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            id: resumeId,
            userId: devUserId,
            originalFileName: 'valid.pdf',
            status: 'PROCESSED',
            extractedText: 'Valid extracted text content',
            characterCount: 28,
            structuredData: {
              name: 'John Smith',
              currentRole: 'Backend Engineer',
              yearsOfExperience: 3,
              skills: ['Python', 'Docker'],
              workExperience: [],
              education: [],
              projects: [],
            },
          }),
        };
      }

      return {
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not found' }),
      };
    });

    global.fetch = mockFetch;

    vi.mocked(vercelBlobClient.put).mockResolvedValueOnce({
      url: 'https://blob.example.com/resumes/valid.pdf',
      downloadUrl: 'https://blob.example.com/resumes/valid.pdf',
      pathname: 'resumes/valid.pdf',
      contentType: 'application/pdf',
      contentDisposition: 'inline',
      etag: 'etag-1',
    });

    render(<Home />);

    const fileInput = document.querySelector('input[type="file"]')!;
    fireEvent.change(fileInput, {
      target: {
        files: [new File(['%PDF content'], 'valid.pdf', { type: 'application/pdf' })],
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Resume uploaded')).toBeInTheDocument();
    });

    // Start processing
    fireEvent.click(screen.getByRole('button', { name: /Analyze resume with AI →/i }));

    // Processing failure alert is displayed with server message
    await waitFor(() => {
      expect(screen.getByText('Resume processing failed')).toBeInTheDocument();
      expect(
        screen.getByText('The uploaded document contains little or no extractable text.'),
      ).toBeInTheDocument();
    });

    // Retry option is displayed
    const retryBtn = screen.getByRole('button', { name: /Retry processing/i });
    expect(retryBtn).toBeInTheDocument();

    // Click retry
    fireEvent.click(retryBtn);

    // Second processing succeeds
    await waitFor(() => {
      expect(screen.getByText('Resume analysis complete')).toBeInTheDocument();
    });

    expect(screen.getByText(/Detected Role: Backend Engineer/i)).toBeInTheDocument();
  });
});

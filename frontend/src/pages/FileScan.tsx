import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Search, FileBarChart, AlertCircle } from 'lucide-react';
import { AuthenticatedNavbar } from '@/src/components/navbar';
import { FileUpload } from '@/src/components/FileUpload';
import loadingScanSvg from '@/src/assets/loading_scan.svg';
import waitingSvg from '@/src/assets/waiting.svg';

import api from '@/src/api/axios';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ScanState =
  | { step: 'idle' }
  | { step: 'uploading'; fileName: string; fileHash: string }
  | { step: 'analyzing'; fileName: string; fileHash: string; progress: string }
  | { step: 'fetching-report'; fileName: string; fileHash: string }
  | { step: 'complete'; fileName: string; fileHash: string; report: any }
  | { step: 'error'; message: string };

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

async function computeSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}



/* ------------------------------------------------------------------ */
/*  Step indicator                                                     */
/* ------------------------------------------------------------------ */

const STEPS = [
  { key: 'uploading', label: 'Upload', icon: Upload },
  { key: 'analyzing', label: 'Analyze', icon: Search },
  { key: 'fetching-report', label: 'Report', icon: FileBarChart },
] as const;

function StepIndicator({ currentStep }: { currentStep: string }) {
  const stepOrder = ['uploading', 'analyzing', 'fetching-report', 'complete'];
  const currentIdx = stepOrder.indexOf(currentStep);

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const isActive = s.key === currentStep;
        const isComplete = currentIdx > i || currentStep === 'complete';

        return (
          <div key={s.key} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={`w-12 h-px transition-colors duration-500 ${isComplete ? 'bg-blue-400' : 'bg-slate-700'
                  }`}
              />
            )}
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${isActive
                  ? 'bg-blue-500/20 ring-2 ring-blue-400 text-blue-400'
                  : isComplete
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-slate-800 text-slate-600'
                  }`}
              >
                {isActive ? (
                  <img src={waitingSvg} alt="Loading" className="w-5 h-5" />
                ) : isComplete ? (
                  <Icon className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span
                className={`text-xs font-medium transition-colors ${isActive
                  ? 'text-blue-400'
                  : isComplete
                    ? 'text-slate-400'
                    : 'text-slate-600'
                  }`}
              >
                {s.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

const FileScan: React.FC = () => {
  const [state, setState] = useState<ScanState>({ step: 'idle' });
  const navigate = useNavigate();

  // Navigate to the merged report page when scan finishes
  useEffect(() => {
    if (state.step === 'complete') {
      navigate('/scan-report', {
        state: {
          report: state.report,
          fileName: state.fileName,
          fileHash: state.fileHash,
        },
        replace: true,
      });
    }
  }, [state.step, navigate]);

  const handleFileScan = useCallback(async (file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      setState({
        step: 'error',
        message: 'File is too large. Maximum allowed size is 50 MB.',
      });
      return;
    }

    try {
      // ── Compute SHA-256 client-side ──────────────────
      const fileHash = await computeSHA256(file);

      // ── Step 1: Upload to VirusTotal ─────────────────
      setState({ step: 'uploading', fileName: file.name, fileHash });

      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await api.post('/files/upload-to-vt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadData = uploadRes.data;

      // If the result was cached, go straight to showing it
      if (uploadData?.cached) {
        setState({
          step: 'complete',
          fileName: file.name,
          fileHash: uploadData.file_hash ?? fileHash,
          report: uploadData.analysis_result,
        });
        return;
      }

      // uploadData should be an analysis ID string
      const analysisId =
        typeof uploadData === 'string'
          ? uploadData
          : uploadData?.data?.id ?? '';

      if (!analysisId) {
        setState({
          step: 'error',
          message: uploadData?.error ?? 'Upload failed — no analysis ID returned.',
        });
        return;
      }

      // ── Step 2: Poll analysis until completed ────────
      setState({
        step: 'analyzing',
        fileName: file.name,
        fileHash,
        progress: 'Waiting for analysis to start…',
      });
      // Handling polling to wait for results from VirusTotal
      const MAX_RETRIES = 60;
      const POLL_INTERVAL = 10_000; // 10 seconds
      let completedReport: any | null = null;
      let resolvedHash = fileHash;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        await delay(POLL_INTERVAL);

        setState((prev) =>
          prev.step === 'analyzing'
            ? {
              ...prev,
              progress: `Polling analysis… (attempt ${attempt}/${MAX_RETRIES})`,
            }
            : prev
        );

        try {
          const analysisRes = await api.get(`/files/vt-analysis/${analysisId}`, {
            params: { file_hash: fileHash },
          });
          const analysisData = analysisRes.data;
          // If completed, exit the loop
          if (analysisData?.status === 'completed') {
            resolvedHash = analysisData?.sha256 ?? fileHash;
            completedReport = analysisData?.report ?? null;
            break;
          }
        } catch {
          // If there's an error, retry until the limit is reached
        }
      }

      if (!completedReport) {
        setState({ step: 'fetching-report', fileName: file.name, fileHash: resolvedHash });
        const reportRes = await api.get('/files/vt-report/', {
          params: { file_hash: resolvedHash },
        });

        if (reportRes.data?.error) {
          setState({
            step: 'error',
            message: reportRes.data.error,
          });
          return;
        }

        completedReport = reportRes.data;
      }

      setState({
        step: 'complete',
        fileName: file.name,
        fileHash: resolvedHash,
        report: completedReport,
      });
    } catch (err: any) {
      setState({
        step: 'error',
        message:
          err?.response?.data?.detail ??
          err?.response?.data?.error ??
          err?.message ??
          'An unexpected error occurred.',
      });
    }
  }, []);

  const handleReset = () => setState({ step: 'idle' });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <AuthenticatedNavbar />

      {/* ── Body ──────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Idle — show upload prompt */}
        {state.step === 'idle' && (
          <div className="flex flex-col items-center pt-12">
            <h2 className="text-3xl font-bold text-center mb-2">
              Analyse suspicious files
            </h2>
            <p className="text-slate-500 text-center mb-12 max-w-md">
              Upload a file to scan it with 70+ antivirus engines instantly.
            </p>
            <FileUpload onFileSelect={handleFileScan} />
          </div>
        )}

        {/* In-progress steps */}
        {(state.step === 'uploading' ||
          state.step === 'analyzing' ||
          state.step === 'fetching-report') && (
            <div className="flex flex-col items-center pt-12">
              <StepIndicator currentStep={state.step} />

              <div className="flex flex-col items-center space-y-4 mt-4">
                {/* Animated bar loader */}
                <div className="w-16 h-16 flex items-center justify-center">
                  <img src={loadingScanSvg} alt="Loading" className="w-14 h-14" />
                </div>

                <p className="text-lg font-medium text-slate-300">
                  {state.step === 'uploading' && 'Uploading file to scanner…'}
                  {state.step === 'analyzing' && 'Analyzing file with security engines…'}
                  {state.step === 'fetching-report' && 'Fetching detailed report…'}
                </p>

                <p className="text-sm text-slate-500">
                  {'fileName' in state && state.fileName}
                </p>

                {state.step === 'analyzing' && (
                  <p className="text-xs text-slate-600">{state.progress}</p>
                )}
              </div>
            </div>
          )}

        {/* Error */}
        {state.step === 'error' && (
          <div className="flex flex-col items-center pt-12 space-y-6">
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-6 max-w-lg w-full">
              <AlertCircle className="w-6 h-6 text-red-400 shrink-0" />
              <p className="text-sm text-red-300">{state.message}</p>
            </div>
            <button
              onClick={handleReset}
              className="px-6 py-2 text-sm text-slate-400 border border-slate-700 rounded-lg hover:text-white hover:border-slate-500 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

      </main>
    </div>
  );
};

export default FileScan;

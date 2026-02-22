import { useState, useCallback } from 'react';
import {
  Upload,
  Search,
  FileBarChart,
  BrainCircuit,
  AlertCircle,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import loadingSvg from '@/src/assets/loading.svg';
import { FileUpload } from '@/src/components/FileUpload';
import api from '@/src/api/axios';
import ReactMarkdown from 'react-markdown';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type RecState =
  | { step: 'idle' }
  | { step: 'uploading'; fileName: string }
  | { step: 'analyzing'; fileName: string; progress: string }
  | { step: 'fetching-report'; fileName: string }
  | { step: 'generating'; fileName: string }
  | {
      step: 'complete';
      fileName: string;
      fileHash: string;
      recommendation: string;
    }
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
  { key: 'generating', label: 'AI Advice', icon: BrainCircuit },
] as const;

function StepIndicator({ currentStep }: { currentStep: string }) {
  const stepOrder = [
    'uploading',
    'analyzing',
    'fetching-report',
    'generating',
    'complete',
  ];
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
                className={`w-10 h-px transition-colors duration-500 ${
                  isComplete ? 'bg-purple-400' : 'bg-slate-700'
                }`}
              />
            )}
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                  isActive
                    ? 'bg-purple-500/20 ring-2 ring-purple-400 text-purple-400'
                    : isComplete
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'bg-slate-800 text-slate-600'
                }`}
              >
                {isActive ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span
                className={`text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-purple-400'
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

const Recommendation: React.FC = () => {
  const [state, setState] = useState<RecState>({ step: 'idle' });

  const handleFileScan = useCallback(async (file: File) => {
    try {
      // ── Step 1: Upload to VirusTotal ─────────────────
      setState({ step: 'uploading', fileName: file.name });

      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await api.post('/files/upload-to-vt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadData = uploadRes.data;

      // If the result was cached, skip straight to report
      let reportData: any = null;
      let fileHash = '';

      if (uploadData?.cached) {
        reportData = uploadData.analysis_result;
        fileHash = uploadData.file_hash ?? (await computeSHA256(file));
      } else {
        // uploadData should be an analysis ID string
        const analysisId =
          typeof uploadData === 'string'
            ? uploadData
            : uploadData?.data?.id ?? '';

        if (!analysisId) {
          setState({
            step: 'error',
            message:
              uploadData?.error ?? 'Upload failed — no analysis ID returned.',
          });
          return;
        }

        // ── Step 2: Poll analysis until completed ──────
        setState({
          step: 'analyzing',
          fileName: file.name,
          progress: 'Waiting for analysis to start…',
        });

        const MAX_RETRIES = 60;
        const POLL_INTERVAL = 10_000;
        let resolvedHash = '';

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
            const analysisRes = await api.get(
              `/files/vt-analysis/${analysisId}`
            );
            const data = analysisRes.data;
            if (
              typeof data === 'string' &&
              data.length > 0 &&
              !data.startsWith('{')
            ) {
              resolvedHash = data;
              break;
            }
          } catch {
            // Silently retry
          }
        }

        if (!resolvedHash) {
          setState({
            step: 'error',
            message:
              'Analysis timed out. Try again in a few minutes.',
          });
          return;
        }

        fileHash = resolvedHash;

        // ── Step 3: Fetch full VT report ───────────────
        setState({ step: 'fetching-report', fileName: file.name });

        const reportRes = await api.get('/files/vt-report/', {
          params: { file_hash: fileHash },
        });

        if (reportRes.data?.error) {
          setState({ step: 'error', message: reportRes.data.error });
          return;
        }

        reportData = reportRes.data;
      }

      // ── Step 4: Get AI recommendation ────────────────
      setState({ step: 'generating', fileName: file.name });

      const recRes = await api.post('/recommend/recommendation', reportData);

      if (recRes.data?.error) {
        setState({ step: 'error', message: recRes.data.error });
        return;
      }

      setState({
        step: 'complete',
        fileName: file.name,
        fileHash,
        recommendation: recRes.data?.recommendation ?? recRes.data,
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
      {/* ── Header ──────────────────────────────────────── */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur supports-backdrop-filter:bg-slate-950/60 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-purple-400">Cyber</span>Sieve{' '}
            <span className="text-sm font-normal text-slate-500">
              — AI Recommendation
            </span>
          </h1>
          <span className="text-xs text-slate-600 hidden sm:inline">
            Powered by VirusTotal + Groq
          </span>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Idle */}
        {state.step === 'idle' && (
          <div className="flex flex-col items-center pt-12">
            <h2 className="text-3xl font-bold text-center mb-2">
              AI Security Recommendation
            </h2>
            <p className="text-slate-500 text-center mb-12 max-w-md">
              Upload a file to scan it with VirusTotal, then get AI-powered
              security guidance based on the analysis.
            </p>
            <FileUpload onFileSelect={handleFileScan} />
          </div>
        )}

        {/* In-progress steps */}
        {(state.step === 'uploading' ||
          state.step === 'analyzing' ||
          state.step === 'fetching-report' ||
          state.step === 'generating') && (
          <div className="flex flex-col items-center pt-12">
            <StepIndicator currentStep={state.step} />

            <div className="flex flex-col items-center space-y-4 mt-4">
              {/* Animated bar loader */}
              <div className="w-16 h-16 flex items-center justify-center">
                <img src={loadingSvg} alt="Loading" className="w-14 h-14" />
              </div>

              <p className="text-lg font-medium text-slate-300">
                {state.step === 'uploading' && 'Uploading file to scanner…'}
                {state.step === 'analyzing' &&
                  'Analyzing file with security engines…'}
                {state.step === 'fetching-report' &&
                  'Fetching detailed report…'}
                {state.step === 'generating' &&
                  'Generating AI recommendation…'}
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

        {/* Complete — show recommendation */}
        {state.step === 'complete' && (
          <div className="space-y-6">
            {/* Header card */}
            <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                  <BrainCircuit className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-200">
                    AI Security Analysis
                  </h3>
                  <p className="text-sm text-slate-500">{state.fileName}</p>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 border border-slate-700 rounded-lg hover:text-white hover:border-slate-500 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Scan another
              </button>
            </div>

            {/* Recommendation content */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
              <div className="prose prose-invert max-w-none prose-h2:text-2xl prose-h2:font-bold prose-h2:text-purple-400 prose-h2:border-b prose-h2:border-slate-700 prose-h2:pb-3 prose-h2:mb-4 prose-h3:text-lg prose-h3:font-semibold prose-h3:text-slate-100 prose-h3:mt-6 prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-slate-100 prose-a:text-purple-400 prose-hr:border-slate-700 prose-hr:my-6">
                <ReactMarkdown>{state.recommendation}</ReactMarkdown>
              </div>
            </div>

            {/* File hash */}
            <div className="text-center">
              <p className="text-xs text-slate-600">
                SHA-256: {state.fileHash}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Recommendation;

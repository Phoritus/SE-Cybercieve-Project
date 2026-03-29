import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { SimpleNavbar } from '@/src/components/navbar';
import api from '@/src/api/axios';
import ReactMarkdown from 'react-markdown';
import loadingSvg from '@/src/assets/loading_scan.svg';

/* ------------------------------------------------------------------ */

interface AnalysisStats {
  malicious: number;
  suspicious: number;
  undetected: number;
  harmless: number;
  timeout: number;
  'confirmed-timeout': number;
  failure: number;
  'type-unsupported': number;
}



interface LocationState {
  report: any;
  fileName: string;
  fileHash: string;
  recommendation?: string; // cached LLM result
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getThreatInfo(stats: AnalysisStats) {
  const total =
    stats.malicious + stats.suspicious + stats.undetected + stats.harmless;
  const detections = stats.malicious + stats.suspicious;

  if (detections === 0)
    return {
      level: 'clean' as const,
      label: 'No threats detected',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      ring: 'ring-emerald-500/20',
      barColor: 'bg-emerald-500',
      hex: '#10b981',
      icon: 'carbon:security',
      detections,
      total,
    };
  return {
    level: 'high' as const,
    label: 'Malicious',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    ring: 'ring-red-500/20',
    barColor: 'bg-red-500',
    hex: '#ef4444',
    icon: 'carbon:security',
    detections,
    total,
  };
}



/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const ScanReport: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  // Initialize from cached state if available (back/forward navigation)
  const [recommendation, setRecommendation] = useState<string | null>(
    state?.recommendation ?? null
  );
  const [recLoading, setRecLoading] = useState(!state?.recommendation);
  const [recError, setRecError] = useState<string | null>(null);

  // If no state, redirect back to /scan
  useEffect(() => {
    if (!state) {
      navigate('/scan', { replace: true });
    }
  }, [state, navigate]);

  // Fetch AI recommendation only if not already cached in router state
  useEffect(() => {
    if (!state?.report || state?.recommendation) return;

    const abortController = new AbortController();

    const fetchRec = async () => {
      setRecLoading(true);
      setRecError(null);
      try {
        const res = await api.post('/recommend/recommendation', state.report, {
          signal: abortController.signal,
        });
        const rec = res.data?.recommendation ?? res.data;
        setRecommendation(rec);

        // Persist into router state so back/forward reuses it
        navigate(location.pathname, {
          replace: true,
          state: { ...state, recommendation: rec },
        });
      } catch (err: any) {
        if (abortController.signal.aborted) return;
        setRecError(
          err?.response?.data?.detail ??
          err?.response?.data?.error ??
          err?.message ??
          'Failed to generate recommendation.'
        );
      } finally {
        if (!abortController.signal.aborted) setRecLoading(false);
      }
    };

    fetchRec();
    return () => {
      abortController.abort();
    };
  }, [state?.report, state?.recommendation]);

  if (!state) return null;

  const { report, fileName, fileHash } = state;

  // Extract VT data
  const attrs = report?.data?.attributes ?? report?.attributes ?? report ?? {};
  const stats: AnalysisStats = attrs.last_analysis_stats ?? {
    malicious: 0,
    suspicious: 0,
    undetected: 0,
    harmless: 0,
    timeout: 0,
    'confirmed-timeout': 0,
    failure: 0,
    'type-unsupported': 0,
  };
  const threat = getThreatInfo(stats);
  const ThreatIcon = threat.icon;

  const detectionPct =
    threat.total > 0
      ? Math.round((threat.detections / threat.total) * 100)
      : 0;

  // Popular threat classification
  const threatClassification =
    attrs.popular_threat_classification?.suggested_threat_label ??
    (threat.detections > 0 ? 'Detected' : 'None detected');

  // Sandbox verdicts
  const sandboxVerdicts = attrs.sandbox_verdicts ?? {};
  const sandboxEntries = Object.entries(sandboxVerdicts);
  const sandboxVerdict =
    sandboxEntries.length > 0
      ? (sandboxEntries[0] as [string, any])[1]?.category ?? 'N/A'
      : 'N/A';

  // Suspicious capabilities / tags
  const tags: string[] = attrs.tags ?? [];
  const suspiciousCapabilities =
    tags.length > 0
      ? tags
        .filter(
          (t: string) =>
            t.includes('suspicious') ||
            t.includes('packer') ||
            t.includes('obfuscated')
        )
        .join(', ') || 'None detected'
      : 'None detected';


  const handleScanAnother = () => navigate('/scan');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <SimpleNavbar />

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* ── Threat Header Banner ─────────────────────── */}
        <div
          className={`relative overflow-hidden rounded-2xl border ${threat.border} ${threat.bg} ring-1 ${threat.ring} p-6 mb-8`}
        >
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-transparent to-slate-950/30 pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Icon + detection info */}
            <div className="flex items-center gap-5 flex-1 min-w-0">
              <div className="shrink-0 flex items-center justify-center">
                <Icon
                  icon={ThreatIcon}
                  className="w-16 h-16 shrink-0 opacity-95"
                  style={{ color: threat.hex, filter: `drop-shadow(0 0 8px ${threat.hex}66)` }}
                />
              </div>
              <div className="min-w-0">
                <h2 className={`text-3xl font-bold ${threat.color}`}>
                  {threat.detections}/{threat.total}
                  <span className="text-base font-normal text-slate-400 ml-3">
                    security vendors flagged this file
                  </span>
                </h2>
                <p
                  className={`text-sm font-semibold mt-1 ${threat.color}`}
                >
                  {threat.label}
                </p>
                <div className="mt-3 space-y-1 text-sm text-slate-400">
                  <p className="flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-2 shrink-0" />
                    <span className="text-slate-500">File:</span>
                    <span className="text-slate-300 ml-1">
                      {attrs.meaningful_name ?? fileName}
                    </span>
                  </p>
                  <p className="flex items-center truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-2 shrink-0" />
                    <span className="text-slate-500">SHA_256:</span>
                    <span className="text-slate-300 ml-1 font-mono text-xs">
                      {attrs.sha256 ?? fileHash}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 shrink-0">
              <button
                onClick={handleScanAnother}
                className="flex items-center gap-2 px-5 py-2.5 text-sm text-slate-300 bg-slate-800/60 border border-slate-700 rounded-lg hover:text-white hover:border-slate-500 hover:bg-slate-800 transition-all"
              >
                <Icon icon="pajamas:redo" className="w-3.5 h-3.5" style={{ color: "#FFFFFF80" }} />
                Scan another
              </button>
              <button
                onClick={() => navigate('/scan-details', { state })}
                className="flex items-center gap-2 px-5 py-2.5 text-sm text-slate-400 bg-slate-800/40 border border-slate-700/60 rounded-lg hover:text-white hover:border-slate-500 transition-all"
              >
                <Icon icon="ant-design:more-outlined" className="w-5.5 h-5.5" />
                show more
              </button>
            </div>
          </div>
        </div>

        {/* ── Three-column Cards ───────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {/* Card 1: Scan Result */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-800">
              <Icon
                icon="carbon:security"
                className={`w-7 h-7 shrink-0 ${threat.color}`}
              />
              <h3 className="text-lg font-medium text-slate-100">
                Scan Result
              </h3>
            </div>

            <p className="text-sm font-medium text-slate-300 mb-3">
              Detection Score
            </p>

            {/* Progress bar */}
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-700 ${threat.barColor}`}
                style={{
                  width: `${threat.total > 0 ? Math.max(detectionPct, threat.detections > 0 ? 3 : 0) : 100}%`,
                  backgroundColor:
                    threat.detections === 0
                      ? 'rgb(16 185 129)' // emerald-500
                      : undefined,
                }}
              />
            </div>

            <p className="text-sm text-slate-500 mb-4">
              <span className={`font-semibold ${threat.color}`}>
                {threat.detections}/{threat.total}
              </span>{' '}
              engines detected this file.{' '}
              <span className="text-slate-600 font-medium">{detectionPct}%</span>
            </p>

            <div className="flex items-center gap-3 pt-3">
              <Icon icon="streamline:threat-document" className="w-5 h-5" style={{ color: '#4E9DF7' }} />
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-100">
                  Threat Identifier :
                </span>
                <span className="text-sm text-slate-400">
                  {threatClassification}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Behavioral Indicators */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-800">
              <Icon icon="iconoir:brain" className={`w-7 h-7 ${threat.color}`} />
              <h3 className="text-lg font-medium text-slate-100">
                Behavioral Indicators
              </h3>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <Icon icon="mdi:check" className="w-5 h-5 shrink-0" style={{ color: '#4E9DF7' }} />
                  <p className="text-base font-semibold text-slate-100">
                    Suspicious Capabilities:
                  </p>
                </div>
                <p className="text-sm text-slate-400 ml-8">
                  {suspiciousCapabilities}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-1">
                  <Icon icon="garden:sandbox-stroke-12" className="w-5 h-5 text-slate-500" style={{ color: '#4E9DF7' }} />
                  <p className="text-base font-semibold text-slate-100">
                    Sandbox Verdict:
                  </p>
                </div>
                <p className="text-sm text-slate-400 ml-8">
                  {sandboxVerdict}
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: File Info */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-800">
              <Icon icon="iconamoon:file-thin" className={`w-7 h-7 ${threat.color}`} />
              <h3 className="text-lg font-medium text-slate-100">
                File Information
              </h3>
            </div>

            <div className="space-y-5 px-1">
              <div className="flex items-center gap-3">
                <Icon icon="wordpress:term-name" className="w-6 h-6 shrink-0" style={{ color: '#4E9DF7' }} />
                <div className="min-w-0 flex items-center gap-2 text-base">
                  <span className="font-semibold text-slate-100">Name:</span>
                  <span className="text-slate-400 truncate">
                    {attrs.meaningful_name ?? fileName}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Icon icon="tdesign:file-1" className="w-6 h-6 shrink-0" style={{ color: '#4E9DF7' }} />
                <div className="min-w-0 flex items-center gap-2 text-base">
                  <span className="font-semibold text-slate-100">Type :</span>
                  <span className="text-slate-400 truncate">
                    {attrs.magika ??
                      attrs.type_description ??
                      attrs.type_tag ??
                      'Unknown'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Icon icon="cuida:settings-outline" className="w-6 h-6 shrink-0" style={{ color: '#4E9DF7' }} />
                <div className="min-w-0 flex items-center gap-2 text-base">
                  <span className="font-semibold text-slate-100 shrink-0">SHA-256 :</span>
                  <span
                    className="text-slate-400 font-mono text-sm truncate"
                    title={attrs.sha256 ?? fileHash}
                  >
                    {attrs.sha256 ?? fileHash}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* ── Initial Guidance & Remediation ───────────── */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
          {/* Section header */}
          <div className="flex items-center gap-3 px-6 pt-6 pb-4">
            <Icon icon="hugeicons:tools" className={`w-8 h-8 shrink-0 ${threat.color}`} />
            <h3 className="text-lg font-medium text-slate-100">
              Initial Guidance & Remediation
            </h3>
          </div>
          <div className="mx-6 border-b border-slate-800" />

          {/* Content */}
          <div className="px-6 py-5">
            {recLoading && (
              <div className="flex flex-col items-center justify-center py-10 gap-4">
                <img
                  src={loadingSvg}
                  alt="Loading"
                  className="w-12 h-12"
                />
                <p className="text-sm text-slate-400">
                  Generating AI-powered guidance…
                </p>
              </div>
            )}

            {recError && (
              <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <Icon icon="mdi:alert-circle-outline" className="w-5 h-5 text-red-400 shrink-0" />
                <p className="text-sm text-red-300">{recError}</p>
              </div>
            )}

            {!recLoading && !recError && recommendation && (
              <div className="prose prose-invert max-w-none prose-h2:text-xl prose-h2:font-bold prose-h2:text-emerald-400 prose-h2:border-b prose-h2:border-slate-700 prose-h2:pb-3 prose-h2:mb-4 prose-h3:text-lg prose-h3:font-semibold prose-h3:text-slate-100 prose-h3:mt-6 prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-slate-100 prose-a:text-emerald-400 prose-hr:border-slate-700 prose-hr:my-6 prose-ul:text-slate-300">
                <ReactMarkdown>{recommendation}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ScanReport;

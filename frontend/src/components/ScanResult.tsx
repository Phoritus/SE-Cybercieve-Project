import {
  ShieldCheck,
  ShieldX,
  ShieldQuestion,
  FileText,
  Hash,
  HardDrive,
  FileType,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';
import { useState, useMemo } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
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

interface EngineResult {
  category: string;
  engine_name: string;
  engine_version: string | null;
  result: string | null;
  method: string;
  engine_update: string;
}

interface ScanResultProps {
  report: any;
  fileName: string;
  fileHash: string;
  onScanAnother: () => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getThreatInfo(stats: AnalysisStats) {
  const total =
    stats.malicious +
    stats.suspicious +
    stats.undetected +
    stats.harmless +
    stats.timeout +
    stats['type-unsupported'] +
    stats.failure;

  const detections = stats.malicious + stats.suspicious;

  if (detections === 0)
    return {
      level: 'clean' as const,
      label: 'No threats detected',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      ring: 'ring-emerald-500/20',
      icon: ShieldCheck,
      detections,
      total,
    };
  if (detections <= 5)
    return {
      level: 'low' as const,
      label: 'Low risk',
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      ring: 'ring-yellow-500/20',
      icon: ShieldQuestion,
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
    icon: ShieldX,
    detections,
    total,
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function categoryColor(category: string): string {
  switch (category) {
    case 'malicious':
      return 'text-red-400';
    case 'suspicious':
      return 'text-yellow-400';
    case 'undetected':
      return 'text-slate-500';
    case 'harmless':
      return 'text-emerald-400';
    default:
      return 'text-slate-600';
  }
}

function categoryBadge(category: string): string {
  const base = 'text-xs px-2 py-0.5 rounded-full font-medium';
  switch (category) {
    case 'malicious':
      return `${base} bg-red-500/15 text-red-400`;
    case 'suspicious':
      return `${base} bg-yellow-500/15 text-yellow-400`;
    case 'undetected':
      return `${base} bg-slate-500/15 text-slate-400`;
    case 'harmless':
      return `${base} bg-emerald-500/15 text-emerald-400`;
    default:
      return `${base} bg-slate-500/15 text-slate-600`;
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ScanResult({ report, fileName, fileHash, onScanAnother }: ScanResultProps) {
  const [showAllEngines, setShowAllEngines] = useState(false);
  const [filterDetected, setFilterDetected] = useState(false);

  // Extract data from VT report
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

  const results: Record<string, EngineResult> = attrs.last_analysis_results ?? {};
  const threat = getThreatInfo(stats);
  const ThreatIcon = threat.icon;

  // Sort engines: detected first, then alphabetical
  const sortedEngines = useMemo(() => {
    const entries = Object.entries(results);
    entries.sort(([, a], [, b]) => {
      const aDetected = a.category === 'malicious' || a.category === 'suspicious';
      const bDetected = b.category === 'malicious' || b.category === 'suspicious';
      if (aDetected && !bDetected) return -1;
      if (!aDetected && bDetected) return 1;
      return a.engine_name.localeCompare(b.engine_name);
    });
    if (filterDetected) {
      return entries.filter(
        ([, r]) => r.category === 'malicious' || r.category === 'suspicious'
      );
    }
    return entries;
  }, [results, filterDetected]);

  const displayedEngines = showAllEngines ? sortedEngines : sortedEngines.slice(0, 20);

  const statCards = [
    { label: 'Malicious', value: stats.malicious, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Suspicious', value: stats.suspicious, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Undetected', value: stats.undetected, color: 'text-slate-400', bg: 'bg-slate-500/10' },
    { label: 'Harmless', value: stats.harmless, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Timeout', value: stats.timeout, color: 'text-gray-500', bg: 'bg-gray-500/10' },
    { label: 'Unsupported', value: stats['type-unsupported'], color: 'text-gray-500', bg: 'bg-gray-500/10' },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* ── Threat Header ─────────────────────────────────── */}
      <div
        className={`flex items-center gap-6 p-6 rounded-xl border ${threat.border} ${threat.bg} ring-1 ${threat.ring}`}
      >
        <div className="shrink-0">
          <ThreatIcon className={`w-16 h-16 ${threat.color}`} strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className={`text-2xl font-bold ${threat.color}`}>
            {threat.detections}/{threat.total}
            <span className="text-base font-normal text-slate-400 ml-2">
              security vendors flagged this file
            </span>
          </h2>
          <p className={`text-sm font-semibold mt-1 ${threat.color}`}>{threat.label}</p>
        </div>
        <button
          onClick={onScanAnother}
          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 border border-slate-700 rounded-lg hover:text-white hover:border-slate-500 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Scan another
        </button>
      </div>

      {/* ── File Info ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard
          icon={<FileText className="w-4 h-4 text-blue-400" />}
          label="File Name"
          value={attrs.meaningful_name ?? fileName}
        />
        <InfoCard
          icon={<FileType className="w-4 h-4 text-blue-400" />}
          label="Type"
          value={attrs.magika ?? 'Unknown'}
        />
        <InfoCard
          icon={<Hash className="w-4 h-4 text-blue-400" />}
          label="SHA-256"
          value={attrs.sha256 ?? fileHash}
          mono
        />
        <InfoCard
          icon={<HardDrive className="w-4 h-4 text-blue-400" />}
          label="Size"
          value={attrs.size ? formatBytes(attrs.size) : 'Unknown'}
        />
      </div>

      {/* ── Stats Summary ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {statCards.map((s) => (
          <div
            key={s.label}
            className={`${s.bg} rounded-lg p-3 text-center border border-slate-800`}
          >
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Engine Results ────────────────────────────────── */}
      <div className="border border-slate-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/40 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-slate-300">
            Engine Results ({sortedEngines.length})
          </h3>
          <button
            onClick={() => setFilterDetected(!filterDetected)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${filterDetected
                ? 'border-red-500/50 text-red-400 bg-red-500/10'
                : 'border-slate-700 text-slate-500 hover:text-slate-300'
              }`}
          >
            {filterDetected ? 'Showing detected only' : 'Show detected only'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-800">
                <th className="text-left px-4 py-2">Engine</th>
                <th className="text-left px-4 py-2">Result</th>
                <th className="text-left px-4 py-2">Category</th>
                <th className="text-left px-4 py-2 hidden sm:table-cell">Version</th>
              </tr>
            </thead>
            <tbody>
              {displayedEngines.map(([key, engine]) => (
                <tr
                  key={key}
                  className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-4 py-2 font-medium text-slate-300">
                    {engine.engine_name}
                  </td>
                  <td className={`px-4 py-2 ${categoryColor(engine.category)}`}>
                    {engine.result ?? '—'}
                  </td>
                  <td className="px-4 py-2">
                    <span className={categoryBadge(engine.category)}>
                      {engine.category}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-600 hidden sm:table-cell">
                    {engine.engine_version ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedEngines.length > 20 && (
          <button
            onClick={() => setShowAllEngines(!showAllEngines)}
            className="w-full flex items-center justify-center gap-1 px-4 py-2.5 text-sm text-slate-400 hover:text-white bg-slate-800/30 border-t border-slate-800 transition-colors"
          >
            {showAllEngines ? (
              <>
                Show less <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                Show all {sortedEngines.length} engines <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function InfoCard({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-800">
      <div className="mt-0.5">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-500">{label}</p>
        <p
          className={`text-sm text-slate-300 truncate ${mono ? 'font-mono text-xs mt-0.5' : ''}`}
          title={value}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

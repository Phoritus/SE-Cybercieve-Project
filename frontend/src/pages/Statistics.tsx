import { useState, useEffect } from 'react';
import api from '@/src/api/axios';
import { AuthenticatedNavbar } from '@/src/components/navbar';
import LoadingSpinner from '@/src/components/LoadingSpinner';
import { Icon } from '@iconify/react';

/* ------------------------------------------------------------------ */
/*  Donut Chart Component                                              */
/* ------------------------------------------------------------------ */

interface DonutChartProps {
  percentage: number;
  detectedColor: string;
  safeColor: string;
  size?: number;
}

function DonutChart({ percentage, detectedColor, safeColor, size = 200 }: DonutChartProps) {
  const strokeWidth = 30;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const detectedOffset = circumference - (percentage / 100) * circumference;
  const center = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
      {/* Background ring (safe) */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={safeColor}
        strokeWidth={strokeWidth}
      />
      {/* Detected segment */}
      {percentage > 0 && (
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={detectedColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={detectedOffset}
          strokeLinecap="butt"
          className="transition-all duration-1000 ease-out"
        />
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  File Type Stats Card                                              */
/* ------------------------------------------------------------------ */

interface FileTypeCardProps {
  title: string;
  totalScanned: number;
  detectedPercentage: number;
  detectedColor: string;
  safeColor: string;
  icon: React.ReactNode;
}

function FileTypeCard({ title, totalScanned, detectedPercentage, detectedColor, safeColor, icon }: FileTypeCardProps) {
  const safePercentage = 100 - detectedPercentage;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col hover:border-slate-700 transition-colors">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-2">
        <div className="flex items-center justify-center text-2xl">
          {icon}
        </div>
        <h3 className="text-lg font-bold text-slate-100 leading-none mt-1">{title}</h3>
      </div>
      <p className="text-sm text-slate-500 mb-6">{totalScanned.toLocaleString()} Scanned</p>

      {/* Donut */}
      <div className="flex justify-center relative">
        <DonutChart
          percentage={detectedPercentage}
          detectedColor={detectedColor}
          safeColor={safeColor}
          size={130}
        />
        {/* Center percentage */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-slate-100">{detectedPercentage}%</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-6 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: detectedColor }} />
          <span className="text-slate-400">{detectedPercentage}% Detected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: safeColor }} />
          <span className="text-slate-400">{safePercentage}% Not Detected</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Icon & color mapping per file type                                 */
/* ------------------------------------------------------------------ */

const iconClass = "w-6 h-6 inline-block";

const FILE_TYPE_META: Record<string, { icon: React.ReactNode; detectedColor: string }> = {
  exe:  { icon: <Icon icon="mdi:file-document" className={iconClass} color="#ef4444" />,  detectedColor: '#ef4444' },
  msi:  { icon: <Icon icon="mdi:file-document" className={iconClass} color="#ef4444" />,  detectedColor: '#ef4444' },
  dll:  { icon: <Icon icon="mdi:file-document" className={iconClass} color="#ef4444" />,  detectedColor: '#ef4444' },
  txt:  { icon: <Icon icon="mdi:file-document" className={iconClass} color="#3b82f6" />, detectedColor: '#eab308' },
  pdf:  { icon: <Icon icon="mdi:file-pdf" className={iconClass} color="#ef4444" />,  detectedColor: '#ef4444' },
  doc:  { icon: <Icon icon="mdi:file-word" className={iconClass} color="#3b82f6" />, detectedColor: '#3b82f6' },
  docx: { icon: <Icon icon="mdi:file-word" className={iconClass} color="#3b82f6" />, detectedColor: '#3b82f6' },
  csv:  { icon: <Icon icon="mdi:file-delimited" className={iconClass} color="#22c55e" />,  detectedColor: '#22c55e' },
  xls:  { icon: <Icon icon="mdi:file-delimited" className={iconClass} color="#22c55e" />,  detectedColor: '#22c55e' },
  xlsx: { icon: <Icon icon="mdi:file-delimited" className={iconClass} color="#22c55e" />,  detectedColor: '#22c55e' },
  png:  { icon: <Icon icon="mdi:file-image" className={iconClass} color="#a855f7" />,  detectedColor: '#a855f7' },
  jpg:  { icon: <Icon icon="mdi:file-image" className={iconClass} color="#a855f7" />,  detectedColor: '#a855f7' },
  jpeg: { icon: <Icon icon="mdi:file-image" className={iconClass} color="#a855f7" />,  detectedColor: '#a855f7' },
  gif:  { icon: <Icon icon="mdi:file-image" className={iconClass} color="#a855f7" />,  detectedColor: '#a855f7' },
  zip:  { icon: <Icon icon="mdi:folder-zip" className={iconClass} color="#f97316" />, detectedColor: '#f97316' },
  rar:  { icon: <Icon icon="mdi:folder-zip" className={iconClass} color="#f97316" />, detectedColor: '#f97316' },
  '7z': { icon: <Icon icon="mdi:folder-zip" className={iconClass} color="#f97316" />, detectedColor: '#f97316' },
};

const DEFAULT_META = { icon: <Icon icon="mdi:file-document-outline" className={iconClass} color="#64748b" />, detectedColor: '#64748b' };

/* ------------------------------------------------------------------ */
/*  Stats data type                                                    */
/* ------------------------------------------------------------------ */

interface StatsData {
  total_files_scanned: number;
  detection_rate: number;
  highest_risk_type: string;
  file_types: {
    file_type: string;
    total_scanned: number;
    detected_count: number;
    detected_percentage: number;
  }[];
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

const Statistics: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch statistics from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/files/stats');
        setStats(res.data);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <AuthenticatedNavbar />

      {/* ── Body ──────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {loading ? (
          <LoadingSpinner containerClassName="flex items-center justify-center pt-24" />
        ) : error ? (
          <div className="flex items-center justify-center pt-24">
            <p className="text-red-400">{error}</p>
          </div>
        ) : stats ? (
          <>
            {/* ── Summary Cards ─────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
              <div className="rounded-xl border border-blue-500/40 bg-slate-900/60 p-5 text-center hover:border-blue-500/70 transition-colors">
                <p className="text-3xl font-bold text-blue-400">{stats.total_files_scanned.toLocaleString()}</p>
                <p className="text-sm text-slate-400 mt-1">Total Files Scanned</p>
              </div>
              <div className="rounded-xl border border-yellow-500/40 bg-slate-900/60 p-5 text-center hover:border-yellow-500/70 transition-colors">
                <p className="text-3xl font-bold text-yellow-400">{stats.detection_rate}%</p>
                <p className="text-sm text-slate-400 mt-1">Detection Rate</p>
              </div>
              <div className="rounded-xl border border-red-500/40 bg-slate-900/60 p-5 text-center hover:border-red-500/70 transition-colors">
                <p className="text-3xl font-bold text-red-400">{stats.highest_risk_type}</p>
                <p className="text-sm text-slate-400 mt-1">Highest Risk Type</p>
              </div>
            </div>

            {/* ── File Type Cards Grid ──────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...stats.file_types]
                .sort((a, b) => {
                  if (b.detected_percentage !== a.detected_percentage) {
                    return b.detected_percentage - a.detected_percentage;
                  }
                  if (b.detected_count !== a.detected_count) {
                    return b.detected_count - a.detected_count;
                  }
                  return b.total_scanned - a.total_scanned;
                })
                .map((ft) => {
                const meta = FILE_TYPE_META[ft.file_type] || DEFAULT_META;
                const dynamicDetectedColor = ft.detected_percentage > 20 ? '#ef4444' : ft.detected_percentage > 0 ? '#eab308' : '#3b82f6';
                
                return (
                  <FileTypeCard
                    key={ft.file_type}
                    title={`${ft.file_type.toUpperCase()} File`}
                    totalScanned={ft.total_scanned}
                    detectedPercentage={ft.detected_percentage}
                    detectedColor={dynamicDetectedColor}
                    safeColor="#3b82f6"
                    icon={meta.icon}
                  />
                );
              })}
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
};

export default Statistics;

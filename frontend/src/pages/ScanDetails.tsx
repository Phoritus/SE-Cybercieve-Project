import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Icon } from '@iconify/react';
import { ScanReportNavbar } from '@/src/components/navbar';
import { ScanResult } from '@/src/components/ScanResult';

interface LocationState {
  report: any;
  fileName: string;
  fileHash: string;
  recommendation?: string;
}

const ScanDetails: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  useEffect(() => {
    if (!state) {
      navigate('/scan', { replace: true });
    }
  }, [state, navigate]);

  if (!state) return null;

  const handleBack = () => {
    // Navigate back to scan-report, preserving state (including cached recommendation)
    navigate('/scan-report', {
      state,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <ScanReportNavbar />

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Back button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity"
          aria-label="Back to report"
        >
          <Icon icon="weui:back-filled" width="25" height="25" style={{ color: '#FFFFFF80' }} />
        </button>

        <ScanResult
          report={state.report}
          fileName={state.fileName}
          fileHash={state.fileHash}
        />
      </main>
    </div>
  );
};

export default ScanDetails;

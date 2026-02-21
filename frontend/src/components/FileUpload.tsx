import { Fingerprint, FileUp } from 'lucide-react';
import { useCallback } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export function FileUpload({ onFileSelect }: FileUploadProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onFileSelect(e.dataTransfer.files[0]);
      }
    },
    [onFileSelect]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-700"
    >
      <div className="relative group">
        {/* Glowing effect container */}
        <div className="absolute inset-0 bg-blue-500/10 blur-2xl rounded-full group-hover:bg-blue-500/20 transition-all duration-500" />

        {/* Icon Container */}
        <div className="relative">
          <Fingerprint className="w-32 h-32 text-slate-500 group-hover:text-blue-400 transition-colors duration-300 stroke-1" />
          <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <FileUp className="w-6 h-6 text-blue-400" />
            </div>
          </div>

          {/* Scanning line animation */}
          <div className="absolute top-0 left-0 w-full h-0.5 bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)] animate-scan opacity-0 group-hover:opacity-100" />
        </div>
      </div>

      <div className="flex flex-col items-center space-y-2">
        <label className="relative cursor-pointer">
          <span className="relative z-10 block px-12 py-3 bg-transparent border border-blue-500/30 text-blue-400 hover:text-white hover:border-blue-400 hover:bg-blue-500/10 rounded overflow-hidden transition-all duration-300 font-medium tracking-wide">
            Choose file
          </span>
          <input
            type="file"
            className="hidden"
            onChange={handleChange}
          />
        </label>
        <p className="text-slate-500 text-sm">or drag and drop a file here</p>
      </div>

      <div className="max-w-3xl text-center space-y-2">
        <p className="text-slate-400/60 text-xs leading-relaxed">
          By submitting data above, you are agreeing to our{' '}
          <a href="#" className="text-blue-400/80 hover:text-blue-400">Terms of Service</a> and{' '}
          <a href="#" className="text-blue-400/80 hover:text-blue-400">Privacy Notice</a>, and to the{' '}
          <strong className="text-slate-300">sharing of your Sample submission with the security community</strong>.
          Please do not submit any personal information; we are not responsible for the contents of your submission.{' '}
          <a href="#" className="text-blue-400/80 hover:text-blue-400">Learn more</a>.
        </p>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}

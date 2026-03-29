import React from 'react';
import loadingScanSvg from '@/src/assets/loading_scan.svg';

interface LoadingSpinnerProps {
  sizeClassName?: string;
  containerClassName?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  sizeClassName = 'w-14 h-14',
  containerClassName = 'min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center'
}) => {
  return (
    <div className={containerClassName}>
      <img src={loadingScanSvg} alt="Loading" className={sizeClassName} />
    </div>
  );
};

export default LoadingSpinner;
import React from 'react';
import type { BaseNavbarProps } from '../BaseNavbar';

export const withVirusTotal = <P extends BaseNavbarProps>(
  WrappedComponent: React.ComponentType<P>
) => {
  return function WithVirusTotal(props: Omit<P, 'rightContent'>) {
    const poweredBy = (
      <p className="text-xs text-slate-600 tracking-wide">
        Powered by VirusTotal
      </p>
    );

    return <WrappedComponent {...(props as P)} rightContent={poweredBy} />;
  };
};
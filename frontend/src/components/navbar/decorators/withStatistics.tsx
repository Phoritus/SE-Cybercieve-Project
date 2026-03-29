import React from 'react';
import { NavLink } from 'react-router-dom';
import type { BaseNavbarProps } from '../BaseNavbar';
import logoStatistics from '@/src/assets/logo_statistics.svg';

export const withStatistics = <P extends BaseNavbarProps>(
  WrappedComponent: React.ComponentType<P>
) => {
  return function WithStatistics(props: Omit<P, 'centerContent'>) {
    const statsLink = (
      <NavLink
        to="/statistics"
        className={({ isActive }) =>
          `inline-flex h-full items-center gap-2 px-1 text-base font-medium leading-none transition-colors border-b-2 ${
            isActive
              ? 'text-slate-100 border-blue-500'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`
        }
      >
        <img
          src={logoStatistics}
          alt="Statistics"
          className="h-7.5 w-7.5"
        />
        <span>Statistics</span>
      </NavLink>
    );

    return <WrappedComponent {...(props as P)} centerContent={statsLink} />;
  };
};

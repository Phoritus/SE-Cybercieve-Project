import React from 'react';
import { Link } from 'react-router-dom';
import type { BaseNavbarProps } from '../BaseNavbar';

export const withAuthLinks = <P extends BaseNavbarProps>(
  WrappedComponent: React.ComponentType<P>
) => {
  return function WithAuthLinks(props: Omit<P, 'rightContent'>) {
    const authLinks = (
      <nav className="flex items-center gap-2 text-sm max-w-2xl mx-auto w-full">
        <Link
          to="/login"
          className="rounded-md px-3 py-1.5 font-medium text-slate-400 transition-colors hover:text-slate-200"
        >
          Log in
        </Link>
        <Link
          to="/register"
          className="rounded-md bg-blue-500 px-3 py-1.5 font-medium text-white shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset] transition hover:bg-blue-400"
        >
          Sign up
        </Link>
      </nav>
    );

    return <WrappedComponent {...(props as P)} rightContent={authLinks} />;
  };
};

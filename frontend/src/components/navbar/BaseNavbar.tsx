import React from 'react';
import { Link } from 'react-router-dom';
import logoNavbar from '@/src/assets/logo_navbar.svg';

export interface BaseNavbarProps {
  centerContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  isSticky?: boolean;
}

export const BaseNavbar: React.FC<BaseNavbarProps> = ({ centerContent, rightContent, isSticky = true }) => {
  return (
    <header
      className={`border-b border-slate-800 bg-slate-950/80 backdrop-blur supports-backdrop-filter:bg-slate-950/60 z-10 ${
        isSticky ? 'sticky top-0' : 'relative'
      }`}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-2.5">
        {/* Left: Logo and Title */}
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-100">
          <img
            src={logoNavbar}
            alt="CyberSieve logo"
            className="h-7.5 w-7.5 drop-shadow-[0_0_12px_rgba(65,128,227,0.8)]"
          />
          <h1 className="text-lg font-bold tracking-tight">
            <span className="text-blue-400">Cyber</span>Sieve
          </h1>
        </Link>

        {/* Center: Dynamic Content */}
        {centerContent && (
          <div className="absolute left-1/2 top-0 h-full -translate-x-1/2 flex items-center">
            {centerContent}
          </div>
        )}

        {/* Right: Dynamic Content */}
        {rightContent ? (
          <div className="flex items-center gap-3">
            {rightContent}
          </div>
        ) : (
          <div className="w-10"></div> // Placeholder to keep center content centered if right is empty
        )}
      </div>
    </header>
  );
};

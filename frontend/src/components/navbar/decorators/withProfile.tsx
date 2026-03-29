import React, { useState, useEffect, useRef } from 'react';
import { CircleUserRound, Settings, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/src/api/supabaseClient';
import type { BaseNavbarProps } from '../BaseNavbar';

export const withProfile = <P extends BaseNavbarProps>(
  WrappedComponent: React.ComponentType<P>
) => {
  return function WithProfile(props: Omit<P, 'rightContent'>) {
    const [profile, setProfile] = useState({ name: 'User', handle: '@profile' });
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
      const loadProfile = async () => {
        const { data } = await supabase.auth.getUser();
        const user = data.user;
        if (!user) return;

        const emailName = user.email?.split('@')[0] ?? 'user';
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name;
        const safeName = (fullName || emailName)
          .split(/[_\-.\s]+/)
          .filter(Boolean)
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');

        setProfile({
          name: safeName || 'User',
          handle: `@${(user.user_metadata?.user_name || emailName).replace(/\s+/g, '_')}`,
        });
      };
      loadProfile();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
          setDropdownOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSignOut = async () => {
      await supabase.auth.signOut();
      navigate('/');
    };

    const profileComponent = (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((o) => !o)}
          className="inline-flex items-center gap-2 rounded-md px-2 py-1 hover:bg-slate-900/60 transition-colors"
        >
          <div className="text-right leading-tight">
            <p className="text-xs font-semibold text-slate-200">{profile.name}</p>
            <p className="text-[11px] text-slate-500">{profile.handle}</p>
          </div>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-blue-500/60 bg-slate-950/70">
            <CircleUserRound className="h-5.5 w-5.5 text-blue-400" />
          </span>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/50 z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700/60">
              <p className="text-sm font-semibold text-slate-100">{profile.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{profile.handle}</p>
            </div>
            <Link
              to="/profile"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              Edit Profile
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-400 hover:bg-slate-800 transition-colors border-t border-slate-700/60"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    );

    return <WrappedComponent {...(props as P)} rightContent={profileComponent} />;
  };
};

import React, { useState, useEffect, useRef } from 'react';
import { CircleUserRound, Settings, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/src/api/supabaseClient';
import api from '@/src/api/axios';
import type { BaseNavbarProps } from '../BaseNavbar';

type ProfileUpdatedDetail = {
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
};

const PROFILE_CACHE_KEY = 'cybersieve_profile_cache';

const readCachedProfile = (): ProfileUpdatedDetail | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as ProfileUpdatedDetail;
  } catch {
    return null;
  }
};

const writeCachedProfile = (profile: ProfileUpdatedDetail) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore storage failures.
  }
};

const toSafeString = (value: unknown): string => {
  return typeof value === 'string' ? value : '';
};

export const withProfile = <P extends BaseNavbarProps>(
  WrappedComponent: React.ComponentType<P>
) => {
  return function WithProfile(props: Omit<P, 'rightContent'>) {
    const [profile, setProfile] = useState({ name: 'User', handle: '@profile' });
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
      let isMounted = true;

      const updateProfileState = (name: string, handleBase: string) => {
        if (!isMounted) return;
        const normalizedHandle = (handleBase || 'profile').toString().trim().replace(/\s+/g, '_');
        setProfile({
          name: name || 'User',
          handle: `@${normalizedHandle}`,
        });
      };

      const applyProfileDetail = (detail?: ProfileUpdatedDetail | null) => {
        if (!detail) return false;

        const email = toSafeString(detail.email);
        const username = toSafeString(detail.username);
        const firstName = toSafeString(detail.first_name);
        const lastName = toSafeString(detail.last_name);

        const emailName = email.includes('@') ? email.split('@')[0] : email || 'user';
        const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
        const displayName = fullName || username || emailName;
        updateProfileState(displayName, username || emailName);
        return true;
      };

      const loadProfile = async () => {
        try {
          const response = await api.get('/me');
          const dbUser = response.data || {};
          const detail: ProfileUpdatedDetail = {
            username: dbUser.username ?? null,
            first_name: dbUser.first_name ?? null,
            last_name: dbUser.last_name ?? null,
            email: dbUser.email ?? null,
          };
          writeCachedProfile(detail);
          applyProfileDetail(detail);
        } catch {
          // Keep the default profile UI if DB profile cannot be loaded.
        }
      };

      const refreshProfile = (event: Event) => {
        const detail = (event as CustomEvent<ProfileUpdatedDetail>).detail;
        if (!detail) return;
        writeCachedProfile(detail);
        applyProfileDetail(detail);
      };

      const cachedProfile = readCachedProfile();
      if (!applyProfileDetail(cachedProfile)) {
        void loadProfile();
      }

      window.addEventListener('profile-updated', refreshProfile as EventListener);

      return () => {
        isMounted = false;
        window.removeEventListener('profile-updated', refreshProfile as EventListener);
      };
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
      try {
        window.localStorage.removeItem(PROFILE_CACHE_KEY);
      } catch {
        // Ignore storage failures.
      }
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

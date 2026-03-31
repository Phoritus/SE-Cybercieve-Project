import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/src/context/AuthContext';
import { supabase } from '@/src/api/supabaseClient';
import api from '@/src/api/axios';
import loadingScanSvg from '@/src/assets/loading_scan.svg';

function getAuthFlowType(): string | null {
  const searchParams = new URLSearchParams(window.location.search);
  const searchType = searchParams.get('type');
  if (searchType) return searchType;

  // Supabase can also put auth params in URL hash for implicit flows.
  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;
  const hashParams = new URLSearchParams(hash);
  return hashParams.get('type');
}

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  useEffect(() => {
    const flowType = getAuthFlowType();

    // Check for existing session or listen for auth state change
    const syncUser = async (session: any) => {
      if (session) {
        // If this is a password recovery flow, redirect to reset password page
        if (flowType === 'recovery') {
          login(session.access_token);
          navigate('/update-password', { replace: true });
          return;
        }

        const { user } = session;
        const { email, user_metadata } = user;
        const fullName = user_metadata.full_name || user_metadata.name || "";
        const [firstName, ...lastNameParts] = fullName.split(" ");
        const lastName = lastNameParts.join(" ");
        // Sync user data with our backend database
        try {
          await api.post('/register', {
            id: user.id,
            email,
            first_name: firstName,
            last_name: lastName,
            username: user_metadata.user_name || email.split("@")[0]
          });
        } catch (error) {
          console.log("User sync error (likely already exists):", error);
        }

        // Email confirmation links (`type=signup`) may create a temporary
        // session automatically. We confirm account, then send user to login.
        if (flowType === 'signup') {
          await supabase.auth.signOut();
          navigate('/login', { replace: true });
          return;
        }
        // Update state and redirect to scan page
        login(session.access_token);
        navigate('/scan');
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      syncUser(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      syncUser(session);
    });

    return () => subscription.unsubscribe();
  }, [navigate, login]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center">
      <div className="text-center">
        <img
          src={loadingScanSvg}
          alt="Loading"
          className="w-14 h-14 mx-auto"
        />
        <p className="mt-4 text-sm text-slate-400">Signing you in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;

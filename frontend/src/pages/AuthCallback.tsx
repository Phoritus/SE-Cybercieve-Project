import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../api/supabaseClient';
import api from '../api/axios';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    // Check for existing session or listen for auth state change
    const syncUser = async (session: any) => {
      if (session) {
        const { user } = session;
        const { email, user_metadata } = user;
        const fullName = user_metadata.full_name || user_metadata.name || "";
        const [firstName, ...lastNameParts] = fullName.split(" ");
        const lastName = lastNameParts.join(" ");

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

        login(session.access_token);
        navigate('/dashboard');
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Processing Login...</h2>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    </div>
  );
};

export default AuthCallback;

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import { supabase } from '../api/supabaseClient';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        login(data.session.access_token);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
      console.error(err);
    }
  };

  const handleGoogleLogin = async () => {
      try {
          const { error } = await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: {
                  redirectTo: 'http://localhost:5173/auth/callback'
              }
          });
          if (error) throw error;
      } catch (err: any) {
          console.error("Google login failed", err);
          setError(err.message || "Could not initiate Google login.");
      }
  }

  const handleGithubLogin = async () => {
      try {
          const { error } = await supabase.auth.signInWithOAuth({
              provider: 'github',
              options: {
                  redirectTo: 'http://localhost:5173/auth/callback'
              }
          });
          if (error) throw error;
      } catch (err: any) {
          console.error("Github login failed", err);
          setError(err.message || "Could not initiate Github login.");
      }
  }

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Login</h2>
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2">Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-blue-500 hover:text-blue-700 font-semibold"
          >
            Forgot Password?
          </button>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-200"
          >
            Login
          </button>
        </form>
        <div className="mt-4 text-center space-y-2">
            <button
                onClick={handleGoogleLogin}
                className="w-full bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition duration-200"
            >
                Login with Google
            </button>
            <button
                onClick={handleGithubLogin}
                className="w-full bg-gray-800 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-900 transition duration-200"
            >
                Login with GitHub
            </button>
        </div>
        <p className="mt-4 text-center text-gray-600">
          Don't have an account? <Link to="/register" className="text-blue-500 hover:text-blue-700 font-semibold">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

import { supabase } from '../api/supabaseClient';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      // 1. Sign up with Supabase
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (data.user) {
        // 2. Sync user to local backend
        await api.post('/register', {
          id: data.user.id,
          email: email,
          username: email.split("@")[0]
        });
        console.log(data)

        alert('Registration successful! Please check your email for verification (if enabled) or login.');
        navigate('/login');
      }
    } catch (err: any) {
      // Extract error message from backend response if available
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Register</h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-center" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
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
            type="submit"
            className="w-full bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition duration-200"
          >
            Register
          </button>
        </form>
        <div className="mt-4 text-center space-y-2">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition duration-200"
          >
            Register with Google
          </button>
          <button
            type="button"
            onClick={handleGithubLogin}
            className="w-full bg-gray-800 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-900 transition duration-200"
          >
            Register with GitHub
          </button>
        </div>
        <p className="mt-4 text-center text-gray-600">
          Already have an account? <Link to="/login" className="text-blue-500 hover:text-blue-700 font-semibold">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

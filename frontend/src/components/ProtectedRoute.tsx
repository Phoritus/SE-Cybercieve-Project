import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/src/context/AuthContext';
import LoadingSpinner from '@/src/components/LoadingSpinner';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;

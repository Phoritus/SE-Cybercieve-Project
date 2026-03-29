import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import UpdatePassword from './pages/UpdatePassword';
import AuthCallback from './pages/AuthCallback';
import Profile from './pages/Profile';
import FileScan from './pages/FileScan';
import ScanReport from './pages/ScanReport';
import ScanDetails from './pages/ScanDetails';
import Statistics from './pages/Statistics';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<RedirectIfAuthenticated><Login /></RedirectIfAuthenticated>} />
          <Route path="/register" element={<RedirectIfAuthenticated><Register /></RedirectIfAuthenticated>} />
          <Route path="/forgot-password" element={<RedirectIfAuthenticated><ForgotPassword /></RedirectIfAuthenticated>} />
          <Route path="/update-password" element={<RedirectIfAuthenticated><UpdatePassword /></RedirectIfAuthenticated>} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scan"
            element={
              <ProtectedRoute>
                <FileScan />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scan-report"
            element={
              <ProtectedRoute>
                <ScanReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scan-details"
            element={
              <ProtectedRoute>
                <ScanDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/statistics"
            element={
              <ProtectedRoute>
                <Statistics />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<RedirectIfAuthenticated><Home /></RedirectIfAuthenticated>} />
          <Route path="*" element={<DebugRoute />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

const DebugRoute = () => {
  const location = window.location;
  const routerLocation = useLocation();
  console.log('Window Location:', location);
  console.log('Router Location:', routerLocation);

  return (
    <div className="p-4 bg-red-100 text-red-800 border-2 border-red-400 m-4 rounded">
      <h2 className="text-xl font-bold mb-2">No Route Matched (Debug Mode)</h2>
      <p><strong>URL Path:</strong> {routerLocation.pathname}</p>
      <p><strong>URL Hash:</strong> {routerLocation.hash}</p>
      <p><strong>URL Search:</strong> {routerLocation.search}</p>
      <pre className="mt-4 bg-white p-2 text-xs overflow-auto">
        {JSON.stringify(routerLocation, null, 2)}
      </pre>
    </div>
  );
};

const RedirectIfAuthenticated: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    return <Navigate to="/scan" replace />;
  }

  return <>{children}</>;
};

export default App;
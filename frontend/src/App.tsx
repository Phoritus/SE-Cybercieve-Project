import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import UpdatePassword from './pages/UpdatePassword';
import Dashboard from './pages/Dashboard';
import AuthCallback from './pages/AuthCallback';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          /> {/* TODO: Remove this route after testing */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
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

import { useLocation } from 'react-router-dom';

export default App;
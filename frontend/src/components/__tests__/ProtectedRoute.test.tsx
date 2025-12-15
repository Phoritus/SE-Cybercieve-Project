import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import { AuthContext } from '../../context/AuthContext';
import { describe, it, expect, vi } from 'vitest';

// Mock AuthContext
// Mock AuthContext
const mockAuth = (isAuthenticated: boolean) => ({
  isAuthenticated,
  loading: false,
  login: vi.fn(),
  logout: vi.fn(),
  resetPassword: vi.fn(),
  updatePassword: vi.fn(),
});

describe('ProtectedRoute', () => {
  it('redirects to login if user is not authenticated', () => {
    render(
      <AuthContext.Provider value={mockAuth(false)}>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <div>Protected Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children if user is authenticated', () => {
    render(
      <AuthContext.Provider value={mockAuth(true)}>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <div>Protected Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});

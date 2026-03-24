// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user,  setUser]  = useState(null);
  const [token, setToken] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const res = await apiFetch('/api/auth/me', { credentials: 'include' });
        if (!res.ok) throw new Error('No active session');
        const data = await res.json();
        if (!mounted) return;
        setUser(data.user || null);
        setToken(data.user ? 'cookie' : null);
      } catch {
        if (!mounted) return;
        setUser(null);
        setToken(null);
      } finally {
        if (mounted) setInitializing(false);
      }
    };

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  const login = (userData) => {
    setUser(userData);
    setToken('cookie');
  };

  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Keep local state cleanup even if the network call fails.
    }
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, initializing, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

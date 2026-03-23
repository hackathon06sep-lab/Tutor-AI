// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user,  setUser]  = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const t = localStorage.getItem('ai_tutor_token');
    const u = localStorage.getItem('ai_tutor_user');
    if (t) { setToken(t); setUser(JSON.parse(u)); }
  }, []);

  const login = (tokenVal, userData) => {
    localStorage.setItem('ai_tutor_token', tokenVal);
    localStorage.setItem('ai_tutor_user', JSON.stringify(userData));
    setToken(tokenVal);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('ai_tutor_token');
    localStorage.removeItem('ai_tutor_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

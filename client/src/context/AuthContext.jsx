import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api, getToken, setToken, clearToken } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true); // true until initial /auth/me resolves

  // Restore session on first load if a token exists.
  useEffect(() => {
    let cancelled = false;
    async function restore() {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const data = await api('/auth/me');
        if (!cancelled) {
          setUser(data.user);
          setOrganization(data.organization || null);
        }
      } catch {
        clearToken();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    setUser(data.user);
    setOrganization(data.organization || null);
    return data.user;
  }, []);

  const signup = useCallback(async (
    companyName,
    industry,
    ownerName,
    ownerEmail,
    password,
    ownershipType,
    owners,
  ) => {
    const data = await api('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        company_name: companyName,
        industry,
        owner_name: ownerName,
        owner_email: ownerEmail,
        password,
        ownership_type: ownershipType,
        owners: owners || [],
      }),
    });
    setToken(data.token);
    setUser(data.user);
    setOrganization(data.organization || null);
    return { success: true, user: data.user };
  }, []);

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      /* ignore network errors on logout */
    } finally {
      clearToken();
      setUser(null);
      setOrganization(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const data = await api('/auth/me');
    setUser(data.user);
    setOrganization(data.organization || null);
    return data;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        login,
        signup,
        logout,
        refreshUser,
        loading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

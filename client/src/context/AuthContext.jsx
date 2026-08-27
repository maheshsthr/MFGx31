import { createContext, useContext, useState, useCallback } from 'react';
import { DUMMY_USER_ADMIN, DUMMY_USER_DEPT_HEAD, DUMMY_ORG } from '../data/dummyData';

const AuthContext = createContext(null);

const DUMMY_ACCOUNTS = {
  'rajesh@metalworks.in': { password: 'admin123', user: DUMMY_USER_ADMIN },
  'amit@metalworks.in': { password: 'dept123', user: DUMMY_USER_DEPT_HEAD },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);

  const login = useCallback((email, password) => {
    const account = DUMMY_ACCOUNTS[email];
    if (!account || account.password !== password) {
      throw new Error('Invalid email or password');
    }
    setUser(account.user);
    setOrganization(DUMMY_ORG);
    return account.user;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setOrganization(null);
  }, []);

  const signup = useCallback((orgName, industry, ownerName, email, password, ownershipType, owners) => {
    const newUser = {
      id: 'u_' + Date.now(),
      full_name: ownerName,
      email,
      role: 'admin',
      organization_id: 'org_' + Date.now(),
      department_id: null,
      avatar_url: null,
    };
    const newOrg = {
      id: newUser.organization_id,
      name: orgName,
      industry_type: industry,
      logo_url: null,
      ownership_type: ownershipType || 'solo',
      owners: owners || [],
      created_at: new Date().toISOString(),
    };
    setUser(newUser);
    setOrganization(newOrg);
    return { success: true, user: newUser };
  }, []);

  return (
    <AuthContext.Provider value={{ user, organization, login, logout, signup, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

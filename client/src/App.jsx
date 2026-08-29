import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SearchProvider, useSearch } from './context/SearchContext';
import AdminLayout from './layouts/AdminLayout';
import DeptHeadLayout from './layouts/DeptHeadLayout';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import DepartmentsPage from './pages/DepartmentsPage';
import DepartmentDetailPage from './pages/DepartmentDetailPage';
import TransfersPage from './pages/TransfersPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';
import DepartmentHeadDashboard from './pages/DepartmentHeadDashboard';
import DeptResourcePage from './pages/DeptResourcePage';
import DeptSettingsPage from './pages/DeptSettingsPage';
import ErrorPage from './components/ErrorPage';

function FullScreenLoader() {
  return (
    <div className="app-loader">
      <div className="app-loader-spinner" />
    </div>
  );
}

// Keeps popups/modal dialogs open when the user clicks the outer backdrop,
// instead of closing them. Clicking inside the popup still works normally;
// the popup is dismissed only via its own buttons (Cancel/Close/etc.).
function ModalKeepOpen() {
  useEffect(() => {
    function onCapture(e) {
      const t = e.target;
      if (!(t instanceof Element)) return;
      const overlay = t.closest('.modal-overlay, .settings-modal-overlay, .confirm-overlay');
      // Only intercept clicks on the backdrop itself, not the popup content.
      if (overlay && t === overlay) {
        e.stopPropagation();
        e.preventDefault();
      }
    }
    document.addEventListener('click', onCapture, true);
    return () => document.removeEventListener('click', onCapture, true);
  }, []);
  return null;
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  return isAuthenticated ? children : <ErrorPage type="401" />;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  return isAuthenticated ? <Navigate to="/app" /> : children;
}

// Redirect authenticated users to their role-appropriate landing page.
function HomeRedirect() {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!isAuthenticated) return <Navigate to="/" />;
  // Department heads always land in their dedicated scoped app.
  if (user?.role === 'department_head') return <Navigate to="/app/dashboard" />;
  return <Navigate to="/dashboard" />;
}

// Department-head routes: manually navigate /app/* and guard against admins.
function DeptHeadGuard({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <ErrorPage type="401" />;
  if (user.role !== 'department_head') {
    return <ErrorPage type="403" title="Admins can't access this area" message="This page is for department heads. Return to your admin dashboard to continue." />;
  }
  return children;
}

// Admin routes guard: only company admins may access organization management.
function AdminGuard({ children }) {  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <ErrorPage type="401" />;
  if (user.role !== 'admin') {
    return <ErrorPage type="403" title="Department heads can't access this area" message="This page is for the organization admin. Return to your department dashboard to continue." />;
  }
  return children;
}

// Clear the topbar search whenever the user navigates to a new page.
function SearchResetOnRoute() {
  const location = useLocation();
  const { setQuery } = useSearch();
  useEffect(() => {
    setQuery('');
  }, [location.pathname, setQuery]);
  return null;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />

      {/* Admin / company-level experience */}
      <Route element={<ProtectedRoute><AdminGuard><AdminLayout /></AdminGuard></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/departments" element={<DepartmentsPage />} />
        <Route path="/departments/:id" element={<DepartmentDetailPage />} />
        <Route path="/transfers" element={<TransfersPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Department-head scoped experience */}
      <Route element={<ProtectedRoute><DeptHeadGuard><DeptHeadLayout /></DeptHeadGuard></ProtectedRoute>}>
        <Route path="/app/dashboard" element={<DepartmentHeadDashboard />} />
        <Route path="/app/employees" element={<DeptResourcePage resource="employees" />} />
        <Route path="/app/machinery" element={<DeptResourcePage resource="machinery" />} />
        <Route path="/app/resources" element={<DeptResourcePage resource="resources" />} />
        <Route path="/app/transfers" element={<TransfersPage />} />
        <Route path="/app/notifications" element={<NotificationsPage />} />
        <Route path="/app/settings" element={<DeptSettingsPage />} />
      </Route>

      <Route path="/app" element={<HomeRedirect />} />
      <Route path="*" element={<ErrorPage type="404" />} />
    </Routes>
  );
}

export default function App() {
    return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <SearchProvider>
          <ErrorBoundary>
            <ModalKeepOpen />
            <SearchResetOnRoute />
            <AppRoutes />
          </ErrorBoundary>
        </SearchProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Brand from '../components/Brand';
import './AuthPages.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = login(email, password);
      if (user.role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate(`/departments/${user.department_id}`);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card anim-pop-in">
        <div className="auth-brand">
          <Brand size={42} textSize={1.35} />
        </div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your organization account</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}
          <div className="auth-field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />
          </div>
          <div className="auth-field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" className="auth-submit">Sign In</button>
        </form>

        <p className="auth-switch">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>

        <div className="auth-demo">
          <p className="auth-demo-title">Demo Accounts</p>
          <div className="auth-demo-accounts">
            <button
              className="auth-demo-btn"
              onClick={() => { setEmail('rajesh@metalworks.in'); setPassword('admin123'); }}
            >
              <strong>Admin</strong>
              <span>rajesh@metalworks.in</span>
              <span className="auth-demo-pass">Password: admin123</span>
            </button>
            <button
              className="auth-demo-btn"
              onClick={() => { setEmail('amit@metalworks.in'); setPassword('dept123'); }}
            >
              <strong>Dept. Head</strong>
              <span>amit@metalworks.in</span>
              <span className="auth-demo-pass">Password: dept123</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

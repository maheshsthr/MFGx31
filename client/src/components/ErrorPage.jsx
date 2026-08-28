import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Brand from './Brand';
import './ErrorPage.css';

const CONFIG = {
  404: {
    code: '404',
    title: 'Page not found',
    message: "The page you're looking for doesn't exist, was moved, or the link is broken.",
    primary: 'Go to my dashboard',
    secondary: 'Go to homepage',
  },
  401: {
    code: '401',
    title: 'Sign in required',
    message: 'You need to be logged in to view this page. Please sign in to your account to continue.',
    primary: 'Sign in',
    secondary: 'Go to homepage',
  },
  403: {
    code: '403',
    title: 'Access denied',
    message: "You don't have permission to view this page. It's reserved for a different role.",
    primary: 'Go to my dashboard',
    secondary: 'Go to homepage',
  },
  500: {
    code: '500',
    title: 'Something went wrong',
    message: 'An unexpected error occurred while loading this page. Please try again in a moment.',
    primary: 'Try again',
    secondary: 'Go to homepage',
  },
};

function BrandHome({ home }) {
  const navigate = useNavigate();
  return (
    <button className="err-brand-btn" onClick={() => navigate(home)} aria-label="Go home">
      <Brand size={36} round={10} />
    </button>
  );
}

function ErrorIcon({ type }) {
  const common = {
    viewBox: '0 0 24 24',
    width: 34,
    height: 34,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };
  if (type === '500') {
    return (
      <svg {...common}>
        <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      </svg>
    );
  }
  if (type === '401') {
    return (
      <svg {...common}>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        <circle cx="12" cy="15.5" r="1.3" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (type === '403') {
    return (
      <svg {...common}>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        <circle cx="12" cy="15.5" r="1.4" fill="currentColor" stroke="none" />
        <path d="M12 4l3 2M15 7l-3 .8" strokeWidth="1.6" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
      <path d="M8.5 11h5M11 8.5v5" />
    </svg>
  );
}

export default function ErrorPage({ type = '404', title, message, code, children }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const cfg = CONFIG[type] || CONFIG['404'];

  const home = user?.role === 'department_head' ? '/app/dashboard' : user ? '/dashboard' : '/';
  const finalTitle = title || cfg.title;
  const finalMessage = message || cfg.message;
  const finalCode = code || cfg.code;

  function handlePrimary() {
    if (type === '401') navigate('/login');
    else if (type === '500') window.location.reload();
    else navigate(home);
  }

  function handleSecondary() {
    navigate(home);
  }

  return (
    <div className="err-page">
      <header className="err-brand">
        <BrandHome home={home} />
      </header>

      <div className="err-page-inner">
        <div className={`err-icon err-icon--${type}`}>
          <ErrorIcon type={type} />
        </div>

        <div className="err-code" aria-hidden="true">{finalCode}</div>
        <h1 className="err-title">{finalTitle}</h1>
        <p className="err-message">{finalMessage}</p>

        <div className="err-actions">
          <button className="err-btn err-btn--primary press-effect" onClick={handlePrimary}>
            {cfg.primary}
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button className="err-btn err-btn--secondary press-effect" onClick={handleSecondary}>
            {cfg.secondary}
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

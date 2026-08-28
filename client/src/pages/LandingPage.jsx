import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import lottie from 'lottie-web';
import { PreviewFrame, DashboardPreview, DepartmentsPreview, SettingsPreview, NotificationsPreview } from './LandingPreviews';
import Brand from '../components/Brand';
import './LandingPage.css';

function HeroVisual() {
  const containerRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    fetch('/Revenue.json')
      .then(r => r.json())
      .then(data => {
        if (cancelled || !containerRef.current) return;
        animRef.current = lottie.loadAnimation({
          container: containerRef.current,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          animationData: data,
        });
        animRef.current.addEventListener('error', (e) => {
          console.error('Lottie error:', e);
        });
      })
      .catch(e => console.error('Fetch error:', e));
    return () => {
      cancelled = true;
      animRef.current?.destroy();
    };
  }, []);

  return (
    <div className="hero-vis">
      <div ref={containerRef} className="hero-lottie" />
    </div>
  );
}

function useScrollReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('revealed');
          obs.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function RevealDiv({ className = '', delay, children, ...props }) {
  const ref = useScrollReveal();
  const delayClass = delay ? ` reveal-delay-${delay}` : '';
  return (
    <div ref={ref} className={`reveal${delayClass} ${className}`} {...props}>
      {children}
    </div>
  );
}

export default function LandingPage() {
  const [mobileNav, setMobileNav] = useState(false);

  return (
    <div className="landing">
      {/* ===== NAV ===== */}
      <nav className="landing-nav anim-slide-down">
        <div className="landing-nav-inner">
          <div className="landing-brand">
            <Brand size={38} textSize={1.25} />
          </div>
          <div className={`landing-nav-links ${mobileNav ? 'landing-nav-links--open' : ''}`}>
            <a href="#features" onClick={() => setMobileNav(false)}>Features</a>
            <a href="#preview" onClick={() => setMobileNav(false)}>Preview</a>
            <a href="#how" onClick={() => setMobileNav(false)}>How It Works</a>
            <Link to="/login" className="landing-nav-btn" onClick={() => setMobileNav(false)}>Log In</Link>
            <Link to="/signup" className="landing-nav-btn primary" onClick={() => setMobileNav(false)}>Get Started</Link>
          </div>
          <button className="landing-nav-hamburger" onClick={() => setMobileNav(!mobileNav)} aria-label="Menu">
            {mobileNav ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="landing-hero">
        <div className="landing-hero-bg-grid"></div>
        <div className="landing-hero-bg-glow"></div>
        <div className="landing-hero-inner">
          <div className="landing-hero-content">
            <div className="landing-badge anim-fade-in">
              <span className="landing-badge-dot"></span>
              Operations Management for Manufacturing
            </div>
            <h1 className="landing-hero-title">
              <span className="anim-slide-up" style={{ animationDelay: '0.1s' }}>Centralize your industry's</span>
              <br />
              <span className="landing-hero-bold anim-slide-up" style={{ animationDelay: '0.2s' }}>people, machines, and resources</span>
              <br />
              <span className="anim-slide-up" style={{ animationDelay: '0.3s' }}>in one powerful platform.</span>
            </h1>
            <p className="landing-hero-desc anim-slide-up" style={{ animationDelay: '0.4s' }}>
              The operational backbone for multi-department manufacturing businesses.
              Track employees, machinery, and resources across every department — with full
              transfer history and audit trails.
            </p>
            <div className="landing-hero-actions anim-slide-up" style={{ animationDelay: '0.5s' }}>
              <Link to="/signup" className="landing-btn primary large press-effect">
                <span>Start Free Trial</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
              <Link to="/login" className="landing-btn outline large press-effect">
                See Demo
              </Link>
            </div>
            <p className="landing-hero-note anim-fade-in" style={{ animationDelay: '0.7s' }}>
              Try with dummy accounts on the login page →
            </p>
          </div>
          <div className="landing-hero-anim anim-scale-in" style={{ animationDelay: '0.3s' }}>
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="landing-features" id="features">
        <div className="landing-features-inner">
          <RevealDiv className="landing-section-badge">Core Features</RevealDiv>
          <RevealDiv delay={1}>
            <h2 className="landing-section-title">Everything you need to run operations</h2>
          </RevealDiv>
          <RevealDiv delay={2}>
            <p className="landing-section-desc">No bloat. No irrelevant features. Just the operational tools your factory actually needs.</p>
          </RevealDiv>
          <div className="landing-features-grid">
            {[
              { icon: '⬡', title: 'Department Management', desc: 'Create unlimited departments. Assign heads. See everything organized.' },
              { icon: '◈', title: 'Employee Tracking', desc: 'Track every employee, their role, status, and which department they belong to.' },
              { icon: '⚙', title: 'Machinery Registry', desc: 'Log all machinery, monitor status (working/maintenance/idle), and track location.' },
              { icon: '▦', title: 'Resource Inventory', desc: 'Raw materials, finished goods, consumables — all tracked with quantities and units.' },
              { icon: '⇄', title: 'Transfer System', desc: 'Move employees, machinery, or resources between departments with full audit trails.' },
              { icon: '◉', title: 'Events & Documents', desc: 'Schedule maintenance events. Upload SOPs and manuals. Keep everything documented.' },
            ].map((f, i) => (
              <RevealDiv key={i} delay={Math.min(i + 1, 5)} className="landing-feature-card hover-lift">
                <div className="landing-feature-icon-wrap">
                  <span className="landing-feature-icon">{f.icon}</span>
                </div>
                <h3 className="landing-feature-title">{f.title}</h3>
                <p className="landing-feature-desc">{f.desc}</p>
              </RevealDiv>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRODUCT PREVIEW ===== */}
      <section className="landing-preview" id="preview">
        <div className="landing-preview-inner">
          <RevealDiv className="landing-section-badge">See It In Action</RevealDiv>
          <RevealDiv delay={1}>
            <h2 className="landing-section-title">A closer look at how it works</h2>
          </RevealDiv>
          <RevealDiv delay={2}>
            <p className="landing-section-desc">Four core screens. One focused experience.</p>
          </RevealDiv>

          {/* — Dashboard — */}
          <RevealDiv delay={1} className="landing-preview-row">
            <div className="landing-preview-text">
              <span className="landing-preview-num">01</span>
              <h3>Dashboard</h3>
              <p>Your command center. See department counts, employee totals, machinery status, and resource levels at a glance. Chart shows asset trends. Recent transfers and department rankings keep you informed.</p>
            </div>
            <div className="landing-preview-visual">
              <span className="lp-float lp-float-tl lp-float-dark">◈ 6 Departments</span>
              <span className="lp-float lp-float-br lp-float-green">▲ +12% resources</span>
              <PreviewFrame>
                <DashboardPreview />
              </PreviewFrame>
            </div>
          </RevealDiv>

          {/* — Departments — */}
          <RevealDiv delay={1} className="landing-preview-row reverse">
            <div className="landing-preview-text">
              <span className="landing-preview-num">02</span>
              <h3>Departments</h3>
              <p>Every department as a card. See head count, machinery, and resources at a glance. Click into any department to manage its employees, machines, events, and documents — all in tabbed views.</p>
            </div>
            <div className="landing-preview-visual">
              <span className="lp-float lp-float-tr">⬡ Weaving</span>
              <span className="lp-float lp-float-bl lp-float-green">✓ 3 heads assigned</span>
              <PreviewFrame>
                <DepartmentsPreview />
              </PreviewFrame>
            </div>
          </RevealDiv>

          {/* — Settings — */}
          <RevealDiv delay={1} className="landing-preview-row">
            <div className="landing-preview-text">
              <span className="landing-preview-num">03</span>
              <h3>Settings &amp; Ownership</h3>
              <p>Manage your organization profile, edit your personal info, and control ownership structure. Add partners, set share percentages, and see a visual ownership breakdown — all in one place.</p>
            </div>
            <div className="landing-preview-visual">
              <span className="lp-float lp-float-tr lp-float-dark">Ownership 55 / 45</span>
              <span className="lp-float lp-float-bl lp-float-green">✓ Saved</span>
              <PreviewFrame>
                <SettingsPreview />
              </PreviewFrame>
            </div>
          </RevealDiv>

          {/* — Notifications — */}
          <RevealDiv delay={1} className="landing-preview-row reverse">
            <div className="landing-preview-text">
              <span className="landing-preview-num">04</span>
              <h3>Notifications &amp; Alerts</h3>
              <p>Stay in the loop on every admin and department action. A live bell badge, a quick dropdown popup, and a full notifications page keep you updated on transfers, new hires, and approvals in real time.</p>
            </div>
            <div className="landing-preview-visual">
              <span className="lp-float lp-float-tr lp-float-red">3 unread</span>
              <span className="lp-float lp-float-br">New alert</span>
              <PreviewFrame>
                <NotificationsPreview />
              </PreviewFrame>
            </div>
          </RevealDiv>

        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="landing-how" id="how">
        <div className="landing-how-inner">
          <RevealDiv>
            <h2 className="landing-section-title">Up and running in minutes</h2>
          </RevealDiv>
          <RevealDiv delay={1}>
            <p className="landing-section-desc">Four simple steps from sign-up to full operational visibility.</p>
          </RevealDiv>
          <div className="landing-steps">
            {[
              { num: '01', title: 'Create your organization', desc: 'Sign up with your company name, industry, and ownership details. You become the admin.', icon: '🏢' },
              { num: '02', title: 'Set up departments', desc: 'Add your factory departments — Copper Plant, Rolling Mill, whatever you have.', icon: '🏗' },
              { num: '03', title: 'Add your assets', desc: 'Populate each department with employees, machinery, and resources.', icon: '📦' },
              { num: '04', title: 'Manage & transfer', desc: 'Move assets between departments, track events, upload documents — all logged.', icon: '🔄' },
            ].map((s, i) => (
              <RevealDiv key={i} delay={i + 1} className="landing-step hover-lift">
                <div className="landing-step-icon">{s.icon}</div>
                <div className="landing-step-num">{s.num}</div>
                <h3 className="landing-step-title">{s.title}</h3>
                <p className="landing-step-desc">{s.desc}</p>
              </RevealDiv>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="landing-cta">
        <div className="landing-cta-inner">
          <RevealDiv>
            <div className="landing-cta-icon anim-float">⚙</div>
            <h2 className="landing-cta-title">Ready to take control of your operations?</h2>
            <p className="landing-cta-desc">Sign up for free. No credit card required. Manage unlimited departments.</p>
            <Link to="/signup" className="landing-btn cta-btn large press-effect">
              Get Started — It's Free
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          </RevealDiv>
        </div>
      </section>

      {/* ===== PROJECT ===== */}
      <section className="landing-project" id="project">
        <div className="landing-project-inner">
          <RevealDiv>
            <span className="landing-section-badge">About This Project</span>
          </RevealDiv>
          <RevealDiv delay={1}>
            <h2 className="landing-section-title">Built for the real factory floor</h2>
          </RevealDiv>
          <RevealDiv delay={2}>
            <p className="landing-section-desc">A multi-tenant platform to centralize people, machines, and resources — open to explore.</p>
          </RevealDiv>

          <RevealDiv delay={150}>
            <div className="landing-project-card">
              <div className="landing-project-head">
                <div className="landing-project-head-brand">
                  <Brand size={48} round={12} textSize={1.4} />
                  <p className="landing-project-name-sub">Industry &amp; Department Management System · Multi-tenant SaaS</p>
                </div>
                <a
                  className="landing-project-src"
                  href="https://github.com/maheshsthr/MFGx31"
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.11.79-.25.79-.56v-2.02c-3.2.7-3.87-1.54-3.87-1.54-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.78 1.05.78 2.12v3.14c0 .31.21.68.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z"/></svg>
                  Source Code
                </a>
              </div>

              <div className="landing-project-grid">
                <div className="landing-project-item">
                  <div className="landing-project-item-icon">⚛️</div>
                  <span className="landing-project-label">Technology Stack</span>
                  <div className="landing-project-chips">
                    <span className="landing-chip chip-postgres">Postgres</span>
                    <span className="landing-chip chip-supabase">Supabase</span>
                    <span className="landing-chip chip-express">Express</span>
                    <span className="landing-chip chip-react">React</span>
                    <span className="landing-chip chip-node">Node.js</span>
                  </div>
                </div>

                <div className="landing-project-item">
                  <div className="landing-project-item-icon">👨‍💻</div>
                  <span className="landing-project-label">Developer</span>
                  <div className="landing-dev">
                    <span className="landing-dev-avatar">MS</span>
                    <div>
                      <p className="landing-dev-name">Mahesh Suthar</p>
                      <a className="landing-project-link" href="https://github.com/maheshsthr" target="_blank" rel="noreferrer">@maheshsthr</a>
                    </div>
                  </div>
                </div>

                <div className="landing-project-item">
                  <div className="landing-project-item-icon">📦</div>
                  <span className="landing-project-label">Source Code</span>
                  <a className="landing-project-repo" href="https://github.com/maheshsthr/MFGx31" target="_blank" rel="noreferrer">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.11.79-.25.79-.56v-2.02c-3.2.7-3.87-1.54-3.87-1.54-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.78 1.05.78 2.12v3.14c0 .31.21.68.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z"/></svg>
                    maheshsthr/mfgx31
                  </a>
                </div>

                <div className="landing-project-item">
                  <div className="landing-project-item-icon">🚀</div>
                  <span className="landing-project-label">Deployment</span>
                  <div className="landing-deploy">
                    <span className="landing-deploy-row"><span className="landing-deploy-tag tag-vercel-alt">Vercel</span>Frontend</span>
                    <span className="landing-deploy-row"><span className="landing-deploy-tag tag-supabase">Supabase</span>Database</span>
                    <span className="landing-deploy-row"><span className="landing-deploy-tag tag-vercel-alt">Vercel</span>Backend</span>
                  </div>
                </div>
              </div>
            </div>
          </RevealDiv>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-brand">
            <Brand size={34} textSize={1.1} />
          </div>
          <p className="landing-footer-text">© 2026 MFGx31. Manufacturing operations, simplified.</p>
        </div>
      </footer>
    </div>
  );
}

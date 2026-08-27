import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Brand from '../components/Brand';
import './AuthPages.css';

const PARTNER_BLANK = { name: '', email: '', role: '', ownership_share: 50 };

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [org, setOrg] = useState({
    company_name: '',
    industry: '',
    owner_name: '',
    owner_email: '',
    password: '',
    confirm_password: '',
  });
  const [ownership_type, setOwnership_type] = useState('solo');
  const [partners, setPartners] = useState([{ ...PARTNER_BLANK }]);
  const [partnerErrors, setPartnerErrors] = useState([]);

  function validateStep1() {
    if (!org.company_name.trim()) return 'Company name is required';
    if (!org.industry.trim()) return 'Industry is required';
    if (!org.owner_name.trim()) return 'Owner name is required';
    if (!org.owner_email.trim()) return 'Email is required';
    if (!org.password) return 'Password is required';
    if (org.password.length < 6) return 'Password must be at least 6 characters';
    if (org.password !== org.confirm_password) return 'Passwords do not match';
    return '';
  }

  function validateStep2() {
    if (ownership_type === 'solo') return '';
    const errs = partners.map((p, i) => {
      if (!p.name.trim()) return 'Name is required';
      if (!p.email.trim()) return 'Email is required';
      return '';
    });
    setPartnerErrors(errs);
    if (errs.some(e => e)) return 'Please fill all partner details';
    const totalShare = partners.reduce((s, p) => s + (Number(p.ownership_share) || 0), 0);
    if (totalShare !== 100) return `Partner shares must total 100% (currently ${totalShare}%)`;
    return '';
  }

  function handleNext() {
    const err = validateStep1();
    if (err) { setError(err); return; }
    setError('');
    setStep(2);
  }

  async function handleSignup(e) {
    e.preventDefault();
    const err = validateStep2();
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);
    const owners = ownership_type === 'partnership'
      ? [{ name: org.owner_name, email: org.owner_email, role: 'Owner', ownership_share: 100 - partners.reduce((s, p) => s + (Number(p.ownership_share) || 0), 0) }, ...partners]
      : [];
    const result = await signup(org.company_name, org.industry, org.owner_name, org.owner_email, org.password, ownership_type, owners);
    setLoading(false);
    if (result.success) navigate('/app');
    else setError(result.error || 'Signup failed');
  }

  function addPartner() {
    setPartners([...partners, { ...PARTNER_BLANK }]);
    setPartnerErrors([...partnerErrors, '']);
  }

  function removePartner(idx) {
    setPartners(partners.filter((_, i) => i !== idx));
    setPartnerErrors(partnerErrors.filter((_, i) => i !== idx));
  }

  function updatePartner(idx, field, value) {
    const updated = [...partners];
    updated[idx] = { ...updated[idx], [field]: value };
    setPartners(updated);
  }

  return (
    <div className="auth-page">
      <div className="auth-page-inner">
        {/* Left: Brand */}
        <div className="auth-left">
          <div className="auth-left-inner">
            <div className="auth-left-brand">
              <Brand size={40} round={10} light textSize={1.4} />
            </div>
            <h2 className="auth-left-title">The operating system for manufacturing businesses.</h2>
            <p className="auth-left-desc">
              Manage departments, employees, machinery, and resources across your entire operation.
              Built for factory owners who need clarity, not complexity.
            </p>
            <div className="auth-left-stat-grid">
              <div className="auth-left-stat-item">
                <span className="auth-left-stat-num">500+</span>
                <span className="auth-left-stat-label">Companies</span>
              </div>
              <div className="auth-left-stat-item">
                <span className="auth-left-stat-num">10K+</span>
                <span className="auth-left-stat-label">Departments</span>
              </div>
              <div className="auth-left-stat-item">
                <span className="auth-left-stat-num">50K+</span>
                <span className="auth-left-stat-label">Assets Tracked</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="auth-right">
          <div className="auth-right-inner">
            <div className="auth-card">
              <div className="auth-card-header">
                <div className="auth-card-logo-sm">
                  <Brand size={44} round={10} textSize={1.3} />
                </div>
                <div>
                  <h2 className="auth-card-title">Create your organization</h2>
                  <p className="auth-card-subtitle">Step {step} of 2</p>
                </div>
              </div>

              {/* Progress */}
              <div className="auth-progress">
                <div className="auth-progress-bar" style={{ width: step === 1 ? '50%' : '100%' }}></div>
              </div>

              {error && <div className="auth-error">{error}</div>}

              {step === 1 ? (
                /* ---- Step 1: Org details ---- */
                <form className="auth-form" onSubmit={e => { e.preventDefault(); handleNext(); }}>
                  <div className="auth-field">
                    <label>Company Name</label>
                    <input
                      type="text"
                      placeholder="e.g. MetalWorks Industries"
                      value={org.company_name}
                      onChange={e => setOrg({ ...org, company_name: e.target.value })}
                    />
                  </div>
                  <div className="auth-field">
                    <label>Industry</label>
                    <select
                      value={org.industry}
                      onChange={e => setOrg({ ...org, industry: e.target.value })}
                    >
                      <option value="">Select industry</option>
                      <option>Metal Manufacturing</option>
                      <option>Electronics Assembly</option>
                      <option>Automotive Parts</option>
                      <option>Textiles & Apparel</option>
                      <option>Food & Beverage Processing</option>
                      <option>Pharmaceutical Manufacturing</option>
                      <option>Plastics & Rubber</option>
                      <option>Chemical Processing</option>
                      <option>Wood & Furniture</option>
                      <option>Paper & Packaging</option>
                      <option>Heavy Engineering</option>
                      <option>Precision Engineering</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="auth-field">
                    <label>Your Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Rajesh Kumar"
                      value={org.owner_name}
                      onChange={e => setOrg({ ...org, owner_name: e.target.value })}
                    />
                  </div>
                  <div className="auth-field">
                    <label>Email</label>
                    <input
                      type="email"
                      placeholder="you@company.com"
                      value={org.owner_email}
                      onChange={e => setOrg({ ...org, owner_email: e.target.value })}
                    />
                  </div>
                  <div className="auth-field-row">
                    <div className="auth-field">
                      <label>Password</label>
                      <input
                        type="password"
                        placeholder="Min 6 characters"
                        value={org.password}
                        onChange={e => setOrg({ ...org, password: e.target.value })}
                      />
                    </div>
                    <div className="auth-field">
                      <label>Confirm Password</label>
                      <input
                        type="password"
                        placeholder="Repeat password"
                        value={org.confirm_password}
                        onChange={e => setOrg({ ...org, confirm_password: e.target.value })}
                      />
                    </div>
                  </div>
                  <button type="submit" className="auth-submit press-effect">
                    Continue
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </form>
              ) : (
                /* ---- Step 2: Ownership structure ---- */
                <form className="auth-form" onSubmit={handleSignup}>
                  <div className="auth-field">
                    <label>Ownership Structure</label>
                    <div className="auth-ownership-select">
                      <button
                        type="button"
                        className={`auth-ownership-option ${ownership_type === 'solo' ? 'active' : ''}`}
                        onClick={() => { setOwnership_type('solo'); setPartners([PARTNER_BLANK]); setPartnerErrors([]); }}
                      >
                        <span className="auth-ownership-icon">👤</span>
                        <div>
                          <strong>Sole Ownership</strong>
                          <span>Single owner — full control</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        className={`auth-ownership-option ${ownership_type === 'partnership' ? 'active' : ''}`}
                        onClick={() => { setOwnership_type('partnership'); if (partners.length === 0) setPartners([{ ...PARTNER_BLANK }]); }}
                      >
                        <span className="auth-ownership-icon">👥</span>
                        <div>
                          <strong>Partnership</strong>
                          <span>Multiple owners with shares</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {ownership_type === 'partnership' && (
                    <div className="auth-partners-section">
                      <div className="auth-partners-header">
                        <span>Partners</span>
                        <button type="button" className="auth-partner-add press-effect" onClick={addPartner}>
                          + Add Partner
                        </button>
                      </div>
                      {partners.map((p, i) => (
                        <div key={i} className="auth-partner-card">
                          <div className="auth-partner-row">
                            <div className="auth-field">
                              <label>Name</label>
                              <input
                                type="text"
                                placeholder="Partner name"
                                value={p.name}
                                onChange={e => updatePartner(i, 'name', e.target.value)}
                              />
                              {partnerErrors[i] && <span className="auth-field-error">{partnerErrors[i]}</span>}
                            </div>
                            <div className="auth-field">
                              <label>Email</label>
                              <input
                                type="email"
                                placeholder="partner@company.com"
                                value={p.email}
                                onChange={e => updatePartner(i, 'email', e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="auth-partner-row">
                            <div className="auth-field">
                              <label>Role</label>
                              <input
                                type="text"
                                placeholder="e.g. Co-owner, Director"
                                value={p.role}
                                onChange={e => updatePartner(i, 'role', e.target.value)}
                              />
                            </div>
                            <div className="auth-field">
                              <label>Ownership Share (%)</label>
                              <input
                                type="number"
                                min="1"
                                max="99"
                                placeholder="%"
                                value={p.ownership_share}
                                onChange={e => updatePartner(i, 'ownership_share', e.target.value)}
                              />
                            </div>
                          </div>
                          {partners.length > 1 && (
                            <button type="button" className="auth-partner-remove press-effect" onClick={() => removePartner(i)}>
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      <div className="auth-partners-share-total">
                        {(() => {
                          const total = partners.reduce((s, p) => s + (Number(p.ownership_share) || 0), 0);
                          return (
                            <div className={`auth-share-bar-wrap ${total === 100 ? 'valid' : total > 100 ? 'over' : ''}`}>
                              <div className="auth-share-bar">
                                <div className="auth-share-bar-fill" style={{ width: `${Math.min(total, 100)}%` }}></div>
                              </div>
                              <span className="auth-share-total-label">Partner total: <strong>{total}%</strong> {total === 100 ? '✓' : `(owner gets ${100 - total}%)`}</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {ownership_type === 'partnership' && (
                    <div className="auth-field">
                      <label>Or edit your own share as admin</label>
                      <div className="auth-owner-info">
                        <span className="auth-owner-name">{org.owner_name || 'You'}</span>
                        <span className="auth-owner-role">Admin</span>
                      </div>
                    </div>
                  )}

                  <div className="auth-form-actions">
                    <button type="button" className="auth-btn-secondary press-effect" onClick={() => setStep(1)}>
                      Back
                    </button>
                    <button type="submit" className="auth-submit press-effect" disabled={loading}>
                      {loading ? 'Creating Organization...' : 'Create Organization'}
                    </button>
                  </div>
                </form>
              )}

              <div className="auth-card-footer">
                <p>Already have an account? <Link to="/login">Log in</Link></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

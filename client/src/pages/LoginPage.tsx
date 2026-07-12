import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input, showToast } from "../components/ui";
import { useAuthStore } from "../stores/useAuthStore";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const nav = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      showToast("Signed in successfully", "success");
      nav("/");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? "Something went wrong";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const fill = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  };

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-split-layout">
        
        {/* Left Hero Panel (hidden on mobile) */}
        <div className="auth-hero-section">
          {/* Background glowing blobs */}
          <div className="glow-blob glow-blob-1" />
          <div className="glow-blob glow-blob-2" />

          {/* Logo Header */}
          <div className="auth-hero-header">
            <div className="auth-logo-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="auth-logo-text">AssetFlow</span>
          </div>

          {/* Body content */}
          <div className="auth-hero-body">
            <h1 className="auth-hero-title">
              Enterprise Asset Management <span>Simplified.</span>
            </h1>
            <p className="auth-hero-subtitle">
              Manage your company's equipment, handle requests, manage inventory, schedule preventative maintenance, and run smart audit sessions seamlessly in real-time.
            </p>

            {/* Floating Glassmorphic Cards & Flow */}
            <div className="auth-hero-visuals">
              
              {/* Widget 1: Stats */}
              <div className="glass-widget widget-stats">
                <span className="widget-label">Active Deployments</span>
                <div className="widget-val">
                  1,248
                  <span className="widget-badge">+14.2%</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
                  <span className="pulse-indicator" /> System Online & Synced
                </div>
              </div>

              {/* Widget 2: Flow diagram */}
              <div className="glass-widget widget-flow">
                <span className="widget-label">Asset Lifecycle</span>
                <div className="flow-step-container">
                  <div className="flow-step-line" />
                  <div className="flow-step-line-active" />
                  
                  <div className="flow-step completed">
                    1
                    <span className="flow-step-label">Acquire</span>
                  </div>
                  <div className="flow-step active">
                    2
                    <span className="flow-step-label">Allocate</span>
                  </div>
                  <div className="flow-step">
                    3
                    <span className="flow-step-label">Audit</span>
                  </div>
                  <div className="flow-step">
                    4
                    <span className="flow-step-label">Retire</span>
                  </div>
                </div>
              </div>

              {/* Widget 3: Activity Log */}
              <div className="glass-widget widget-activity">
                <span className="widget-label">Live Activity Feed</span>
                <div className="activity-item">
                  <div className="activity-icon">💻</div>
                  <div className="activity-info">
                    <div className="activity-title">MacBook Pro Allocated</div>
                    <div className="activity-time">Just now — Manager</div>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon">🔧</div>
                  <div className="activity-info">
                    <div className="activity-title">Server Audit Completed</div>
                    <div className="activity-time">3m ago — Admin</div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Hero Footer */}
          <div className="auth-hero-footer">
            <span>© {new Date().getFullYear()} AssetFlow Enterprise.</span>
            <div style={{ display: "flex", gap: 16 }}>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="auth-form-section">
          <div className="auth-form-inner">
            
            {/* Mobile Logo */}
            <div className="auth-form-logo-mobile">
              <div className="auth-logo-icon" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="auth-logo-text" style={{ background: "linear-gradient(135deg, var(--color-primary) 60%, var(--color-secondary) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 800 }}>AssetFlow</span>
            </div>

            {/* Form Header */}
            <div className="auth-form-header">
              <h2 className="auth-form-title">Welcome Back</h2>
              <p className="auth-form-subtitle">Enter your credentials to manage your asset operations</p>
            </div>

            {/* Form Card */}
            <div className="auth-form-card">
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                
                {/* Email Input */}
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  leftIcon={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  }
                />

                {/* Password Input */}
                <Input
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  leftIcon={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  }
                  rightIcon={
                    <button type="button" className="input-icon-right" onClick={togglePassword} tabIndex={-1}>
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                          <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                          <line x1="2" x2="22" y1="2" y2="22" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  }
                />

                {/* Remember Me and Forgot Password */}
                <div className="auth-form-options">
                  <label className="remember-me-checkbox">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    Remember me
                  </label>
                  <Link to="/forgot-password" className="forgot-password-link">Forgot password?</Link>
                </div>

                {/* Submit Button */}
                <button type="submit" className="btn-premium" disabled={loading}>
                  {loading ? "Signing In..." : (
                    <>
                      Sign In
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              {/* Quick Login Section */}
              <div className="quick-login-divider">Or quick sign in as</div>
              <div className="quick-login-grid">
                
                {/* Admin */}
                <div className="quick-login-chip admin" onClick={() => fill("admin@assetflow.com", "admin123")}>
                  <div className="quick-login-avatar" style={{ background: "var(--color-primary)" }}>AD</div>
                  <div className="quick-login-meta">
                    <span className="quick-login-role">Admin</span>
                    <span className="quick-login-email">admin@assetflow.com</span>
                  </div>
                </div>

                {/* Manager */}
                <div className="quick-login-chip manager" onClick={() => fill("manager@assetflow.com", "manager123")}>
                  <div className="quick-login-avatar" style={{ background: "var(--color-warning)" }}>MN</div>
                  <div className="quick-login-meta">
                    <span className="quick-login-role">Manager</span>
                    <span className="quick-login-email">manager@assetflow.com</span>
                  </div>
                </div>

                {/* Dept Head */}
                <div className="quick-login-chip dept" onClick={() => fill("depthead@assetflow.com", "dept123")}>
                  <div className="quick-login-avatar" style={{ background: "var(--color-info)" }}>DH</div>
                  <div className="quick-login-meta">
                    <span className="quick-login-role">Dept Head</span>
                    <span className="quick-login-email">depthead@assetflow.com</span>
                  </div>
                </div>

                {/* Employee */}
                <div className="quick-login-chip employee" onClick={() => fill("employee@assetflow.com", "emp123")}>
                  <div className="quick-login-avatar" style={{ background: "var(--color-success)" }}>EM</div>
                  <div className="quick-login-meta">
                    <span className="quick-login-role">Employee</span>
                    <span className="quick-login-email">employee@assetflow.com</span>
                  </div>
                </div>

              </div>

            </div>

            {/* Signup Link */}
            <div className="auth-footer-text">
              Don't have an account? <Link to="/signup">Create account</Link>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}


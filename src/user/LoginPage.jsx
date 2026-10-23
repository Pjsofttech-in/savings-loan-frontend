// src/user/LoginPage.jsx
import { useEffect, useRef, useState } from "react";
import logo from "../assets/Pj Soft.png";
import { login } from "../services/authService";

const REMEMBER_KEY = "pj_remember_user";

const ROLES = {
  MEMBER: {
    label: "Member Login",
    idLabel: "User ID",
    idHint: "Registered mobile number or Member ID",
    autoComplete: "username",
  },
  ADMIN: {
    label: "Administrator",
    idLabel: "Administrator ID",
    idHint: "Administrator username",
    autoComplete: "username",
  },
};

function readRemembered() {
  try {
    const saved = JSON.parse(localStorage.getItem(REMEMBER_KEY) || "null");
    if (saved && ROLES[saved.role] && typeof saved.userId === "string") return saved;
  } catch {
    /* ignore corrupt value */
  }
  return null;
}

function Icon({ name }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  if (name === "eye") return <svg {...common}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>;
  if (name === "eye-off") return <svg {...common}><path d="M3 3l18 18" /><path d="M10.6 6.1A9.8 9.8 0 0112 6c6.5 0 10 6 10 6a17 17 0 01-3.2 3.9M6.6 6.7C3.9 8.5 2 12 2 12s3.5 7 10 7c1.6 0 3-.3 4.2-.9" /><path d="M9.9 9.9a3 3 0 004.2 4.2" /></svg>;
  return null;
}

export default function LoginPage({ onLoggedIn, notice = "" }) {
  const [remembered] = useState(readRemembered);
  const [role, setRole] = useState(remembered?.role || "MEMBER");
  const [userId, setUserId] = useState(remembered?.userId || "");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(Boolean(remembered));
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [error, setError] = useState("");
  const [lockedFor, setLockedFor] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const userRef = useRef(null);
  const passwordRef = useRef(null);

  useEffect(() => {
    (remembered ? passwordRef : userRef).current?.focus();
  }, [remembered]);

  // Countdown while the account is locked after too many wrong passwords
  useEffect(() => {
    if (lockedFor <= 0) return undefined;
    const timer = setInterval(() => {
      setLockedFor((seconds) => {
        if (seconds <= 1) {
          setError("");
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockedFor]);

  const switchRole = (next) => {
    if (next === role || submitting) return;
    setRole(next);
    setError("");
    setPassword("");
    userRef.current?.focus();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting || lockedFor > 0) return;
    const cleanId = userId.trim();
    if (!cleanId || !password) {
      setError("Enter your User ID and password.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const session = await login({ userId: cleanId, password, role });
      if (remember) {
        localStorage.setItem(REMEMBER_KEY, JSON.stringify({ role, userId: cleanId }));
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
      setPassword("");
      onLoggedIn(session);
    } catch (err) {
      setError(err.message);
      setPassword("");
      if (err.status === 429 && err.retryAfterSeconds) setLockedFor(Number(err.retryAfterSeconds));
      passwordRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  const detectCaps = (event) => setCapsLock(event.getModifierState?.("CapsLock") ?? false);
  const config = ROLES[role];
  const disabled = submitting || lockedFor > 0;
  const lockText = lockedFor > 0 ? `${Math.floor(lockedFor / 60)}:${String(lockedFor % 60).padStart(2, "0")}` : "";

  return (
    <div className="min-h-screen bg-white">
      {/* Same header as the rest of the application */}
      <header className="top-navbar">
        <div className="navbar-brand" style={{ display: "flex", alignItems: "center", gap: 12, color: "#fff" }}>
          <img src={logo} alt="PJSoftTech logo" />
          <span>
            <strong>PJSoftTech. Pvt.Ltd</strong>
            <small>Private Members Savings &amp; Loan Group</small>
          </span>
        </div>
      </header>

      <main className="flex items-start justify-center px-5 pt-[120px] pb-10">
        <div className="w-full max-w-[460px] bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="px-6 pt-6">
            <span className="text-xs font-bold text-[#2878cf] uppercase tracking-wider">Secure Access</span>
            <h1 className="text-2xl font-extrabold text-[#102a43] m-0">Sign in</h1>
            <p className="text-xs text-slate-500 mt-1 mb-4">Log in to continue to your account.</p>

            <div role="tablist" aria-label="Sign in as" className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
              {Object.entries(ROLES).map(([key, item]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={role === key}
                  onClick={() => switchRole(key)}
                  className={`flex-1 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${role === key ? "bg-[#347fd1] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 space-y-4" noValidate>
            {notice && !error && (
              <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-xs px-3 py-2.5">{notice}</div>
            )}
            {error && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs px-3 py-2.5">
                {error}
                {lockText && <strong className="block mt-1 text-sm">Try again in {lockText}</strong>}
              </div>
            )}

            <div>
              <label htmlFor="login-user" className="block text-[10px] font-bold text-slate-700 uppercase mb-1">{config.idLabel}</label>
              <input
                id="login-user"
                ref={userRef}
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder={config.idHint}
                autoComplete={config.autoComplete}
                autoCapitalize="none"
                spellCheck={false}
                maxLength={100}
                disabled={disabled}
                className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg outline-none focus:border-[#2878cf] bg-white disabled:bg-slate-50"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  ref={passwordRef}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={detectCaps}
                  onKeyUp={detectCaps}
                  onBlur={() => setCapsLock(false)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  maxLength={128}
                  disabled={disabled}
                  className="w-full h-10 pl-3 pr-10 text-sm border border-slate-300 rounded-lg outline-none focus:border-[#2878cf] bg-white disabled:bg-slate-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 grid place-items-center rounded-md text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  <Icon name={showPassword ? "eye-off" : "eye"} />
                </button>
              </div>
              {capsLock && <p className="text-[11px] text-amber-700 mt-1 m-0">Caps Lock is on.</p>}
            </div>

            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-4 h-4 accent-[#347fd1]" />
                Remember my User ID
              </label>
              <span className="text-[11px] text-slate-500 text-right">Forgot password? Contact the administrator.</span>
            </div>

            <button
              type="submit"
              disabled={disabled}
              className="w-full h-10 rounded-xl bg-[#347fd1] hover:bg-[#2878cf] disabled:bg-slate-400 text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-sm cursor-pointer disabled:cursor-not-allowed"
            >
              {submitting && <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" aria-hidden="true" />}
              {submitting ? "Signing in…" : lockText ? `Locked — ${lockText}` : "Sign in"}
            </button>

            <p className="text-[11px] text-slate-500 leading-relaxed m-0">
              Never share your password. PJSoftTech staff will never ask for it. Sign out when you use a shared computer.
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}

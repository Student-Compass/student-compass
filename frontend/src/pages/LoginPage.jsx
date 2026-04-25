import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../lib/auth";
import { formatApiError } from "../lib/api";
import { SpinningCompass } from "../components/SpinningCompass";

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const u = await login({ email: form.email.trim(), password: form.password });
      toast.success(`Welcome back, ${u.username}!`);
      const redirect = location.state?.from || `/campus/${u.home_campus || "john-jay"}`;
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" data-testid="login-page">
      {/* Left brand panel */}
      <aside className="hidden lg:flex lg:w-1/2 relative bg-cuny-navy text-white overflow-hidden">
        <div className="absolute inset-0 grain opacity-30" />
        <div className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full bg-cuny-gold/15 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-[420px] h-[420px] rounded-full bg-white/5 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link to="/" className="flex items-center gap-3 w-fit">
            <SpinningCompass size={36} />
            <div className="font-serif text-2xl">Student <span className="text-cuny-gold">Compass</span></div>
          </Link>

          <div>
            <h2 className="font-serif text-5xl leading-[1.05] mb-4">
              Welcome back to your<br />
              <span className="italic text-cuny-gold">CUNY</span> compass.
            </h2>
            <p className="text-white/70 max-w-md text-lg leading-relaxed">
              Pick up right where you left off. Your saved resources, recent questions, and home campus are waiting.
            </p>
          </div>

          <div className="text-xs font-mono uppercase tracking-[0.22em] text-white/50">
            17 campuses · One compass
          </div>
        </div>
      </aside>

      {/* Right form */}
      <main className="flex-1 flex items-center justify-center p-6 md:p-12 bg-surface-bg">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <SpinningCompass size={32} />
            <div className="font-serif text-cuny-navy text-xl">Student <span className="text-cuny-gold">Compass</span></div>
          </div>

          <div className="text-[10px] uppercase tracking-[0.22em] font-mono text-cuny-gold mb-3">Sign in</div>
          <h1 className="font-serif text-cuny-navy text-4xl mb-2">Hello again.</h1>
          <p className="text-ink-700 mb-8">Enter your CUNY (or any) email and password.</p>

          <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-cuny-navy mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-cuny-navy/15 focus:border-cuny-navy outline-none transition text-[15px]"
                  data-testid="login-email"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-cuny-navy mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  type={showPwd ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-white border border-cuny-navy/15 focus:border-cuny-navy outline-none transition text-[15px]"
                  data-testid="login-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-cuny-navy"
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700" data-testid="login-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-cuny-navy text-white font-semibold hover:bg-cuny-navyDeep transition disabled:opacity-60 shadow-lg shadow-cuny-navy/20"
              data-testid="login-submit"
            >
              {submitting ? "Signing in…" : (<>Sign in <ArrowRight className="w-4 h-4" /></>)}
            </button>
          </form>

          <div className="mt-8 text-sm text-ink-700">
            Don't have an account yet?{" "}
            <Link to="/signup" className="font-semibold text-cuny-navy hover:underline" data-testid="login-to-signup">
              Create one →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;

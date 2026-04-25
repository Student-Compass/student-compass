import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, AtSign, Eye, EyeOff, Lock, Mail, School } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../lib/auth";
import { fetchCampuses, formatApiError } from "../lib/api";
import { SpinningCompass } from "../components/SpinningCompass";
import { CampusSwitcher } from "../components/CampusSwitcher";

export const SignupPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [campuses, setCampuses] = useState([]);
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ email: "", username: "", password: "", home_campus: "john-jay" });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCampuses().then(setCampuses).catch(() => setCampuses([]));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.username.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const u = await register({
        email: form.email.trim(),
        username: form.username.trim(),
        password: form.password,
        home_campus: form.home_campus,
      });
      toast.success(`Welcome, ${u.username}! Your compass is calibrated.`);
      navigate(`/campus/${u.home_campus}`, { replace: true });
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const activeCampus = campuses.find((c) => c.slug === form.home_campus);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" data-testid="signup-page">
      {/* Left brand panel */}
      <aside className="hidden lg:flex lg:w-1/2 relative bg-cuny-navy text-white overflow-hidden">
        <div className="absolute inset-0 grain opacity-30" />
        <div className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full bg-cuny-gold/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-[420px] h-[420px] rounded-full bg-white/5 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link to="/" className="flex items-center gap-3 w-fit">
            <SpinningCompass size={36} />
            <div className="font-serif text-2xl">Student <span className="text-cuny-gold">Compass</span></div>
          </Link>

          <div>
            <h2 className="font-serif text-5xl leading-[1.05] mb-4">
              Join the <span className="italic text-cuny-gold">student-built</span><br />
              CUNY guidance crew.
            </h2>
            <p className="text-white/70 max-w-md text-lg leading-relaxed">
              Pick a username (be creative — we'll show it off), choose your home campus, and start
              asking. Your saved resources travel with you across all 17 campuses.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { k: "Free", v: "Forever" },
              { k: "Ads", v: "None" },
              { k: "Privacy", v: "Yours" },
            ].map((s) => (
              <div key={s.k} className="rounded-xl bg-white/5 border border-white/10 px-3 py-3">
                <div className="text-[10px] uppercase tracking-widest font-mono text-white/50">{s.k}</div>
                <div className="font-serif text-cuny-gold text-lg mt-0.5">{s.v}</div>
              </div>
            ))}
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

          <div className="text-[10px] uppercase tracking-[0.22em] font-mono text-cuny-gold mb-3">Create account</div>
          <h1 className="font-serif text-cuny-navy text-4xl mb-2">Get your bearings.</h1>
          <p className="text-ink-700 mb-8">Three quick fields — that's it.</p>

          <form onSubmit={handleSubmit} className="space-y-4" data-testid="signup-form">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-cuny-navy mb-1.5 block">Username</label>
              <div className="relative">
                <AtSign className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  required
                  minLength={3}
                  maxLength={24}
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  placeholder="e.g. mavis_NYC"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-cuny-navy/15 focus:border-cuny-navy outline-none transition text-[15px]"
                  data-testid="signup-username"
                />
              </div>
              <div className="text-[11px] text-ink-500 mt-1.5 ml-1">Letters, numbers, _ . - · 3–24 chars</div>
            </div>

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
                  data-testid="signup-email"
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
                  minLength={6}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-white border border-cuny-navy/15 focus:border-cuny-navy outline-none transition text-[15px]"
                  data-testid="signup-password"
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

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-cuny-navy mb-1.5 block">Home campus</label>
              <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white border border-cuny-navy/15">
                <School className="w-4 h-4 text-ink-400" />
                <div className="flex-1 text-[14px] text-ink-700">
                  {activeCampus ? activeCampus.name : "Pick your campus"}
                </div>
                {campuses.length > 0 && (
                  <CampusSwitcher
                    campuses={campuses}
                    current={form.home_campus}
                    onSelect={(slug) => setForm((f) => ({ ...f, home_campus: slug }))}
                  />
                )}
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700" data-testid="signup-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-cuny-navy text-white font-semibold hover:bg-cuny-navyDeep transition disabled:opacity-60 shadow-lg shadow-cuny-navy/20"
              data-testid="signup-submit"
            >
              {submitting ? "Creating account…" : (<>Create my account <ArrowRight className="w-4 h-4" /></>)}
            </button>
          </form>

          <div className="mt-8 text-sm text-ink-700">
            Already on Compass?{" "}
            <Link to="/login" className="font-semibold text-cuny-navy hover:underline" data-testid="signup-to-login">
              Sign in →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SignupPage;

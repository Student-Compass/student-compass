import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Compass, Heart, MessageSquare, Sparkles, Users } from "lucide-react";
import { Header } from "../components/Header";
import { CollegeMarquee } from "../components/CollegeMarquee";
import { SpinningCompass } from "../components/SpinningCompass";
import { fetchCampuses } from "../lib/api";
import { useAuth } from "../lib/auth";

export const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [campuses, setCampuses] = useState([]);

  useEffect(() => {
    fetchCampuses().then(setCampuses).catch(() => setCampuses([]));
  }, []);

  const enterHub = () => {
    if (user) navigate(`/campus/${user.home_campus || "john-jay"}`);
    else navigate("/signup");
  };

  return (
    <div className="min-h-screen flex flex-col" data-testid="home-page">
      <Header campuses={campuses} current={user?.home_campus || "john-jay"} onSelectCampus={(s) => navigate(`/campus/${s}`)} />

      {/* HERO */}
      <section className="relative grain">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 pt-16 md:pt-24 pb-16">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <motion.div
              className="lg:col-span-7"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cuny-navy/15 bg-white text-xs font-mono uppercase tracking-[0.18em] text-cuny-navy mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-cuny-gold animate-pulse" />
                Built by students · For students
              </div>

              <h1 className="font-serif text-cuny-navy text-5xl md:text-6xl lg:text-[72px] leading-[1.04] tracking-tight">
                A compass for every
                <br />
                <span className="italic">CUNY</span> student.
              </h1>

              <p className="mt-6 max-w-xl text-lg text-ink-700 leading-relaxed">
                Student Compass is an AI guide that knows your campus inside-out — from
                <span className="font-serif text-cuny-navy"> John Jay </span>
                to <span className="font-serif text-cuny-navy">Hunter</span>,
                <span className="font-serif text-cuny-navy"> Baruch</span>, and beyond. Ask anything about
                events, advising, financial aid, or safety, and get cited answers in seconds.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
                <button
                  onClick={enterHub}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-cuny-navy text-white font-semibold hover:bg-cuny-navyDeep transition shadow-lg shadow-cuny-navy/20"
                  data-testid="home-cta-primary"
                >
                  {user ? `Open ${user.username}'s hub` : "Create your account"}
                  <ArrowRight className="w-4 h-4" />
                </button>
                {!user && (
                  <>
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-cuny-navy/20 bg-white text-cuny-navy font-semibold hover:border-cuny-navy transition"
                      data-testid="home-cta-login"
                    >
                      Sign in
                    </Link>
                    <Link
                      to="/campus/john-jay?guest=1"
                      className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full text-cuny-navy/80 font-medium hover:text-cuny-navy hover:bg-cuny-navy/5 transition"
                      data-testid="home-cta-guest"
                    >
                      <Sparkles className="w-4 h-4" />
                      Try without signing up
                    </Link>
                  </>
                )}
              </div>
              {!user && (
                <div className="mt-4 text-xs text-ink-500 max-w-md leading-relaxed" data-testid="home-guest-disclaimer">
                  Guest mode is fully open — ask away. Just note that nothing you ask or any
                  resource you bookmark is saved when you leave the page.
                </div>
              )}

              <div className="mt-10 flex items-center gap-8 text-xs uppercase tracking-[0.18em] font-mono text-ink-500">
                <div className="flex items-center gap-2"><Compass className="w-4 h-4 text-cuny-navy" /> 17 campuses</div>
                <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-cuny-gold" /> Claude Sonnet 4.5</div>
                <div className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-cuny-navy" /> Live RAG</div>
              </div>
            </motion.div>

            {/* Right ornamental */}
            <motion.div
              className="lg:col-span-5 relative"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <div className="aspect-[4/5] rounded-3xl bg-gradient-to-br from-white to-[#EAF1F8] border border-cuny-navy/10 p-8 relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-72 h-72 rounded-full bg-cuny-gold/10 blur-3xl" />
                <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full bg-cuny-navy/10 blur-3xl" />
                <div className="relative">
                  <div className="text-[10px] uppercase tracking-[0.22em] font-mono text-cuny-navy/60 mb-4">
                    Compass Reply · Sample
                  </div>
                  <div className="bg-white border border-ink-900/10 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
                    <p className="text-sm text-ink-900 leading-relaxed">
                      The next CUNY-wide career fair is on <strong>Mar 14 in Haaren Hall, Room L.61</strong>.
                      All CUNY students may attend with a valid ID.
                    </p>
                  </div>
                  <div className="mt-3 text-[11px] font-mono text-ink-500">sources · jjay.cuny.edu · cuny.edu/events</div>
                  <div className="mt-10 grid grid-cols-2 gap-3">
                    {[
                      { label: "Events", value: "Live" },
                      { label: "Advising", value: "24/7" },
                      { label: "Aid Deadlines", value: "Tracked" },
                      { label: "Cross-Campus", value: "Yes" },
                    ].map((s) => (
                      <div key={s.label} className="bg-white border border-cuny-navy/10 rounded-xl px-3 py-3">
                        <div className="text-[10px] uppercase tracking-widest font-mono text-ink-500">{s.label}</div>
                        <div className="font-serif text-cuny-navy text-lg mt-0.5">{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {campuses.length > 0 && <CollegeMarquee campuses={campuses} />}

      {/* ABOUT — our story */}
      <section className="relative" data-testid="about-section">
        <div className="max-w-[1180px] mx-auto px-6 md:px-12 py-24">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-5">
              <div className="text-[10px] uppercase tracking-[0.22em] font-mono text-cuny-gold mb-3">Our story</div>
              <h2 className="font-serif text-cuny-navy text-4xl md:text-5xl leading-[1.05] tracking-tight">
                A group of CUNY students,
                <br />
                <span className="italic">building for</span> CUNY students.
              </h2>
            </div>
            <div className="lg:col-span-7 space-y-5 text-ink-700 leading-relaxed text-[17px]">
              <p>
                We're a small crew of CUNY undergraduates who got tired of digging through 8 different
                websites to find a deadline, an office hour, or a single room number. So we built the
                tool we wished existed — one place where any CUNY student can ask a real question and
                get a real, sourced answer.
              </p>
              <p>
                Compass scrapes your campus's live pages and reasons over them with Anthropic's Claude.
                It can hop between campuses too — ask about a Hunter event from your Baruch dashboard
                and Compass figures it out. No more tab-graveyards.
              </p>
              <p>
                We made this for the commuter who has 15 minutes between classes, the freshman who
                hasn't memorized acronyms yet, and the senior who just needs the registrar's hours
                <em> right now</em>. If it saves you a single email, it was worth building.
              </p>

              <div className="grid sm:grid-cols-3 gap-3 pt-6">
                {[
                  { icon: Users, label: "Made by students" },
                  { icon: Heart, label: "Free for CUNY" },
                  { icon: MessageSquare, label: "Open feedback" },
                ].map((b, i) => {
                  const I = b.icon;
                  return (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-cuny-navy/10">
                      <div className="w-9 h-9 rounded-lg bg-cuny-navy/5 flex items-center justify-center">
                        <I className="w-4.5 h-4.5 text-cuny-navy" />
                      </div>
                      <span className="text-sm font-medium text-cuny-navy">{b.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-white/60 border-y border-cuny-navy/10">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-20">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: "01", t: "Sign up in seconds", b: "Create your username, pick your home campus, and you're in. No CUNY email required." },
              { n: "02", t: "Ask anything", b: "Events, deadlines, ID replacement, advising, safety — Compass scrapes the live source." },
              { n: "03", t: "Save & revisit", b: "Bookmark replies as resources. Switch campuses any time — your saved stuff travels with you." },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl bg-white border border-cuny-navy/10 p-6">
                <div className="font-mono text-xs tracking-[0.22em] uppercase text-cuny-gold">{s.n}</div>
                <h3 className="font-serif text-cuny-navy text-2xl mt-3">{s.t}</h3>
                <p className="mt-2 text-ink-700 leading-relaxed">{s.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="max-w-[1280px] mx-auto px-6 md:px-12 py-20 text-center">
          <SpinningCompass size={56} className="mx-auto mb-6" />
          <h2 className="font-serif text-cuny-navy text-4xl md:text-5xl leading-tight">
            Ready to find your bearings?
          </h2>
          <p className="mt-3 text-ink-700 max-w-xl mx-auto">
            Create a free Student Compass account. Pick a username, pick your home campus, and start asking.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 flex-wrap">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-cuny-navy text-white font-semibold hover:bg-cuny-navyDeep transition shadow-lg shadow-cuny-navy/20"
              data-testid="home-bottom-signup"
            >
              Create my account
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-cuny-navy/20 bg-white text-cuny-navy font-semibold hover:border-cuny-navy transition"
            >
              I already have an account
            </Link>
            <Link
              to="/campus/john-jay?guest=1"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full text-cuny-navy/80 font-medium hover:text-cuny-navy hover:bg-cuny-navy/5 transition"
              data-testid="home-bottom-guest"
            >
              <Sparkles className="w-4 h-4" />
              Try as guest
            </Link>
          </div>
        </section>
      )}

      <footer className="mt-auto border-t border-cuny-navy/10 bg-white/60">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-6 flex items-center justify-between">
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-500">
            Student Compass · Independent CUNY tool
          </div>
          <div className="text-xs text-ink-500">Built with Claude · Firecrawl · Tavily</div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;

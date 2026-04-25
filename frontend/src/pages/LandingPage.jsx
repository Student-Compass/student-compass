import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Compass, Globe2, Sparkles } from "lucide-react";
import { Header } from "../components/Header";
import { CollegeMarquee } from "../components/CollegeMarquee";
import { CampusSwitcher } from "../components/CampusSwitcher";
import { fetchCampuses } from "../lib/api";

export const LandingPage = () => {
  const navigate = useNavigate();
  const [campuses, setCampuses] = useState([]);

  useEffect(() => {
    fetchCampuses().then(setCampuses).catch(() => setCampuses([]));
  }, []);

  return (
    <div className="min-h-screen flex flex-col" data-testid="landing-page">
      <Header campuses={campuses} current="john-jay" onSelectCampus={(slug) => navigate(`/campus/${slug}`)} />

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
                CUNY-wide · Live web context
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

              <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <button
                  onClick={() => navigate("/campus/john-jay")}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-cuny-navy text-white font-semibold hover:bg-cuny-navyDeep transition shadow-lg shadow-cuny-navy/20"
                  data-testid="enter-john-jay-btn"
                >
                  Enter the John Jay Hub
                  <ArrowRight className="w-4 h-4" />
                </button>

                {campuses.length > 0 && (
                  <CampusSwitcher
                    campuses={campuses}
                    current="john-jay"
                    onSelect={(slug) => navigate(`/campus/${slug}`)}
                    variant="hero"
                  />
                )}
              </div>

              <div className="mt-10 flex items-center gap-8 text-xs uppercase tracking-[0.18em] font-mono text-ink-500">
                <div className="flex items-center gap-2"><Compass className="w-4 h-4 text-cuny-navy" /> 17 campuses</div>
                <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-cuny-gold" /> Claude Sonnet 4.5</div>
                <div className="flex items-center gap-2"><Globe2 className="w-4 h-4 text-cuny-navy" /> Live RAG</div>
              </div>
            </motion.div>

            {/* Right ornamental panel */}
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
                      The next CUNY-wide career fair is on <strong>Mar 14 in Haaren Hall, Room <strong>L.61</strong></strong>.
                      All CUNY students may attend with a valid ID.
                    </p>
                  </div>
                  <div className="mt-3 text-[11px] font-mono text-ink-500">
                    sources · jjay.cuny.edu · cuny.edu/events
                  </div>

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

      {/* MARQUEE */}
      {campuses.length > 0 && <CollegeMarquee campuses={campuses} />}

      {/* HOW IT WORKS */}
      <section className="max-w-[1280px] mx-auto px-6 md:px-12 py-20">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { n: "01", t: "Pick your campus", b: "Switch between any of CUNY's 17 colleges. Compass remembers your home base." },
            { n: "02", t: "Ask anything", b: "Events, deadlines, ID replacement, advising, safety — Compass scrapes the live source." },
            { n: "03", t: "Save & revisit", b: "Bookmark replies as resources. Recent queries stay one click away." },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl bg-white border border-cuny-navy/10 p-6">
              <div className="font-mono text-xs tracking-[0.22em] uppercase text-cuny-gold">{s.n}</div>
              <h3 className="font-serif text-cuny-navy text-2xl mt-3">{s.t}</h3>
              <p className="mt-2 text-ink-700 leading-relaxed">{s.b}</p>
            </div>
          ))}
        </div>
      </section>

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

export default LandingPage;

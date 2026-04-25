import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Info, MenuIcon, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { SuggestionTiles } from "../components/SuggestionTiles";
import { ChatMessage, ThinkingBubble } from "../components/ChatMessage";
import { useAuth } from "../lib/auth";
import {
  askCompass,
  fetchCampuses,
  fetchHistory,
  fetchSaved,
  saveResource,
  deleteResource,
} from "../lib/api";

export const ResourceCenter = () => {
  const { campusSlug = "john-jay" } = useParams();
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const { user, loading: authLoading } = useAuth();
  const isGuest = !authLoading && !user;

  const [campuses, setCampuses] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [recent, setRecent] = useState([]);
  const [saved, setSaved] = useState([]);

  const campus = campuses.find((c) => c.slug === campusSlug);

  // Apply per-campus theme via CSS variables
  const themeStyle = useMemo(() => {
    if (!campus?.theme) return {};
    return {
      "--theme-primary": campus.theme.primary,
      "--theme-accent": campus.theme.accent,
      "--theme-tint": campus.theme.tint,
      "--theme-ink": campus.theme.ink,
    };
  }, [campus]);

  useEffect(() => {
    fetchCampuses().then(setCampuses);
  }, []);

  useEffect(() => {
    if (!user) {
      setRecent([]);
      setSaved([]);
      return;
    }
    fetchHistory().then(setRecent).catch(() => {});
    fetchSaved().then(setSaved).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleAsk = async (queryText) => {
    const q = (queryText ?? input).trim();
    if (!q || loading) return;

    setChatStarted(true);
    setMessages((prev) => [...prev, { role: "user", text: q, id: `u-${Date.now()}` }]);
    setInput("");
    setLoading(true);

    try {
      const data = await askCompass({ message: q, campus: campusSlug });

      if (data.cross_campus_redirect && data.cross_campus_redirect !== campusSlug) {
        const target = campuses.find((c) => c.slug === data.cross_campus_redirect);
        toast.info(`Compass detected a question about ${target?.short || data.cross_campus_redirect}.`);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: data.answer,
          sources: data.sources || [],
          id: `b-${Date.now()}`,
          campus: data.campus,
          query: q,
        },
      ]);

      // Guest mode: keep an in-memory "recent" trail; signed-in users get the persisted one.
      if (isGuest) {
        setRecent((prev) => [
          { id: `g-${Date.now()}`, query: q, campus: data.campus, created_at: new Date().toISOString() },
          ...prev,
        ].slice(0, 25));
      } else {
        fetchHistory().then(setRecent).catch(() => {});
      }
    } catch (err) {
      console.error("Compass error", err);
      toast.error("Compass couldn't reach the AI. Try again in a moment.");
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "I had trouble reaching the source pages. Please try again.", sources: [], id: `e-${Date.now()}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (msg) => {
    if (isGuest) {
      toast.info("Sign up to save resources — they'll vanish when you leave as a guest.");
      navigate("/signup");
      return;
    }
    const title = (msg.query || msg.text.slice(0, 60)).slice(0, 100);
    try {
      const s = await saveResource({
        title,
        content: msg.text.slice(0, 600),
        campus: msg.campus || campusSlug,
        sources: msg.sources || [],
      });
      setSaved((prev) => [s, ...prev]);
      toast.success("Saved to your resources.");
    } catch {
      toast.error("Could not save resource.");
    }
  };

  const handleDeleteSaved = async (id) => {
    await deleteResource(id);
    setSaved((prev) => prev.filter((s) => s.id !== id));
    toast.success("Removed.");
  };

  const handleNewChat = () => {
    setMessages([]);
    setChatStarted(false);
    setInput("");
  };

  const sidebarToggle = (
    <button
      onClick={() => setSidebarOpen((v) => !v)}
      className="p-2 rounded-md text-cuny-navy hover:bg-cuny-navy/5 transition"
      data-testid="sidebar-toggle-btn"
      aria-label="Toggle sidebar"
    >
      <MenuIcon className="w-5 h-5" />
    </button>
  );

  return (
    <div className="h-screen flex flex-col campus-theme" style={themeStyle} data-testid="resource-center">
      <Header
        campuses={campuses}
        current={campusSlug}
        onSelectCampus={(slug) => {
          navigate(`/campus/${slug}`);
          setMessages([]);
          setChatStarted(false);
        }}
        sidebarToggle={chatStarted ? sidebarToggle : null}
      />

      {/* Guest disclaimer */}
      {isGuest && (
        <div
          className="bg-cuny-gold/15 border-b border-cuny-gold/40"
          data-testid="guest-disclaimer-banner"
        >
          <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-2 flex items-center justify-between gap-3 text-sm text-cuny-navy">
            <div className="flex items-center gap-2.5 min-w-0">
              <Info className="w-4 h-4 flex-none" />
              <span className="truncate">
                <strong>Guest mode</strong> — ask anything you want. Nothing is saved; your queries
                and bookmarks vanish when you close this tab.
              </span>
            </div>
            <Link
              to="/signup"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cuny-navy text-white text-xs font-semibold hover:bg-cuny-navyDeep transition flex-none"
              data-testid="guest-signup-cta"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Sign up to save
            </Link>
          </div>
        </div>
      )}

      {/* Campus banner strip */}
      {campus && (
        <div
          className="border-b"
          style={{ background: `linear-gradient(90deg, ${campus.theme.primary} 0%, ${campus.theme.ink} 100%)` }}
          data-testid="campus-banner"
        >
          <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-2 flex items-center justify-between text-white text-xs font-mono uppercase tracking-[0.22em]">
            <span className="opacity-80">{campus.tier} · {campus.domain}</span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: campus.theme.accent }} />
              <span className="font-serif normal-case tracking-normal text-base">{campus.short}</span>
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        {chatStarted && (
          <Sidebar
            open={sidebarOpen}
            onToggle={() => setSidebarOpen(false)}
            recent={recent}
            saved={saved}
            onPickRecent={(r) => handleAsk(r.query)}
            onDeleteSaved={handleDeleteSaved}
            onNewChat={handleNewChat}
          />
        )}

        <main className="flex-1 flex flex-col min-w-0 relative">
          <AnimatePresence mode="wait">
            {!chatStarted ? (
              <motion.div
                key="landing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 overflow-y-auto"
              >
                <div className="max-w-[920px] mx-auto px-6 md:px-10 pt-10 md:pt-16 pb-32">
                  <div className="text-center mb-10">
                    <div
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-white text-xs font-mono uppercase tracking-[0.18em] mb-6"
                      style={{ borderColor: `${campus?.theme.primary}30`, color: campus?.theme.primary }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: campus?.theme.accent }} />
                      {isGuest ? "Guest hub" : "Resource Hub"}
                    </div>
                    <h1
                      className="font-serif text-4xl md:text-5xl lg:text-6xl leading-tight tracking-tight"
                      style={{ color: campus?.theme.primary }}
                    >
                      <span className="italic">{campus?.short || "John Jay"}</span> Compass
                    </h1>
                    <p className="mt-3 text-ink-700 max-w-xl mx-auto">
                      Ask anything about {campus?.name || "John Jay College"}. Compass scrapes live campus pages and answers with sources.
                    </p>
                  </div>

                  <motion.form
                    layoutId="compass-search"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAsk();
                    }}
                    className="hero-glow rounded-2xl bg-white border p-2 flex items-center gap-2"
                    style={{ borderColor: `${campus?.theme.primary}30` }}
                    data-testid="hero-search-form"
                  >
                    <input
                      autoFocus
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={`Ask Compass AI about ${campus?.short || "John Jay"}...`}
                      className="flex-1 bg-transparent px-4 py-4 text-lg outline-none placeholder:text-ink-400"
                      data-testid="hero-search-input"
                    />
                    <button
                      type="submit"
                      disabled={!input.trim()}
                      className="w-12 h-12 rounded-xl text-white flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: campus?.theme.primary || "#003366" }}
                      data-testid="hero-search-submit"
                    >
                      <ArrowUp className="w-5 h-5" />
                    </button>
                  </motion.form>

                  <div className="mt-10">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] tracking-[0.22em] font-mono uppercase text-ink-500">Try asking</span>
                    </div>
                    <SuggestionTiles onPick={(q) => handleAsk(q)} />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col min-h-0"
              >
                <div ref={scrollRef} className="flex-1 overflow-y-auto" data-testid="chat-scroll">
                  <div className="max-w-[820px] mx-auto px-6 md:px-8 py-8 space-y-6">
                    {messages.map((m) => (
                      <ChatMessage key={m.id} message={m} onSave={handleSave} accent={campus?.theme} />
                    ))}
                    {loading && <ThinkingBubble accent={campus?.theme} />}
                  </div>
                </div>

                <div className="border-t border-ink-900/10 bg-gradient-to-b from-white/60 to-white/95 backdrop-blur-sm">
                  <motion.form
                    layoutId="compass-search"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAsk();
                    }}
                    className="max-w-[820px] mx-auto px-6 md:px-8 py-4"
                    data-testid="chat-input-form"
                  >
                    <div
                      className="hero-glow rounded-2xl bg-white border p-2 flex items-center gap-2"
                      style={{ borderColor: `${campus?.theme.primary}30` }}
                    >
                      <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={`Follow up about ${campus?.short || "John Jay"}...`}
                        className="flex-1 bg-transparent px-4 py-3 text-base outline-none placeholder:text-ink-400"
                        data-testid="chat-input"
                      />
                      <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className="w-10 h-10 rounded-xl text-white flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: campus?.theme.primary || "#003366" }}
                        data-testid="chat-submit"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-[10px] tracking-[0.22em] font-mono uppercase text-ink-400 mt-2 text-center">
                      Compass cites live sources · double-check critical info
                    </div>
                  </motion.form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default ResourceCenter;

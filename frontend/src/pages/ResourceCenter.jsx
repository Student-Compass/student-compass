import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, MenuIcon } from "lucide-react";
import { toast } from "sonner";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { SuggestionTiles } from "../components/SuggestionTiles";
import { ChatMessage, ThinkingBubble } from "../components/ChatMessage";
import {
  askCompass,
  fetchCampuses,
  fetchHistory,
  fetchSaved,
  saveResource,
  deleteResource,
  getSessionId,
} from "../lib/api";

export const ResourceCenter = () => {
  const { campusSlug = "john-jay" } = useParams();
  const navigate = useNavigate();
  const sessionId = useMemo(() => getSessionId(), []);
  const scrollRef = useRef(null);

  const [campuses, setCampuses] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [recent, setRecent] = useState([]);
  const [saved, setSaved] = useState([]);

  const campus = campuses.find((c) => c.slug === campusSlug);

  // Initial loads
  useEffect(() => {
    fetchCampuses().then(setCampuses);
  }, []);

  useEffect(() => {
    fetchHistory(sessionId).then(setRecent).catch(() => {});
    fetchSaved(sessionId).then(setSaved).catch(() => {});
  }, [sessionId]);

  // Scroll to bottom on new message
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
      const data = await askCompass({ message: q, campus: campusSlug, sessionId });

      if (data.cross_campus_redirect && data.cross_campus_redirect !== campusSlug) {
        toast.info(`Compass detected a question about ${data.cross_campus_redirect.replace(/-/g, " ")}.`);
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

      // Refresh recent
      fetchHistory(sessionId).then(setRecent).catch(() => {});
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
    const title = (msg.query || msg.text.slice(0, 60)).slice(0, 100);
    try {
      const saved = await saveResource({
        session_id: sessionId,
        title,
        content: msg.text.slice(0, 600),
        campus: msg.campus || campusSlug,
        sources: msg.sources || [],
      });
      setSaved((prev) => [saved, ...prev]);
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
    <div className="h-screen flex flex-col" data-testid="resource-center">
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
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cuny-navy/15 bg-white text-xs font-mono uppercase tracking-[0.18em] text-cuny-navy mb-6">
                      <span className="w-1.5 h-1.5 rounded-full bg-cuny-gold" />
                      Resource Hub
                    </div>
                    <h1 className="font-serif text-cuny-navy text-4xl md:text-5xl lg:text-6xl leading-tight tracking-tight">
                      <span className="italic">{campus?.short || "John Jay"}</span> Compass
                    </h1>
                    <p className="mt-3 text-ink-700 max-w-xl mx-auto">
                      Ask anything about {campus?.name || "John Jay College"}. Compass scrapes live campus pages and answers with sources.
                    </p>
                  </div>

                  {/* Hero search */}
                  <motion.form
                    layoutId="compass-search"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAsk();
                    }}
                    className="hero-glow rounded-2xl bg-white border border-cuny-navy/10 p-2 flex items-center gap-2"
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
                      className="w-12 h-12 rounded-xl bg-cuny-navy text-white flex items-center justify-center hover:bg-cuny-navyDeep transition disabled:opacity-40 disabled:cursor-not-allowed"
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
                      <ChatMessage key={m.id} message={m} onSave={handleSave} />
                    ))}
                    {loading && <ThinkingBubble />}
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
                    <div className="hero-glow rounded-2xl bg-white border border-cuny-navy/10 p-2 flex items-center gap-2">
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
                        className="w-10 h-10 rounded-xl bg-cuny-navy text-white flex items-center justify-center hover:bg-cuny-navyDeep transition disabled:opacity-40 disabled:cursor-not-allowed"
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

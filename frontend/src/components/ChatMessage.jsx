import React from "react";
import { Bookmark, ExternalLink, Sparkles, User2 } from "lucide-react";
import { motion } from "framer-motion";

/** Lightweight markdown → HTML for a constrained subset (bold, italic, lists, code, links). */
const renderMarkdown = (text = "") => {
  // Escape HTML
  let s = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code (inline)
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  // Bold
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // Italic
  s = s.replace(/(^|\W)\*([^*\n]+)\*(?=\W|$)/g, "$1<em>$2</em>");
  // Links
  s = s.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noreferrer">$1</a>'
  );

  // Lists
  const lines = s.split("\n");
  const out = [];
  let inUL = false;
  let inOL = false;
  for (const line of lines) {
    if (/^\s*[-•]\s+/.test(line)) {
      if (!inUL) { out.push("<ul>"); inUL = true; }
      if (inOL) { out.push("</ol>"); inOL = false; }
      out.push("<li>" + line.replace(/^\s*[-•]\s+/, "") + "</li>");
    } else if (/^\s*\d+\.\s+/.test(line)) {
      if (!inOL) { out.push("<ol>"); inOL = true; }
      if (inUL) { out.push("</ul>"); inUL = false; }
      out.push("<li>" + line.replace(/^\s*\d+\.\s+/, "") + "</li>");
    } else {
      if (inUL) { out.push("</ul>"); inUL = false; }
      if (inOL) { out.push("</ol>"); inOL = false; }
      if (line.trim() === "") out.push("<br/>");
      else out.push("<p>" + line + "</p>");
    }
  }
  if (inUL) out.push("</ul>");
  if (inOL) out.push("</ol>");
  return out.join("");
};

export const ChatMessage = ({ message, onSave }) => {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end"
        data-testid="chat-message-user"
      >
        <div className="max-w-[78%] flex items-start gap-3">
          <div className="bg-[#f1f5f9] text-cuny-navy rounded-2xl rounded-tr-sm px-4 py-3 text-[15px] leading-relaxed">
            {message.text}
          </div>
          <div className="w-8 h-8 rounded-full bg-cuny-navy text-white flex items-center justify-center flex-none">
            <User2 className="w-4 h-4" />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex justify-start"
      data-testid="chat-message-bot"
    >
      <div className="max-w-[88%] flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-cuny-gold/15 border border-cuny-gold/40 text-cuny-navy flex items-center justify-center flex-none">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="bg-white border border-ink-900/10 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
            <div
              className="md-content text-[15px] leading-relaxed text-ink-900"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(message.text) }}
            />
            {message.sources?.length > 0 && (
              <div className="mt-4 pt-3 border-t border-ink-900/5">
                <div className="text-[10px] tracking-[0.2em] font-mono text-ink-500 uppercase mb-2">Sources</div>
                <div className="flex flex-wrap gap-1.5">
                  {message.sources.slice(0, 4).map((s, i) => (
                    <a
                      key={i}
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-cuny-navy/5 hover:bg-cuny-navy/10 text-cuny-navy transition"
                      data-testid={`chat-source-${i}`}
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span className="truncate max-w-[200px]">{s.title || new URL(s.url).hostname}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="mt-2 ml-1 flex items-center gap-3">
            <button
              onClick={() => onSave?.(message)}
              className="inline-flex items-center gap-1.5 text-xs text-cuny-navy/70 hover:text-cuny-navy transition"
              data-testid="save-resource-btn"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Save resource</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const ThinkingBubble = () => (
  <div className="flex justify-start" data-testid="chat-thinking">
    <div className="max-w-[88%] flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-cuny-gold/15 border border-cuny-gold/40 text-cuny-navy flex items-center justify-center flex-none">
        <Sparkles className="w-4 h-4" />
      </div>
      <div className="bg-white border border-ink-900/10 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="thinking-dot" />
          <span className="thinking-dot" />
          <span className="thinking-dot" />
          <span className="ml-2 text-xs text-ink-500 font-mono uppercase tracking-widest">Compass calibrating</span>
        </div>
      </div>
    </div>
  </div>
);

export default ChatMessage;

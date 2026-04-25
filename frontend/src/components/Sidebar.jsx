import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, History, Trash2, X, ChevronLeft, Plus } from "lucide-react";

export const Sidebar = ({
  open,
  onToggle,
  recent = [],
  saved = [],
  onPickRecent,
  onDeleteSaved,
  onNewChat,
}) => {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 280, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          className="border-r border-ink-900/10 bg-white/70 backdrop-blur-sm overflow-hidden flex-none"
          data-testid="sidebar"
        >
          <div className="w-[280px] h-full flex flex-col">
            <div className="px-4 pt-4 pb-3 flex items-center justify-between">
              <span className="text-[10px] tracking-[0.2em] font-mono uppercase text-ink-500">Compass Log</span>
              <button
                onClick={onToggle}
                className="text-ink-500 hover:text-cuny-navy"
                data-testid="sidebar-close-btn"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onNewChat}
              className="mx-4 mb-4 inline-flex items-center justify-center gap-2 rounded-full bg-cuny-navy text-white text-sm font-semibold px-3.5 py-2 hover:bg-cuny-navyDeep transition"
              data-testid="new-chat-btn"
            >
              <Plus className="w-4 h-4" />
              New conversation
            </button>

            {/* Recent */}
            <div className="px-4 pb-2 flex items-center gap-2 text-cuny-navy">
              <History className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Recent Queries</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="px-2 pb-3 space-y-0.5">
                {recent.length === 0 && (
                  <div className="px-3 py-2 text-xs text-ink-500">Nothing yet — ask Compass anything.</div>
                )}
                {recent.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => onPickRecent?.(r)}
                    className="block w-full text-left px-3 py-2 rounded-lg text-sm text-ink-700 hover:bg-cuny-navy/5 hover:text-cuny-navy transition truncate"
                    title={r.query}
                    data-testid={`recent-item-${r.id}`}
                  >
                    {r.query}
                  </button>
                ))}
              </div>

              {/* Saved */}
              <div className="px-4 pt-3 pb-2 flex items-center gap-2 text-cuny-navy border-t border-ink-900/5">
                <Bookmark className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Saved Resources</span>
              </div>
              <div className="px-2 pb-6 space-y-1">
                {saved.length === 0 && (
                  <div className="px-3 py-2 text-xs text-ink-500">Bookmark Compass replies to keep them here.</div>
                )}
                {saved.map((s) => (
                  <div
                    key={s.id}
                    className="group px-3 py-2 rounded-lg hover:bg-cuny-navy/5 transition"
                    data-testid={`saved-item-${s.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-cuny-navy font-medium truncate" title={s.title}>{s.title}</div>
                        <div className="text-xs text-ink-500 truncate">{s.content}</div>
                      </div>
                      <button
                        onClick={() => onDeleteSaved?.(s.id)}
                        className="opacity-0 group-hover:opacity-100 text-ink-400 hover:text-red-500 transition"
                        data-testid={`delete-saved-${s.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;

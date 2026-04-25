import React from "react";
import { Calendar, Shield } from "lucide-react";

const FINANCE_IMG = "https://static.prod-images.emergentagent.com/jobs/e7b52324-aaeb-4417-9e67-9a2c5708afcb/images/a2be6d64f0b9e0abc4e5a05c0725ca048763702af7ba08ecf192858963cce21f.png";
const ACADEMIC_IMG = "https://static.prod-images.emergentagent.com/jobs/e7b52324-aaeb-4417-9e67-9a2c5708afcb/images/a221579ccb6305f4b9ccb7fd523f29538f1530d7d1c078a06a50b3266601313f.png";

const TILES = [
  {
    id: "cross-campus",
    title: "Cross-Campus Events",
    blurb: "Find events open to all CUNY students.",
    prompt: "What events are happening this week that are open to all CUNY students?",
    icon: <Calendar className="w-6 h-6 text-cuny-navy" />,
    accent: "bg-[#EAF1F8]",
  },
  {
    id: "id-safety",
    title: "ID Replacement & Safety",
    blurb: "Lost your ID? Need Public Safety hours?",
    prompt: "How do I replace a lost CUNY ID and what are Public Safety's hours?",
    icon: <Shield className="w-6 h-6 text-cuny-navy" />,
    accent: "bg-[#FBF1D8]",
  },
  {
    id: "financial-aid",
    title: "Financial Aid Deadlines",
    blurb: "FAFSA, scholarships, and key dates.",
    prompt: "What financial aid deadlines do I need to know this semester?",
    image: FINANCE_IMG,
    accent: "bg-white",
  },
  {
    id: "academic-advising",
    title: "Academic Advising",
    blurb: "Book a session with an advisor.",
    prompt: "How do I make an appointment with an academic advisor?",
    image: ACADEMIC_IMG,
    accent: "bg-white",
  },
];

export const SuggestionTiles = ({ onPick }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="suggestion-tiles">
      {TILES.map((t) => (
        <button
          key={t.id}
          onClick={() => onPick(t.prompt)}
          data-testid={`suggestion-tile-${t.id}`}
          className={`tile group text-left rounded-2xl border border-cuny-navy/10 p-5 ${t.accent}`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-11 h-11 rounded-xl bg-white border border-cuny-navy/10 flex items-center justify-center shrink-0">
              {t.icon ? (
                t.icon
              ) : (
                <img src={t.image} alt="" className="w-9 h-9 object-contain" />
              )}
            </div>
            <span className="text-[10px] tracking-[0.18em] font-mono text-cuny-navy/50 uppercase">Ask</span>
          </div>
          <h3 className="font-serif text-lg text-cuny-navy mb-1 leading-tight">{t.title}</h3>
          <p className="text-sm text-ink-500 leading-snug">{t.blurb}</p>
          <div className="mt-4 flex items-center gap-1.5 text-cuny-navy text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
            <span>Compass me →</span>
          </div>
        </button>
      ))}
    </div>
  );
};

export default SuggestionTiles;

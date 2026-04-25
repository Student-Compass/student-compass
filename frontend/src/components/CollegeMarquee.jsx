import React from "react";
import Marquee from "react-fast-marquee";
import { Landmark, Building2, BookMarked, GraduationCap, School, Library, University } from "lucide-react";

const ICONS = [Landmark, Building2, BookMarked, GraduationCap, School, Library, University];

export const CollegeMarquee = ({ campuses }) => {
  return (
    <div className="relative py-6 border-y border-cuny-navy/10 bg-white/60 backdrop-blur-sm overflow-hidden" data-testid="college-marquee">
      <Marquee gradient gradientColor="#F9FAFB" gradientWidth={120} speed={36} pauseOnHover>
        {campuses.map((c, i) => {
          const Icon = ICONS[i % ICONS.length];
          return (
            <div
              key={c.slug}
              className="marquee-item mx-8 flex items-center gap-3 select-none"
              data-testid={`marquee-${c.slug}`}
            >
              <div
                className="w-9 h-9 rounded-md flex items-center justify-center"
                style={{ background: c.color, color: "white" }}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="font-serif text-lg tracking-wide text-cuny-navy whitespace-nowrap">
                {c.short}
              </span>
            </div>
          );
        })}
      </Marquee>
    </div>
  );
};

export default CollegeMarquee;

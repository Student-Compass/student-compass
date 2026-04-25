import React from "react";
import { Link } from "react-router-dom";
import { SpinningCompass } from "./SpinningCompass";
import { CampusSwitcher } from "./CampusSwitcher";

export const Header = ({ campuses, current, onSelectCampus, sidebarToggle }) => {
  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-xl bg-white/75 border-b border-cuny-navy/10"
      data-testid="header"
    >
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {sidebarToggle}
          <Link to="/" className="flex items-center gap-3 group" data-testid="logo-link">
            <SpinningCompass size={36} />
            <div className="leading-tight">
              <div className="font-serif text-cuny-navy text-[18px] font-semibold tracking-wide">
                Student <span className="text-cuny-gold">Compass</span>
              </div>
              <div className="text-[10px] uppercase tracking-[0.22em] font-mono text-ink-500">CUNY · AI Guide</div>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {campuses?.length > 0 && (
            <CampusSwitcher campuses={campuses} current={current} onSelect={onSelectCampus} />
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

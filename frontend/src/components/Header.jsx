import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, LogOut, Menu, UserCircle2 } from "lucide-react";
import { useAuth } from "../lib/auth";
import { SpinningCompass } from "./SpinningCompass";
import { CampusSwitcher } from "./CampusSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export const Header = ({ campuses = [], current, onSelectCampus, sidebarToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/75 border-b border-cuny-navy/10" data-testid="header">
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
          {campuses.length > 0 && (
            <CampusSwitcher campuses={campuses} current={current} onSelect={onSelectCampus} />
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 px-3 py-2 rounded-full border border-cuny-navy/15 bg-white hover:border-cuny-navy text-cuny-navy text-sm transition"
                  data-testid="user-menu-trigger"
                >
                  <div className="w-6 h-6 rounded-full bg-cuny-navy text-white flex items-center justify-center text-[11px] font-bold uppercase">
                    {user.username?.charAt(0) || "U"}
                  </div>
                  <span className="font-medium">{user.username}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56" data-testid="user-menu">
                <DropdownMenuLabel className="text-xs text-ink-500 font-mono uppercase tracking-widest">
                  Signed in
                </DropdownMenuLabel>
                <DropdownMenuItem className="flex flex-col items-start gap-0.5">
                  <span className="font-serif text-cuny-navy">{user.username}</span>
                  <span className="text-xs text-ink-500 truncate w-full">{user.email}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigate(`/campus/${user.home_campus || "john-jay"}`)}
                  data-testid="user-menu-hub"
                >
                  <UserCircle2 className="w-4 h-4 mr-2" />
                  My Resource Hub
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                  className="text-red-600 focus:text-red-600"
                  data-testid="user-menu-logout"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-cuny-navy/20 bg-white hover:border-cuny-navy text-cuny-navy text-sm font-medium transition"
              data-testid="header-login-btn"
            >
              <LogIn className="w-4 h-4" />
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

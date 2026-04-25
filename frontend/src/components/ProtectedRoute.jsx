import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { SpinningCompass } from "./SpinningCompass";

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-bg" data-testid="protected-loading">
        <div className="flex flex-col items-center gap-3">
          <SpinningCompass size={48} />
          <span className="font-mono text-xs uppercase tracking-[0.22em] text-ink-500">Calibrating…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
};

export default ProtectedRoute;

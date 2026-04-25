import React, { createContext, useContext, useEffect, useState } from "react";
import { apiLogin, apiMe, apiRegister, getToken, setToken } from "./api";

const AuthCtx = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const me = await apiMe();
        setUser(me);
      } catch {
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const login = async (creds) => {
    const data = await apiLogin(creds);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const data = await apiRegister(payload);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  );
};

export const useAuth = () => {
  const v = useContext(AuthCtx);
  if (!v) throw new Error("useAuth must be inside AuthProvider");
  return v;
};

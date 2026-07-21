"use client";

import { useCallback, useEffect, useState } from "react";
import { clearAuthSession, hasValidToken } from "../lib/api/client";

const AUTH_UPDATED_EVENT = "gaga-auth-updated";
const AUTH_EXPIRED_EVENT = "gaga-auth-expired";

export type UseAuth = {
  isLoggedIn: boolean;
  user: string | null;
  showLogin: boolean;
  openLogin: () => void;
  closeLogin: () => void;
  handleLoginSuccess: (account: string) => void;
  handleLogout: () => void;
  requireLogin: () => boolean;
};

export default function useAuth(): UseAuth {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return hasValidToken();
  });
  const [user, setUser] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return localStorage.getItem("gaga_user");
  });
  const [showLogin, setShowLogin] = useState(false);

  const syncAuthFromStorage = useCallback(() => {
    if (typeof window === "undefined") return;
    const tokenValid = hasValidToken();
    const account = localStorage.getItem("gaga_user");
    setIsLoggedIn(tokenValid);
    setUser(tokenValid ? account : null);
  }, []);

  const openLogin = useCallback(() => {
    setShowLogin(true);
  }, []);

  const closeLogin = useCallback(() => {
    setShowLogin(false);
  }, []);

  const handleLoginSuccess = useCallback((account: string) => {
    setIsLoggedIn(true);
    setUser(account);
    setShowLogin(false);
  }, []);

  const handleLogout = useCallback(() => {
    clearAuthSession();
    setIsLoggedIn(false);
    setUser(null);
  }, []);

  const requireLogin = useCallback(() => {
    if (!isLoggedIn) {
      setShowLogin(true);
      return false;
    }
    return true;
  }, [isLoggedIn]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const rawToken = localStorage.getItem("token");
    if (rawToken && !hasValidToken()) {
      setShowLogin(true);
    }

    const handleAuthUpdated = () => {
      syncAuthFromStorage();
    };

    const handleAuthExpired = () => {
      syncAuthFromStorage();
      setShowLogin(true);
    };

    window.addEventListener("storage", handleAuthUpdated);
    window.addEventListener(AUTH_UPDATED_EVENT, handleAuthUpdated as EventListener);
    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired as EventListener);

    return () => {
      window.removeEventListener("storage", handleAuthUpdated);
      window.removeEventListener(AUTH_UPDATED_EVENT, handleAuthUpdated as EventListener);
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired as EventListener);
    };
  }, [syncAuthFromStorage]);

  return {
    isLoggedIn,
    user,
    showLogin,
    openLogin,
    closeLogin,
    handleLoginSuccess,
    handleLogout,
    requireLogin,
  };
}

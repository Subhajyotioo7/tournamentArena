




















/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getProfile } from "../services/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh");
    setIsLoggedIn(false);
    setUser(null);
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const profile = await getProfile();

      setUser({
        id: profile.id,
        username: profile.username,
        email: profile.email,
        is_staff: profile.is_staff,
        is_superuser: profile.is_superuser,
      });
    } catch (error) {
      console.error("Profile load failed:", error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      loadProfile();
    } else {
      setLoading(false);
    }
  }, [loadProfile]);

  const login = useCallback(() => {
    setIsLoggedIn(true);
    loadProfile();
  }, [loadProfile]);

  const contextValue = useMemo(() => ({
    isLoggedIn,
    user,
    login,
    logout,
    loading,
  }), [isLoggedIn, user, login, logout, loading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AuthContextType {
  user: { email: string; roles: string[]; role?: string; _id?: string } | null;
  login: (email: string, roles: string[], role?: string, _id?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ email: string; roles: string[]; role?: string; _id?: string } | null>(null);

  useEffect(() => {
    // Only run on client side after mount to avoid hydration issues
    if (typeof window === "undefined") return;

    const saved = localStorage.getItem("shareoverflow/user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.loggedIn && parsed._id) {
          // Only set user if we have a valid _id
          setUser({ 
            email: parsed.email, 
            roles: parsed.roles ?? ["user"],
            role: parsed.role,
            _id: parsed._id
          });
        } else {
          // Clear invalid data
          localStorage.removeItem("shareoverflow/user");
          localStorage.removeItem("viewerId");
        }
      } catch (e) {
        // Clear corrupted data
        localStorage.removeItem("shareoverflow/user");
        localStorage.removeItem("viewerId");
      }
    }
  }, []);

  const login = (email: string, roles: string[], role?: string, _id?: string) => {
    setUser({ email, roles, role, _id });
    localStorage.setItem(
      "shareoverflow/user",
      JSON.stringify({ email, loggedIn: true, roles, role, _id })
    );
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("shareoverflow/user");
    localStorage.removeItem("viewerId");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

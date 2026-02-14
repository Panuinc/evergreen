"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      if (args[0]?.name === 'AuthApiError' || 
          args[0]?.message?.includes('Invalid login credentials') ||
          args[0]?.toString?.()?.includes('AuthApiError')) {
        return;
      }
      originalConsoleError.apply(console, args);
    };
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      window.location.href = "/overview/dashboard";
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      console.error = originalConsoleError;
    }
  };

  const signUp = async (email, password) => {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      if (args[0]?.name === 'AuthApiError' || 
          args[0]?.toString?.()?.includes('AuthApiError')) {
        return;
      }
      originalConsoleError.apply(console, args);
    };
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      
      return { success: true, message: "Please check your email to verify your account" };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      console.error = originalConsoleError;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = "/auth/signin";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

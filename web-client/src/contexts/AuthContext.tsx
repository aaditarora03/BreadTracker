import { createContext, useState, type ReactNode } from "react";
import { login, logout, signup, forgotPassword } from "../api/client";

interface AuthState {
  token: string;
  email: string;
}

export interface AuthContextType {
  auth: AuthState | null;
  loading: boolean;
  error: string | null;
  signIn: (data: { email: string; password: string }) => Promise<void>;
  signUp: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<string>;
  clearError: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(() => {
    const savedToken = localStorage.getItem("authToken");
    const savedEmail = localStorage.getItem("authEmail");
    if (savedToken && savedEmail) {
      return { token: savedToken, email: savedEmail };
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const signIn = async (formData: { email: string; password: string }) => {
    try {
      setLoading(true);
      setError(null);
      const session = await login(formData);

      if (!session.access_token) {
        throw new Error("Login did not return an access token");
      }

      const nextAuth = { token: session.access_token, email: formData.email };
      localStorage.setItem("authToken", nextAuth.token);
      localStorage.setItem("authEmail", nextAuth.email);
      setAuth(nextAuth);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Login failed",
      );
      throw requestError;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (formData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      await signup(formData);

      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const session = await login({
            email: formData.email,
            password: formData.password,
          });

          if (!session.access_token) {
            throw new Error("Login did not return an access token");
          }

          const nextAuth = {
            token: session.access_token,
            email: formData.email,
          };
          localStorage.setItem("authToken", nextAuth.token);
          localStorage.setItem("authEmail", nextAuth.email);
          setAuth(nextAuth);
          return;
        } catch (requestError) {
          const isNetworkIssue =
            requestError instanceof Error &&
            requestError.message.startsWith("Network error:");
          if (isNetworkIssue && attempt === 0) {
            await new Promise((resolve) => setTimeout(resolve, 700));
            continue;
          }

          setError(
            "Account created successfully. Please log in with your new account.",
          );
          throw requestError;
        }
      }
    } catch (requestError) {
      if (!error) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Signup failed",
        );
      }
      throw requestError;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      return await forgotPassword({ email });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (!auth) return;

    try {
      await logout(auth.token);
    } catch {
      // Clear local session even if server-side logout fails.
    }

    localStorage.removeItem("authToken");
    localStorage.removeItem("authEmail");
    setAuth(null);
  };

  return (
    <AuthContext.Provider
      value={{
        auth,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        resetPassword,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

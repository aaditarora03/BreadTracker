import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const { signIn, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearError();
    setValidationErrors({});

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      const formattedErrors: Record<string, string> = {};
      for (const [key, messages] of Object.entries(fieldErrors)) {
        if (messages && messages.length > 0) {
          formattedErrors[key] = messages[0];
        }
      }
      setValidationErrors(formattedErrors);
      return;
    }
    try {
      await signIn({ email, password });
      navigate("/");
    } catch {
      // error is handled by context
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-violet-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-violet-300/25 bg-[rgba(24,10,40,0.82)] backdrop-blur-md shadow-[0_16px_45px_rgba(7,0,18,0.62)] p-6">
        <h2 className="text-2xl font-semibold text-violet-50 mb-1">
          BreadTracker
        </h2>
        <p className="text-sm text-violet-200/80 mb-6">
          Sign in to manage your subscriptions.
        </p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                clearError();
                setValidationErrors((prev) => ({ ...prev, email: "" }));
              }}
              className={`w-full border ${validationErrors.email ? "border-red-500" : "border-violet-300/35"} rounded-lg bg-white/10 text-violet-50 placeholder:text-violet-200/60 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary`}
            />
            {validationErrors.email && (
              <p className="text-xs text-red-500 mt-1">
                {validationErrors.email}
              </p>
            )}
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setValidationErrors((prev) => ({ ...prev, password: "" }));
              }}
              className={`w-full border ${validationErrors.password ? "border-red-500" : "border-violet-300/35"} rounded-lg bg-white/10 text-violet-50 placeholder:text-violet-200/60 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary`}
            />
            {validationErrors.password && (
              <p className="text-xs text-red-500 mt-1">
                {validationErrors.password}
              </p>
            )}
          </div>

          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition disabled:opacity-70"
          >
            {loading ? "Please wait..." : "Log In"}
          </button>
        </form>

        <div className="mt-4 text-sm">
          <Link to="/signup" className="text-primary hover:underline">
            Need an account? Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}

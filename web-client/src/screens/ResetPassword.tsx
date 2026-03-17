import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { resetPassword } from "../api/client";

const resetSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirm: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

/** Parse key=value pairs from a URL hash string (strips leading #).
 *  Splits only on the FIRST '=' so base64-encoded values are preserved. */
function parseHash(hash: string): Record<string, string> {
  const result: Record<string, string> = {};
  hash
    .replace(/^#/, "")
    .split("&")
    .forEach((pair) => {
      const idx = pair.indexOf("=");
      if (idx === -1) return;
      const key = decodeURIComponent(pair.slice(0, idx));
      const val = decodeURIComponent(pair.slice(idx + 1));
      result[key] = val;
    });
  return result;
}

/** Read the Supabase recovery token from the URL hash exactly once,
 *  synchronously, before any render — avoids React 18 StrictMode double-effect bug. */
function readRecoveryToken(): string | null {
  const params = parseHash(window.location.hash);
  if (params.type === "recovery" && params.access_token) {
    // Remove the tokens from the address bar so they can't be reused on refresh.
    window.history.replaceState(null, "", window.location.pathname);
    return params.access_token;
  }
  return null;
}

export default function ResetPassword() {
  const navigate = useNavigate();

  // Lazy initializer runs once synchronously — no useEffect needed.
  const [token] = useState<string | null>(readRecoveryToken);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setValidationErrors({});
    setSubmitError(null);

    const result = resetSchema.safeParse({ password, confirm });
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      const formatted: Record<string, string> = {};
      for (const [key, messages] of Object.entries(fieldErrors)) {
        if (messages && messages.length > 0) formatted[key] = messages[0];
      }
      setValidationErrors(formatted);
      return;
    }

    if (!token) return;

    try {
      setLoading(true);
      await resetPassword(password, token);
      navigate("/login");
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to update password",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-gray-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl p-6">
        <h2 className="text-2xl font-semibold text-primary mb-1">
          BreadTracker
        </h2>
        <p className="text-sm text-gray-500 mb-6">Set a new password.</p>

        {!token && (
          <div className="space-y-4">
            <p className="text-sm text-red-600">
              This link is invalid or has already been used. Please request a
              new password reset.
            </p>
            <Link
              to="/forgot-password"
              className="block w-full text-center bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition"
            >
              Request a new reset link
            </Link>
          </div>
        )}

        {token && (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setValidationErrors((prev) => ({ ...prev, password: "" }));
                }}
                className={`w-full border ${
                  validationErrors.password
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-lg bg-gray-50 text-gray-900 placeholder:text-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
              />
              {validationErrors.password && (
                <p className="text-xs text-red-500 mt-1">
                  {validationErrors.password}
                </p>
              )}
            </div>

            <div>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  setValidationErrors((prev) => ({ ...prev, confirm: "" }));
                }}
                className={`w-full border ${
                  validationErrors.confirm
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-lg bg-gray-50 text-gray-900 placeholder:text-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
              />
              {validationErrors.confirm && (
                <p className="text-xs text-red-500 mt-1">
                  {validationErrors.confirm}
                </p>
              )}
            </div>

            {submitError && (
              <p className="text-sm text-red-600">{submitError}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition disabled:opacity-70"
            >
              {loading ? "Please wait…" : "Set New Password"}
            </button>
          </form>
        )}

        <div className="mt-4 text-sm">
          <Link to="/login" className="text-primary hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}

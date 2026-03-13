import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
});

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<"success" | "error" | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const { resetPassword, loading } = useAuth();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setValidationErrors({});
    if (message) {
      setMessage(null);
      setStatus(null);
    }

    const result = forgotPasswordSchema.safeParse({ email });
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
      const respMessage = await resetPassword(email);
      setStatus("success");
      setMessage(respMessage);
    } catch (requestError) {
      setStatus("error");
      setMessage(
        requestError instanceof Error
          ? requestError.message
          : "Failed to send reset email",
      );
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-violet-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-violet-300/25 bg-[rgba(24,10,40,0.82)] backdrop-blur-md shadow-[0_16px_45px_rgba(7,0,18,0.62)] p-6">
        <h2 className="text-2xl font-semibold text-violet-50 mb-1">
          BreadTracker
        </h2>
        <p className="text-sm text-violet-200/80 mb-6">Reset your password.</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setValidationErrors((prev) => ({ ...prev, email: "" }));
                if (message) {
                  setMessage(null);
                  setStatus(null);
                }
              }}
              className={`w-full border ${validationErrors.email ? "border-red-500" : "border-violet-300/35"} rounded-lg bg-white/10 text-violet-50 placeholder:text-violet-200/60 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary`}
            />
            {validationErrors.email && (
              <p className="text-xs text-red-500 mt-1">
                {validationErrors.email}
              </p>
            )}
          </div>

          {message && (
            <p
              className={`text-sm ${status === "error" ? "text-red-600" : "text-emerald-600"}`}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition disabled:opacity-70"
          >
            {loading ? "Please wait..." : "Reset Password"}
          </button>
        </form>

        <div className="mt-4 text-sm flex justify-between">
          <Link to="/login" className="text-primary hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}

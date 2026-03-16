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
    <div className="min-h-screen bg-transparent text-gray-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl p-6">
        <h2 className="text-2xl font-semibold text-primary mb-1">
          BreadTracker
        </h2>
        <p className="text-sm text-gray-500 mb-6">Reset your password.</p>

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
              className={`w-full border ${validationErrors.email ? "border-red-500" : "border-gray-300"} rounded-lg bg-gray-50 text-gray-900 placeholder:text-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
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

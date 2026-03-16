import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { z } from "zod";

const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const { signUp, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearError();
    setValidationErrors({});

    const result = signupSchema.safeParse({
      firstName,
      lastName,
      email,
      password,
    });
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
      await signUp({ email, password, firstName, lastName });
      navigate("/");
    } catch {
      // error is handled by context
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-gray-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl p-6">
        <h2 className="text-2xl font-semibold text-primary mb-1">
          BreadTracker
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Create your account to get started.
        </p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(event) => {
                setFirstName(event.target.value);
                setValidationErrors((prev) => ({ ...prev, firstName: "" }));
              }}
              className={`w-full border ${validationErrors.firstName ? "border-red-500" : "border-gray-300"} rounded-lg bg-gray-50 text-gray-900 placeholder:text-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
            />
            {validationErrors.firstName && (
              <p className="text-xs text-red-500 mt-1">
                {validationErrors.firstName}
              </p>
            )}
          </div>

          <div>
            <input
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(event) => {
                setLastName(event.target.value);
                setValidationErrors((prev) => ({ ...prev, lastName: "" }));
              }}
              className={`w-full border ${validationErrors.lastName ? "border-red-500" : "border-gray-300"} rounded-lg bg-gray-50 text-gray-900 placeholder:text-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
            />
            {validationErrors.lastName && (
              <p className="text-xs text-red-500 mt-1">
                {validationErrors.lastName}
              </p>
            )}
          </div>

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
              className={`w-full border ${validationErrors.email ? "border-red-500" : "border-gray-300"} rounded-lg bg-gray-50 text-gray-900 placeholder:text-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
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
              className={`w-full border ${validationErrors.password ? "border-red-500" : "border-gray-300"} rounded-lg bg-gray-50 text-gray-900 placeholder:text-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
            />
            {validationErrors.password && (
              <p className="text-xs text-red-500 mt-1">
                {validationErrors.password}
              </p>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition disabled:opacity-70"
          >
            {loading ? "Please wait..." : "Create Account"}
          </button>
        </form>

        <div className="mt-4 text-sm">
          <Link to="/login" className="text-primary hover:underline">
            Already have an account? Log in
          </Link>
        </div>
      </div>
    </div>
  );
}

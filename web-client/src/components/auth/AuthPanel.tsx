import { useState } from "react";

interface LoginFormData {
  email: string;
  password: string;
}

interface SignupFormData extends LoginFormData {
  firstName: string;
  lastName: string;
}

interface Props {
  onLogin: (data: LoginFormData) => Promise<void>;
  onSignup: (data: SignupFormData) => Promise<void>;
  onForgotPassword: (email: string) => Promise<string>;
  loading: boolean;
  error: string | null;
}

export default function AuthPanel({
  onLogin,
  onSignup,
  onForgotPassword,
  loading,
  error,
}: Props) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState<
    string | null
  >(null);
  const [forgotPasswordStatus, setForgotPasswordStatus] = useState<
    "success" | "error" | null
  >(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || !password) {
      return;
    }

    if (mode === "signup") {
      if (!firstName || !lastName) {
        return;
      }
      await onSignup({ email, password, firstName, lastName });
      return;
    }

    await onLogin({ email, password });
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setForgotPasswordStatus("error");
      setForgotPasswordMessage("Enter your email address first.");
      return;
    }

    try {
      const message = await onForgotPassword(email);
      setForgotPasswordStatus("success");
      setForgotPasswordMessage(message);
    } catch (requestError) {
      setForgotPasswordStatus("error");
      setForgotPasswordMessage(
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
        <p className="text-sm text-gray-500 mb-6">
          {mode === "login"
            ? "Sign in to manage your subscriptions."
            : "Create your account to get started."}
        </p>

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <>
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className="w-full border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder:text-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                className="w-full border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder:text-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </>
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (forgotPasswordMessage) {
                setForgotPasswordMessage(null);
                setForgotPasswordStatus(null);
              }
            }}
            className="w-full border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder:text-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder:text-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />

          {mode === "login" && (
            <div className="text-right">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                className="text-sm text-primary hover:underline disabled:opacity-60"
              >
                Forgot password?
              </button>
            </div>
          )}

          {forgotPasswordMessage && (
            <p
              className={`text-sm ${forgotPasswordStatus === "error" ? "text-red-600" : "text-emerald-600"}`}
            >
              {forgotPasswordMessage}
            </p>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition disabled:opacity-70"
          >
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Log In"
                : "Create Account"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode((current) => (current === "login" ? "signup" : "login"));
            setForgotPasswordMessage(null);
            setForgotPasswordStatus(null);
          }}
          className="mt-4 text-sm text-primary hover:underline"
        >
          {mode === "login"
            ? "Need an account? Sign up"
            : "Already have an account? Log in"}
        </button>
      </div>
    </div>
  );
}

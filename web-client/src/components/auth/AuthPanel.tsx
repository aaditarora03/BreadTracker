import { useState } from "react"

interface LoginFormData {
  email: string
  password: string
}

interface SignupFormData extends LoginFormData {
  firstName: string
  lastName: string
}

interface Props {
  onLogin: (data: LoginFormData) => Promise<void>
  onSignup: (data: SignupFormData) => Promise<void>
  loading: boolean
  error: string | null
}

export default function AuthPanel({ onLogin, onSignup, loading, error }: Props) {
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!email || !password) {
      return
    }

    if (mode === "signup") {
      if (!firstName || !lastName) {
        return
      }
      await onSignup({ email, password, firstName, lastName })
      return
    }

    await onLogin({ email, password })
  }

  return (
    <div className="min-h-screen bg-background text-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-1">BreadTracker</h2>
        <p className="text-sm text-gray-500 mb-6">
          {mode === "login" ? "Sign in to manage your subscriptions." : "Create your account to get started."}
        </p>

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <>
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </>
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition disabled:opacity-70"
          >
            {loading ? "Please wait..." : mode === "login" ? "Log In" : "Create Account"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode((current) => (current === "login" ? "signup" : "login"))}
          className="mt-4 text-sm text-primary hover:underline"
        >
          {mode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
        </button>
      </div>
    </div>
  )
}

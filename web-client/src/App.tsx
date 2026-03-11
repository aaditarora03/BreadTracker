/*
Main App component 

Resposnible for:
- Managing the state of subscriptions
- Handling tab switching (Dashboard / Subscriptions)
- Managing auth state and backend API integration

Notes:
- Subscription data is loaded from the FastAPI backend after user login

~ Osbaldo Mota
*/

import { useState, useEffect } from "react"
import Layout from "./components/layout/Layout"
import Navbar from "./components/layout/Navbar"
import Card from "./components/ui/Card"
import SubscriptionList from "./components/subscriptions/SubscriptionList"
import type { Subscription } from "./types/Subscription"
import WeeklySpendingChart from "./components/dashboard/WeeklySpendingChart"
import UpcomingCharges from "./components/dashboard/UpcomingCharges"
import AuthPanel from "./components/auth/AuthPanel"
import {
  calculateMonthlyExpenses,
  calculateActiveSubscriptions,
  calculateUpcomingChargesTotal,
} from "./types/utils/financialUtils"
import {
  createSubscription,
  deleteSubscription,
  forgotPassword,
  getSubscriptions,
  login,
  logout,
  signup,
  updateSubscription,
} from "./api/client"

interface AuthState {
  token: string
  email: string
}


export default function App() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [auth, setAuth] = useState<AuthState | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [budget, setBudget] = useState<number | null>(null)

  // The actuive tab states which controls Dashboard vs Subscriptions view
  const [activeTab, setActiveTab] = useState<"dashboard" | "subscriptions">("dashboard")

  useEffect(() => {
    const savedToken = localStorage.getItem("authToken")
    const savedEmail = localStorage.getItem("authEmail")
    if (savedToken && savedEmail) {
      setAuth({ token: savedToken, email: savedEmail })
    }

    const savedBudget = localStorage.getItem("monthlyBudget")
    if (savedBudget) {
      const parsedBudget = Number(savedBudget)
      if (!Number.isNaN(parsedBudget)) {
        setBudget(parsedBudget)
      }
    }
  }, [])

  const handleBudgetSave = (nextBudget: number) => {
    setBudget(nextBudget)
    localStorage.setItem("monthlyBudget", String(nextBudget))
  }

  useEffect(() => {
    if (!auth) {
      setSubscriptions([])
      return
    }

    const loadSubscriptions = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getSubscriptions(auth.token)
        setSubscriptions(data)
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Failed to load subscriptions")
      } finally {
        setLoading(false)
      }
    }

    void loadSubscriptions()
  }, [auth])

  const handleLogin = async (formData: { email: string; password: string }) => {
    try {
      setLoading(true)
      setError(null)
      const session = await login(formData)

      if (!session.access_token) {
        throw new Error("Login did not return an access token")
      }

      const nextAuth = { token: session.access_token, email: formData.email }
      localStorage.setItem("authToken", nextAuth.token)
      localStorage.setItem("authEmail", nextAuth.email)
      setAuth(nextAuth)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Login failed")
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (formData: {
    email: string
    password: string
    firstName: string
    lastName: string
  }) => {
    try {
      setLoading(true)
      setError(null)
      await signup(formData)

      // Signup can succeed while immediate follow-up login briefly fails (for example due
      // to a transient local network/CORS hiccup). Retry once, then surface a clear message.
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const session = await login({ email: formData.email, password: formData.password })

          if (!session.access_token) {
            throw new Error("Login did not return an access token")
          }

          const nextAuth = { token: session.access_token, email: formData.email }
          localStorage.setItem("authToken", nextAuth.token)
          localStorage.setItem("authEmail", nextAuth.email)
          setAuth(nextAuth)
          return
        } catch (requestError) {
          const isNetworkIssue = requestError instanceof Error && requestError.message.startsWith("Network error:")
          if (isNetworkIssue && attempt === 0) {
            await new Promise((resolve) => setTimeout(resolve, 700))
            continue
          }

          setError("Account created successfully. Please log in with your new account.")
          return
        }
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Signup failed")
    }
    setLoading(false)
  }

  const handleForgotPassword = async (email: string) => {
    try {
      setLoading(true)
      setError(null)
      return await forgotPassword({ email })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    if (!auth) {
      return
    }

    try {
      await logout(auth.token)
    } catch {
      // Clear local session even if server-side logout fails.
    }

    localStorage.removeItem("authToken")
    localStorage.removeItem("authEmail")
    setAuth(null)
  }

  const handleAdd = async (newSubscription: Omit<Subscription, "subscriptionId">) => {
    if (!auth) {
      return
    }

    try {
      setError(null)
      const created = await createSubscription(auth.token, {
        serviceName: newSubscription.serviceName,
        cost: newSubscription.cost,
        billingDate: newSubscription.billingDate,
        recurrenceType: newSubscription.recurrenceType,
      })
      setSubscriptions((prev) => [...prev, created])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to add subscription")
    }
  }

  const handleDelete = async (subscriptionId: number) => {
    if (!auth) {
      return
    }

    try {
      setError(null)
      await deleteSubscription(auth.token, subscriptionId)
      setSubscriptions((prev) => prev.filter((sub) => sub.subscriptionId !== subscriptionId))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to delete subscription")
    }
  }

  const getNextBillingDate = (recurrenceType: Subscription["recurrenceType"]) => {
    const nextDate = new Date()

    if (recurrenceType === "weekly") {
      nextDate.setDate(nextDate.getDate() + 7)
    } else if (recurrenceType === "yearly") {
      nextDate.setFullYear(nextDate.getFullYear() + 1)
    } else {
      nextDate.setMonth(nextDate.getMonth() + 1)
    }

    return nextDate.toISOString().slice(0, 10)
  }

  const handleCancel = async (subscriptionId: number) => {
    if (!auth) {
      return
    }

    try {
      setError(null)
      const updated = await updateSubscription(auth.token, subscriptionId, { autoRenew: false })
      setSubscriptions((prev) => prev.map((sub) => (sub.subscriptionId === subscriptionId ? updated : sub)))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to cancel subscription")
    }
  }

  const handleEnableAutoRenew = async (subscriptionId: number) => {
    if (!auth) {
      return
    }

    try {
      setError(null)
      const updated = await updateSubscription(auth.token, subscriptionId, { autoRenew: true })
      setSubscriptions((prev) => prev.map((sub) => (sub.subscriptionId === subscriptionId ? updated : sub)))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to enable auto renew")
    }
  }

  const handleRenew = async (subscriptionId: number) => {
    if (!auth) {
      return
    }

    const target = subscriptions.find((sub) => sub.subscriptionId === subscriptionId)
    if (!target) {
      return
    }

    try {
      setError(null)
      const updated = await updateSubscription(auth.token, subscriptionId, {
        autoRenew: true,
        billingDate: getNextBillingDate(target.recurrenceType),
      })
      setSubscriptions((prev) => prev.map((sub) => (sub.subscriptionId === subscriptionId ? updated : sub)))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to renew subscription")
    }
  }

  // Dynamic dashboard metrics based on subscription data
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const isPastSubscription = (sub: Subscription) => {
    const billingDate = new Date(sub.billingDate)
    billingDate.setHours(0, 0, 0, 0)
    return !sub.autoRenew && billingDate < today
  }

  const subscriptionCostItems = subscriptions.filter((sub) => !isPastSubscription(sub))
  const monthlyExpenses = calculateMonthlyExpenses(subscriptionCostItems)
  const activeSubscriptions = calculateActiveSubscriptions(subscriptions.filter((sub) => !isPastSubscription(sub)))
  const upcomingChargesTotal = calculateUpcomingChargesTotal(subscriptions)
  const activeSubscriptionItems = subscriptions.filter((sub) => sub.isActive && !isPastSubscription(sub))
  const upcomingRenewals = subscriptions
    .filter((sub) => new Date(sub.billingDate) >= new Date())
    .sort((a, b) => new Date(a.billingDate).getTime() - new Date(b.billingDate).getTime())

  const formatRenewalDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()
    return `${month}/${day}/${year}`
  }

  const formatRecurringCost = (sub: Subscription) => {
    if (sub.recurrenceType === "yearly") {
      const monthlyEquivalent = sub.cost / 12
      return `$${sub.cost.toFixed(2)} / year ($${monthlyEquivalent.toFixed(2)} / month)`
    }

    if (sub.recurrenceType === "weekly") {
      const monthlyEquivalent = (sub.cost * 52) / 12
      return `$${sub.cost.toFixed(2)} / week (~$${monthlyEquivalent.toFixed(2)} / month)`
    }

    return `$${sub.cost.toFixed(2)} / month`
  }

  const budgetUsageRatio = budget && budget > 0 ? monthlyExpenses / budget : null
  const budgetValueClassName = budgetUsageRatio === null
    ? "text-gray-900"
    : budgetUsageRatio < 0.5
      ? "text-emerald-600"
      : budgetUsageRatio < 0.9
        ? "text-amber-500"
        : "text-red-600"

  if (!auth) {
    return (
      <AuthPanel
        onLogin={handleLogin}
        onSignup={handleSignup}
        onForgotPassword={handleForgotPassword}
        loading={loading}
        error={error}
      />
    )
  }

  return (
    <>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        userEmail={auth.email}
        budget={budget}
        onSaveBudget={handleBudgetSave}
      />

      <Layout>
        {error && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {loading && (
          <p className="mb-4 text-sm text-gray-500">Loading...</p>
        )}

        {activeTab === "dashboard" && (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900">
                Dashboard Overview
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Here’s a summary of your financial activity.
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
            <div className="relative group">
              <Card
                title="Monthly Subscription Cost"
                value={`$${monthlyExpenses.toFixed(2)}`}
              />

              <div className="pointer-events-none absolute left-0 right-0 top-full mt-2 z-20 rounded-xl border border-gray-200 bg-white p-3 shadow-lg opacity-0 translate-y-1 transition duration-200 group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:translate-y-0 group-focus-within:pointer-events-auto">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Subscription Costs
                </p>

                {subscriptionCostItems.length === 0 ? (
                  <p className="text-sm text-gray-500">No subscriptions yet.</p>
                ) : (
                  <div className="max-h-56 space-y-2 overflow-y-auto">
                    {subscriptionCostItems.map((sub) => (
                      <div
                        key={sub.subscriptionId}
                        className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                      >
                        <p className="text-sm font-semibold text-gray-900">{sub.serviceName}</p>
                        <p className="text-xs text-gray-600">{formatRecurringCost(sub)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="relative group">
              <Card
                title="Active Subscriptions"
                value={`${activeSubscriptions}`}
              />

              <div className="pointer-events-none absolute left-0 right-0 top-full mt-2 z-20 rounded-xl border border-gray-200 bg-white p-3 shadow-lg opacity-0 translate-y-1 transition duration-200 group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:translate-y-0 group-focus-within:pointer-events-auto">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Active Subscriptions
                </p>

                {activeSubscriptionItems.length === 0 ? (
                  <p className="text-sm text-gray-500">No active subscriptions yet.</p>
                ) : (
                  <div className="max-h-56 space-y-2 overflow-y-auto">
                    {activeSubscriptionItems.map((sub) => {
                      const isEndingSoon = !sub.autoRenew

                      return (
                        <div
                          key={sub.subscriptionId}
                          className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 flex items-center justify-between gap-3"
                        >
                          <p className="text-sm font-semibold text-gray-900">{sub.serviceName}</p>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              isEndingSoon ? "bg-yellow-100 text-yellow-700" : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {isEndingSoon ? "Ending Soon" : "Active"}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="relative group">
              <Card
                title="Upcoming Charges"
                value={`$${upcomingChargesTotal.toFixed(2)}`}
              />

              <div className="pointer-events-none absolute left-0 right-0 top-full mt-2 z-20 rounded-xl border border-gray-200 bg-white p-3 shadow-lg opacity-0 translate-y-1 transition duration-200 group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:translate-y-0 group-focus-within:pointer-events-auto">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Upcoming Renewals
                </p>

                {upcomingRenewals.length === 0 ? (
                  <p className="text-sm text-gray-500">No upcoming renewals.</p>
                ) : (
                  <div className="max-h-56 space-y-2 overflow-y-auto">
                    {upcomingRenewals.map((sub) => (
                      <div
                        key={sub.subscriptionId}
                        className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                      >
                        <p className="text-sm font-semibold text-gray-900">{sub.serviceName}</p>
                        <p className="text-xs text-gray-600">Renewal date: {formatRenewalDate(sub.billingDate)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Card
              title="Monthly Budget"
              value={budget !== null ? `$${budget.toFixed(2)}` : "Not set"}
              valueClassName={budgetValueClassName}
            />
          </div>
            
            <div className="mt-10 grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
            <WeeklySpendingChart subscriptions={subscriptions} />
            </div>

          <UpcomingCharges subscriptions={subscriptions} />
          </div>
          </>
        )}

        {activeTab === "subscriptions" && (
          <SubscriptionList
            subscriptions={subscriptions}
            onDelete={handleDelete}
            onAdd={handleAdd}
            onCancel={handleCancel}
            onEnableAutoRenew={handleEnableAutoRenew}
            onRenew={handleRenew}
          />
        )}
      </Layout>
    </>
  )
}

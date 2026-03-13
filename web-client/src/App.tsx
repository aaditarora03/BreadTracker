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
import SpendingCalendar from "./components/dashboard/SpendingCalendar"
import UpcomingCharges from "./components/dashboard/UpcomingCharges"
import AuthPanel from "./components/auth/AuthPanel"
import {
  calculateMonthlyExpenses,
  calculateActiveSubscriptions,
  calculateSpendingByPeriod,
  type SpendingPeriod,
} from "./types/utils/financialUtils"
import { getBillingOccurrenceInMonth, getNextBillingDateForSubscription } from "./types/utils/dateUtils"
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

type SpendingDisplayMode = "bar" | "calendar"
type DashboardPopup = "costs" | "active" | "renewals"

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]


export default function App() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [auth, setAuth] = useState<AuthState | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [budget, setBudget] = useState<number | null>(null)
  const [spendingPeriod, setSpendingPeriod] = useState<SpendingPeriod>("monthly")
  const [spendingDisplayMode, setSpendingDisplayMode] = useState<SpendingDisplayMode>("calendar")
  const [renewalMonth, setRenewalMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [openPopup, setOpenPopup] = useState<DashboardPopup | null>(null)

  // The actuive tab states which controls Dashboard vs Subscriptions view
  const [activeTab, setActiveTab] = useState<"dashboard" | "subscriptions">("dashboard")

  const showPopup = (popup: DashboardPopup) => {
    setOpenPopup(popup)
  }

  const hidePopup = (popup: DashboardPopup) => {
    setOpenPopup((current) => (current === popup ? null : current))
  }

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

  useEffect(() => {
    const root = document.documentElement
    let rafId: number | null = null
    let targetX = 50
    let targetY = 50
    let leadX = 50
    let leadY = 50
    let trailX = 50
    let trailY = 50
    let leadVX = 0
    let leadVY = 0
    let trailVX = 0
    let trailVY = 0

    const animateCursorGlow = () => {
      // Damped spring motion keeps a liquid feel without harsh snapping.
      leadVX = leadVX * 0.86 + (targetX - leadX) * 0.09
      leadVY = leadVY * 0.86 + (targetY - leadY) * 0.09
      leadX += leadVX
      leadY += leadVY

      trailVX = trailVX * 0.88 + (leadX - trailX) * 0.08
      trailVY = trailVY * 0.88 + (leadY - trailY) * 0.08
      trailX += trailVX
      trailY += trailVY

      const pullX = leadX - trailX
      const pullY = leadY - trailY
      const pullDistance = Math.min(20, Math.hypot(pullX, pullY))
      const leadSpeed = Math.min(12, Math.hypot(leadVX, leadVY))
      const stretchX = Math.min(1.22, 1 + pullDistance / 60 + leadSpeed / 90)
      const stretchY = Math.max(0.88, 1 - pullDistance / 80)
      const angle = Math.atan2(leadVY, leadVX) * (180 / Math.PI)
      const time = performance.now() / 1000
      const wobbleStrength = Math.min(0.28, pullDistance / 95 + leadSpeed / 120)
      const wobbleX = Math.sin(time * 7) * wobbleStrength
      const wobbleY = Math.cos(time * 6.5) * wobbleStrength
      const energy = Math.min(0.22, pullDistance / 160 + leadSpeed / 80)

      root.style.setProperty("--cursor-x", `${leadX + wobbleX}%`)
      root.style.setProperty("--cursor-y", `${leadY + wobbleY}%`)
      root.style.setProperty("--cursor-trail-x", `${trailX - wobbleX * 0.5}%`)
      root.style.setProperty("--cursor-trail-y", `${trailY - wobbleY * 0.5}%`)
      root.style.setProperty("--cursor-stretch-x", `${stretchX}`)
      root.style.setProperty("--cursor-stretch-y", `${stretchY}`)
      root.style.setProperty("--cursor-angle", `${Number.isFinite(angle) ? angle : 0}deg`)
      root.style.setProperty("--cursor-energy", `${energy}`)

      rafId = window.requestAnimationFrame(animateCursorGlow)
    }

    const handleMouseMove = (event: MouseEvent) => {
      targetX = (event.clientX / window.innerWidth) * 100
      targetY = (event.clientY / window.innerHeight) * 100
    }

    window.addEventListener("mousemove", handleMouseMove)
    rafId = window.requestAnimationFrame(animateCursorGlow)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId)
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
        autoRenew: newSubscription.autoRenew,
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
    if (sub.autoRenew) {
      return false
    }

    return getNextBillingDateForSubscription(sub, today) === null
  }

  const subscriptionCostItems = subscriptions.filter((sub) => !isPastSubscription(sub))
  const monthlyExpenses = calculateMonthlyExpenses(subscriptionCostItems)
  const selectedPeriodSpending = calculateSpendingByPeriod(subscriptionCostItems, spendingPeriod)
  const activeSubscriptions = calculateActiveSubscriptions(subscriptions.filter((sub) => !isPastSubscription(sub)))
  const activeSubscriptionItems = subscriptions.filter((sub) => sub.isActive && !isPastSubscription(sub))
  const renewalMonthYear = renewalMonth.getFullYear()
  const renewalMonthIndex = renewalMonth.getMonth()
  const currentRenewalMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const isAtEarliestRenewalMonth = renewalMonth <= currentRenewalMonthStart
  const upcomingRenewals = subscriptions
    .filter((sub) => sub.autoRenew)
    .map((sub) => ({
      sub,
      occurrenceDate: getBillingOccurrenceInMonth(sub, renewalMonthYear, renewalMonthIndex),
    }))
    .filter((item): item is { sub: Subscription; occurrenceDate: Date } => item.occurrenceDate !== null)
    .filter((item) => item.occurrenceDate >= today)
    .sort((a, b) => a.occurrenceDate.getTime() - b.occurrenceDate.getTime())
  const upcomingChargesTotal = upcomingRenewals.reduce((total, item) => total + item.sub.cost, 0)

  const formatRenewalDate = (value: string | Date) => {
    const date = value instanceof Date ? value : new Date(value)
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()
    return `${month}/${day}/${year}`
  }

  const goToPreviousRenewalMonth = () => {
    setRenewalMonth((current) => {
      const previous = new Date(current.getFullYear(), current.getMonth() - 1, 1)
      return previous < currentRenewalMonthStart ? current : previous
    })
  }

  const goToNextRenewalMonth = () => {
    setRenewalMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
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
    ? "text-violet-50"
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
              <h2 className="text-2xl font-semibold text-violet-50">
                Dashboard Overview
              </h2>
              <p className="text-violet-200/80 text-sm mt-1">
                Here’s a summary of your financial activity.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <div>
                  <label htmlFor="spending-display-mode" className="mr-2 text-sm font-medium text-violet-100/90">
                    Display:
                  </label>
                  <select
                    id="spending-display-mode"
                    value={spendingDisplayMode}
                    onChange={(event) => setSpendingDisplayMode(event.target.value as SpendingDisplayMode)}
                    className="rounded-lg border border-violet-300/35 bg-[rgba(26,12,44,0.75)] px-3 py-2 text-sm text-violet-50 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="bar">Bar chart</option>
                    <option value="calendar">Calendar</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="spending-period" className="mr-2 text-sm font-medium text-violet-100/90">
                    Spending view:
                  </label>
                  <select
                    id="spending-period"
                    value={spendingPeriod}
                    onChange={(event) => setSpendingPeriod(event.target.value as SpendingPeriod)}
                    className="rounded-lg border border-violet-300/35 bg-[rgba(26,12,44,0.75)] px-3 py-2 text-sm text-violet-50 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
            <div
              className="relative"
              onMouseEnter={() => showPopup("costs")}
              onMouseLeave={() => hidePopup("costs")}
            >
              <Card
                title={`${spendingPeriod[0].toUpperCase()}${spendingPeriod.slice(1)} Subscription Cost`}
                value={`$${selectedPeriodSpending.toFixed(2)}`}
              />

              <div className={`absolute left-0 right-0 top-full mt-0 z-20 rounded-xl border border-violet-300/25 bg-[rgba(22,10,38,0.95)] p-3 shadow-[0_16px_45px_rgba(7,0,18,0.62)] transition duration-200 ${openPopup === "costs" ? "pointer-events-auto opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-1"}`}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-violet-200/75">
                  Subscription Costs
                </p>

                {subscriptionCostItems.length === 0 ? (
                  <p className="text-sm text-violet-200/80">No subscriptions yet.</p>
                ) : (
                  <div className="max-h-56 space-y-2 overflow-y-auto">
                    {subscriptionCostItems.map((sub) => (
                      <div
                        key={sub.subscriptionId}
                        className="rounded-lg border border-violet-300/20 bg-white/10 px-3 py-2"
                      >
                        <p className="text-sm font-semibold text-violet-50">{sub.serviceName}</p>
                        <p className="text-xs text-violet-200/80">{formatRecurringCost(sub)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div
              className="relative"
              onMouseEnter={() => showPopup("active")}
              onMouseLeave={() => hidePopup("active")}
            >
              <Card
                title="Active Subscriptions"
                value={`${activeSubscriptions}`}
              />

              <div className={`absolute left-0 right-0 top-full mt-0 z-20 rounded-xl border border-violet-300/25 bg-[rgba(22,10,38,0.95)] p-3 shadow-[0_16px_45px_rgba(7,0,18,0.62)] transition duration-200 ${openPopup === "active" ? "pointer-events-auto opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-1"}`}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-violet-200/75">
                  Active Subscriptions
                </p>

                {activeSubscriptionItems.length === 0 ? (
                  <p className="text-sm text-violet-200/80">No active subscriptions yet.</p>
                ) : (
                  <div className="max-h-56 space-y-2 overflow-y-auto">
                    {activeSubscriptionItems.map((sub) => {
                      const isEndingSoon = !sub.autoRenew

                      return (
                        <div
                          key={sub.subscriptionId}
                          className="rounded-lg border border-violet-300/20 bg-white/10 px-3 py-2 flex items-center justify-between gap-3"
                        >
                          <p className="text-sm font-semibold text-violet-50">{sub.serviceName}</p>
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

            <div
              className="relative"
              onMouseEnter={() => showPopup("renewals")}
              onMouseLeave={() => hidePopup("renewals")}
            >
              <Card
                title="Upcoming Charges"
                value={`$${upcomingChargesTotal.toFixed(2)}`}
              />

              <div className={`absolute left-0 right-0 top-full mt-0 z-20 rounded-xl border border-violet-300/25 bg-[rgba(22,10,38,0.95)] p-3 shadow-[0_16px_45px_rgba(7,0,18,0.62)] transition duration-200 ${openPopup === "renewals" ? "pointer-events-auto opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-1"}`}>
                <div className="mb-3 space-y-2">
                  <p className="text-sm font-semibold text-violet-100/95">
                    Upcoming Renewals
                  </p>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={goToPreviousRenewalMonth}
                      disabled={isAtEarliestRenewalMonth}
                      className={`rounded border px-1.5 py-0.5 text-[11px] ${
                        isAtEarliestRenewalMonth
                          ? "cursor-not-allowed border-violet-300/20 bg-white/5 text-violet-200/35"
                          : "border-violet-300/35 bg-white/10 text-violet-100/95 hover:bg-white/20"
                      }`}
                    >
                      Prev
                    </button>

                    <select
                      value={renewalMonthIndex}
                      onChange={(event) => {
                        const nextMonth = Number(event.target.value)
                        setRenewalMonth(new Date(renewalMonthYear, nextMonth, 1))
                      }}
                      className="w-24 rounded border border-violet-300/35 bg-white/10 px-1.5 py-0.5 text-[11px] text-violet-100/95"
                    >
                      {monthNames.map((monthName, index) => (
                        <option key={monthName} value={index}>{monthName}</option>
                      ))}
                    </select>

                    <span className="rounded border border-violet-300/35 bg-white/10 px-1.5 py-0.5 text-[11px] text-violet-100/95">
                      {renewalMonthYear}
                    </span>

                    <button
                      type="button"
                      onClick={goToNextRenewalMonth}
                      className="rounded border border-violet-300/35 bg-white/10 px-1.5 py-0.5 text-[11px] text-violet-100/95 hover:bg-white/20"
                    >
                      Next
                    </button>
                  </div>
                </div>

                {upcomingRenewals.length === 0 ? (
                  <p className="text-sm text-violet-200/80">No upcoming renewals.</p>
                ) : (
                  <div className="max-h-56 space-y-2 overflow-y-auto">
                    {upcomingRenewals.map(({ sub, occurrenceDate }) => (
                      <div
                        key={sub.subscriptionId}
                        className="rounded-lg border border-violet-300/20 bg-white/10 px-3 py-2"
                      >
                        <p className="text-sm font-semibold text-violet-50">{sub.serviceName}</p>
                        <p className="text-xs text-violet-200/80">Renewal date: {formatRenewalDate(occurrenceDate)}</p>
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
            {spendingDisplayMode === "calendar" ? (
              <SpendingCalendar subscriptions={subscriptions} />
            ) : (
              <WeeklySpendingChart subscriptions={subscriptionCostItems} period={spendingPeriod} />
            )}
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

import { useEffect, useState } from "react"
import logo from "../../assets/logo.png"

interface NavbarProps {
  activeTab: "dashboard" | "subscriptions"
  setActiveTab: (tab: "dashboard" | "subscriptions") => void
  onLogout: () => Promise<void>
  userEmail?: string
  budget: number | null
  onSaveBudget: (budget: number) => void
}

export default function Navbar({ activeTab, setActiveTab, onLogout, userEmail, budget, onSaveBudget }: NavbarProps) {
  const [budgetInput, setBudgetInput] = useState("")

  useEffect(() => {
    setBudgetInput(budget !== null ? String(budget) : "")
  }, [budget])

  const submitBudget = (event: React.FormEvent) => {
    event.preventDefault()
    const parsedBudget = Number(budgetInput)
    if (Number.isNaN(parsedBudget) || parsedBudget < 0) {
      return
    }
    onSaveBudget(parsedBudget)
  }

  const tabClass = (tab: string) =>
    `cursor-pointer transition ${
      activeTab === tab
        ? "text-primary font-semibold"
        : "text-gray-600 hover:text-primary"
    }`

  return (
    <nav className="bg-card shadow-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
        <img
          src={logo}
          alt="BreadTracker Logo"
          className="w-14 h-14 object-contain"
        />
        <h1 className="text-xl font-semibold text-primary">
          BreadTracker
        </h1>
      </div>

        <div className="flex items-center gap-6 text-sm font-medium">
          <button
            className={tabClass("dashboard")}
            onClick={() => setActiveTab("dashboard")}
          >
            Dashboard
          </button>

          <button
            className={tabClass("subscriptions")}
            onClick={() => setActiveTab("subscriptions")}
          >
            Subscriptions
          </button>

          {activeTab === "subscriptions" && (
            <form onSubmit={submitBudget} className="hidden lg:flex items-center gap-2">
              <label htmlFor="budget-input" className="text-gray-500">Budget</label>
              <input
                id="budget-input"
                type="number"
                min="0"
                step="0.01"
                value={budgetInput}
                onChange={(event) => setBudgetInput(event.target.value)}
                placeholder="0.00"
                className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="rounded-md bg-primary px-2.5 py-1 text-white text-xs hover:bg-primary-dark transition"
              >
                Save
              </button>
            </form>
          )}

          <span className="text-gray-500 hidden md:inline">{userEmail}</span>

          <button
            className="text-red-500 hover:text-red-600"
            onClick={() => {
              void onLogout()
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}
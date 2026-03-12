import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import { useAuth } from "../../hooks/useAuth";

interface NavbarProps {
  budget: number | null;
  onSaveBudget: (budget: number) => void;
}

export default function Navbar({ budget, onSaveBudget }: NavbarProps) {
  const [budgetInput, setBudgetInput] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { auth, signOut } = useAuth();
  const [prevBudget, setPrevBudget] = useState<number | null>(null);

  if (budget !== prevBudget) {
    setPrevBudget(budget);
    setBudgetInput(budget !== null ? String(budget) : "");
  }

  const submitBudget = (event: React.FormEvent) => {
    event.preventDefault();
    const parsedBudget = Number(budgetInput);
    if (Number.isNaN(parsedBudget) || parsedBudget < 0) {
      return;
    }
    onSaveBudget(parsedBudget);
  };

  const tabClass = (path: string) =>
    `cursor-pointer transition ${
      location.pathname === path
        ? "text-primary font-semibold"
        : "text-violet-100/80 hover:text-violet-50"
    }`;

  return (
    <nav className="bg-[rgba(16,8,30,0.86)] backdrop-blur-xl shadow-sm border-b border-violet-300/20">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={logo}
            alt="BreadTracker Logo"
            className="w-14 h-14 object-contain"
          />
          <h1 className="text-xl font-semibold text-primary">BreadTracker</h1>
        </Link>

        <div className="flex items-center gap-6 text-sm font-medium">
          <Link to="/" className={tabClass("/")}>
            Dashboard
          </Link>

          <Link to="/subscriptions" className={tabClass("/subscriptions")}>
            Subscriptions
          </Link>

          <form
            onSubmit={submitBudget}
            className="hidden lg:flex items-center gap-2"
          >
            <label
              htmlFor="budget-input"
              className="text-xs font-semibold uppercase tracking-wider text-violet-300/70 mr-1"
            >
              Budget
            </label>
            <input
              id="budget-input"
              type="number"
              min="0"
              step="0.01"
              value={budgetInput}
              onChange={(event) => setBudgetInput(event.target.value)}
              placeholder="0.00"
              className="w-24 rounded-md border border-violet-300/35 bg-[rgba(26,12,44,0.75)] px-2 py-1 text-sm text-violet-50 placeholder:text-violet-200/50 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              className="rounded-md bg-primary px-2.5 py-1 text-white text-xs hover:bg-primary-dark transition"
            >
              Save
            </button>
          </form>

          <span className="text-emerald-400 font-medium hidden md:inline">
            {auth?.email}
          </span>

          <button
            className="text-red-500 hover:text-red-600"
            onClick={async () => {
              await signOut();
              navigate("/login");
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

import { useState } from "react";
import Card from "../components/ui/Card";
import WeeklySpendingChart from "../components/dashboard/WeeklySpendingChart";
import SpendingCalendar from "../components/dashboard/SpendingCalendar";
import UpcomingCharges from "../components/dashboard/UpcomingCharges";
import {
  calculateMonthlyExpenses,
  calculateActiveSubscriptions,
  calculateSpendingByPeriod,
  type SpendingPeriod,
} from "../lib/utils/financialUtils";
import {
  getBillingOccurrenceInMonth,
  getNextBillingDateForSubscription,
} from "../lib/utils/dateUtils";
import type { Subscription } from "../types/Subscription";

interface Props {
  subscriptions: Subscription[];
  budget: number | null;
}

type SpendingDisplayMode = "bar" | "calendar";
type DashboardPopup = "costs" | "active" | "renewals";

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
];

export default function Dashboard({ subscriptions, budget }: Props) {
  const [spendingPeriod, setSpendingPeriod] =
    useState<SpendingPeriod>("monthly");
  const [spendingDisplayMode, setSpendingDisplayMode] =
    useState<SpendingDisplayMode>("calendar");
  const [renewalMonth, setRenewalMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [openPopup, setOpenPopup] = useState<DashboardPopup | null>(null);

  const showPopup = (popup: DashboardPopup) => setOpenPopup(popup);
  const hidePopup = (popup: DashboardPopup) =>
    setOpenPopup((current) => (current === popup ? null : current));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isPastSubscription = (sub: Subscription) => {
    if (sub.autoRenew) return false;
    return getNextBillingDateForSubscription(sub, today) === null;
  };

  const subscriptionCostItems = subscriptions.filter(
    (sub) => !isPastSubscription(sub),
  );
  const monthlyExpenses = calculateMonthlyExpenses(subscriptionCostItems);
  const selectedPeriodSpending = calculateSpendingByPeriod(
    subscriptionCostItems,
    spendingPeriod,
  );
  const activeSubscriptions = calculateActiveSubscriptions(
    subscriptions.filter((sub) => !isPastSubscription(sub)),
  );
  const activeSubscriptionItems = subscriptions.filter(
    (sub) => sub.isActive && !isPastSubscription(sub),
  );

  const renewalMonthYear = renewalMonth.getFullYear();
  const renewalMonthIndex = renewalMonth.getMonth();
  const currentRenewalMonthStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    1,
  );
  const isAtEarliestRenewalMonth = renewalMonth <= currentRenewalMonthStart;

  const upcomingRenewals = subscriptions
    .filter((sub) => sub.autoRenew)
    .map((sub) => ({
      sub,
      occurrenceDate: getBillingOccurrenceInMonth(
        sub,
        renewalMonthYear,
        renewalMonthIndex,
      ),
    }))
    .filter(
      (item): item is { sub: Subscription; occurrenceDate: Date } =>
        item.occurrenceDate !== null,
    )
    .filter((item) => item.occurrenceDate >= today)
    .sort((a, b) => a.occurrenceDate.getTime() - b.occurrenceDate.getTime());
  const upcomingChargesTotal = upcomingRenewals.reduce(
    (total, item) => total + item.sub.cost,
    0,
  );

  const formatRenewalDate = (value: string | Date) => {
    const date = value instanceof Date ? value : new Date(value);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const goToPreviousRenewalMonth = () => {
    setRenewalMonth((current) => {
      const previous = new Date(
        current.getFullYear(),
        current.getMonth() - 1,
        1,
      );
      return previous < currentRenewalMonthStart ? current : previous;
    });
  };

  const goToNextRenewalMonth = () => {
    setRenewalMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
    );
  };

  const formatRecurringCost = (sub: Subscription) => {
    if (sub.recurrenceType === "yearly") {
      const monthlyEquivalent = sub.cost / 12;
      return `$${sub.cost.toFixed(2)} / year ($${monthlyEquivalent.toFixed(2)} / month)`;
    }
    if (sub.recurrenceType === "weekly") {
      const monthlyEquivalent = (sub.cost * 52) / 12;
      return `$${sub.cost.toFixed(2)} / week (~$${monthlyEquivalent.toFixed(2)} / month)`;
    }
    return `$${sub.cost.toFixed(2)} / month`;
  };

  const budgetUsageRatio =
    budget && budget > 0 ? monthlyExpenses / budget : null;
  const budgetValueClassName =
    budgetUsageRatio === null
      ? "text-gray-900"
      : budgetUsageRatio < 0.5
        ? "text-emerald-600"
        : budgetUsageRatio < 0.9
          ? "text-amber-500"
          : "text-red-600";

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900">
          Dashboard Overview
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Here’s a summary of your financial activity.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div>
            <label
              htmlFor="spending-display-mode"
              className="mr-2 text-sm font-medium text-gray-700"
            >
              Display:
            </label>
            <select
              id="spending-display-mode"
              value={spendingDisplayMode}
              onChange={(event) =>
                setSpendingDisplayMode(
                  event.target.value as SpendingDisplayMode,
                )
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="bar">Bar chart</option>
              <option value="calendar">Calendar</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="spending-period"
              className="mr-2 text-sm font-medium text-gray-700"
            >
              Spending view:
            </label>
            <select
              id="spending-period"
              value={spendingPeriod}
              onChange={(event) =>
                setSpendingPeriod(event.target.value as SpendingPeriod)
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
          <div
            className={`absolute left-0 right-0 top-full mt-0 z-20 rounded-xl border border-gray-200 bg-white p-3 shadow-xl transition duration-200 ${openPopup === "costs" ? "pointer-events-auto opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-1"}`}
          >
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
                    <p className="text-sm font-semibold text-gray-900">
                      {sub.serviceName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatRecurringCost(sub)}
                    </p>
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
          <Card title="Active Subscriptions" value={`${activeSubscriptions}`} />
          <div
            className={`absolute left-0 right-0 top-full mt-0 z-20 rounded-xl border border-gray-200 bg-white p-3 shadow-xl transition duration-200 ${openPopup === "active" ? "pointer-events-auto opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-1"}`}
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Active Subscriptions
            </p>
            {activeSubscriptionItems.length === 0 ? (
              <p className="text-sm text-gray-500">
                No active subscriptions yet.
              </p>
            ) : (
              <div className="max-h-56 space-y-2 overflow-y-auto">
                {activeSubscriptionItems.map((sub) => {
                  const isEndingSoon = !sub.autoRenew;
                  return (
                    <div
                      key={sub.subscriptionId}
                      className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 flex items-center justify-between gap-3"
                    >
                      <p className="text-sm font-semibold text-gray-900">
                        {sub.serviceName}
                      </p>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isEndingSoon ? "bg-yellow-100 text-yellow-700" : "bg-emerald-100 text-emerald-700"}`}
                      >
                        {isEndingSoon ? "Ending Soon" : "Active"}
                      </span>
                    </div>
                  );
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
          <div
            className={`absolute left-0 right-0 top-full mt-0 z-20 rounded-xl border border-gray-200 bg-white p-3 shadow-xl transition duration-200 ${openPopup === "renewals" ? "pointer-events-auto opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-1"}`}
          >
            <div className="mb-3 space-y-2">
              <p className="text-sm font-semibold text-gray-900">
                Upcoming Renewals
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={goToPreviousRenewalMonth}
                  disabled={isAtEarliestRenewalMonth}
                  className={`rounded border px-1.5 py-0.5 text-[11px] ${isAtEarliestRenewalMonth ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}
                >
                  Prev
                </button>
                <select
                  value={renewalMonthIndex}
                  onChange={(event) =>
                    setRenewalMonth(
                      new Date(renewalMonthYear, Number(event.target.value), 1),
                    )
                  }
                  className="w-24 rounded border border-gray-300 bg-white px-1.5 py-0.5 text-[11px] text-gray-700 focus:outline-none focus:border-transparent focus:ring-1 focus:ring-primary"
                >
                  {monthNames.map((monthName, index) => (
                    <option key={monthName} value={index}>
                      {monthName}
                    </option>
                  ))}
                </select>
                <span className="rounded border border-gray-300 bg-white px-1.5 py-0.5 text-[11px] text-gray-700">
                  {renewalMonthYear}
                </span>
                <button
                  type="button"
                  onClick={goToNextRenewalMonth}
                  className="rounded border border-gray-300 bg-white px-1.5 py-0.5 text-[11px] text-gray-700 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
            {upcomingRenewals.length === 0 ? (
              <p className="text-sm text-gray-500">No upcoming renewals.</p>
            ) : (
              <div className="max-h-56 space-y-2 overflow-y-auto">
                {upcomingRenewals.map(({ sub, occurrenceDate }) => (
                  <div
                    key={sub.subscriptionId}
                    className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                  >
                    <p className="text-sm font-semibold text-gray-900">
                      {sub.serviceName}
                    </p>
                    <p className="text-xs text-gray-500">
                      Renewal date: {formatRenewalDate(occurrenceDate)}
                    </p>
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
            <WeeklySpendingChart
              subscriptions={subscriptionCostItems}
              period={spendingPeriod}
            />
          )}
        </div>
        <UpcomingCharges subscriptions={subscriptions} />
      </div>
    </>
  );
}

import { useMemo, useState } from "react";
import type { Subscription } from "../../types/Subscription";
import {
  calendarDayLabels,
  generateCalendarSpendingData,
} from "../../lib/utils/chartUtils";

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

interface Props {
  subscriptions: Subscription[];
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function getAmountTextClass(
  chargeType: "none" | "canceled" | "active-recurring" | "mixed",
): string {
  if (chargeType === "active-recurring") {
    return "text-emerald-700";
  }

  if (chargeType === "canceled") {
    return "text-amber-700";
  }

  if (chargeType === "mixed") {
    return "text-sky-700";
  }

  return "text-emerald-700";
}

function parseDateOnly(dateString: string): Date {
  const [yearText, monthText, dayText] = dateString.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (
    Number.isInteger(year) &&
    Number.isInteger(month) &&
    Number.isInteger(day) &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= 31
  ) {
    return new Date(year, month - 1, day);
  }

  return new Date(dateString);
}

export default function SpendingCalendar({ subscriptions }: Props) {
  const [visibleDate, setVisibleDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const year = visibleDate.getFullYear();
  const monthIndex = visibleDate.getMonth();

  const monthSpendingData = useMemo(
    () => generateCalendarSpendingData(subscriptions, year, monthIndex),
    [subscriptions, year, monthIndex],
  );

  const monthTotal = useMemo(
    () => monthSpendingData.reduce((total, day) => total + day.spending, 0),
    [monthSpendingData],
  );

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = new Set<number>([currentYear, year]);

    subscriptions.forEach((sub) => {
      const billingYear = parseDateOnly(sub.billingDate).getFullYear();
      years.add(billingYear);
      years.add(billingYear - 1);
      years.add(billingYear + 1);
    });

    return Array.from(years).sort((a, b) => a - b);
  }, [subscriptions, year]);

  const goToPreviousMonth = () => {
    setVisibleDate(
      (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
    );
  };

  const goToNextMonth = () => {
    setVisibleDate(
      (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
    );
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Calendar Spending
          </h3>
          <p className="text-sm text-gray-500">
            Total this month: {formatCurrency(monthTotal)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToPreviousMonth}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            Prev
          </button>

          <select
            aria-label="Select month"
            value={monthIndex}
            onChange={(event) => {
              const nextMonth = Number(event.target.value);
              setVisibleDate(new Date(year, nextMonth, 1));
            }}
            className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700"
          >
            {monthNames.map((monthName, index) => (
              <option key={monthName} value={index}>
                {monthName}
              </option>
            ))}
          </select>

          <select
            aria-label="Select year"
            value={year}
            onChange={(event) => {
              const nextYear = Number(event.target.value);
              setVisibleDate(new Date(nextYear, monthIndex, 1));
            }}
            className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700"
          >
            {yearOptions.map((optionYear) => (
              <option key={optionYear} value={optionYear}>
                {optionYear}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={goToNextMonth}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-xs font-semibold text-gray-500 mb-2">
        {calendarDayLabels.map((dayLabel) => (
          <div key={dayLabel} className="text-center">
            {dayLabel}
          </div>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          Active recurring
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          Canceled / one-time
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
          Mixed
        </span>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {monthSpendingData.map((day) => (
          <div
            key={day.date.toISOString()}
            className={`min-h-[72px] rounded-lg border p-2 ${
              day.isCurrentMonth
                ? "border-gray-200 bg-white shadow-sm"
                : "border-gray-100 bg-gray-50 opacity-50"
            }`}
          >
            <p
              className={`text-xs font-semibold ${day.isCurrentMonth ? "text-gray-900" : "text-gray-400"}`}
            >
              {day.dayOfMonth}
            </p>
            {day.spending > 0 && (
              <p
                className={`mt-1 text-xs font-medium ${getAmountTextClass(day.chargeType)}`}
              >
                {formatCurrency(day.spending)}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

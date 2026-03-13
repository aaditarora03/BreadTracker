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
    <div className="rounded-2xl border border-violet-300/25 bg-[rgba(24,10,40,0.8)] backdrop-blur-md shadow-[0_14px_35px_rgba(5,0,15,0.45)] p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-violet-50">
            Calendar Spending
          </h3>
          <p className="text-sm text-violet-200/80">
            Total this month: {formatCurrency(monthTotal)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToPreviousMonth}
            className="rounded-lg border border-violet-300/35 bg-white/10 px-3 py-1.5 text-sm text-violet-100 hover:bg-white/20"
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
            className="rounded-lg border border-violet-300/35 bg-white/10 px-2 py-1.5 text-sm text-violet-100"
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
            className="rounded-lg border border-violet-300/35 bg-white/10 px-2 py-1.5 text-sm text-violet-100"
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
            className="rounded-lg border border-violet-300/35 bg-white/10 px-3 py-1.5 text-sm text-violet-100 hover:bg-white/20"
          >
            Next
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-xs font-semibold text-violet-200/80 mb-2">
        {calendarDayLabels.map((dayLabel) => (
          <div key={dayLabel} className="text-center">
            {dayLabel}
          </div>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-violet-200/85">
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
                ? "border-violet-300/25 bg-white/10"
                : "border-violet-300/15 bg-white/5"
            }`}
          >
            <p
              className={`text-xs font-semibold ${day.isCurrentMonth ? "text-violet-100" : "text-violet-300/45"}`}
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

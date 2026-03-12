import type { Subscription } from "../Subscription"
import type { SpendingPeriod } from "./financialUtils"

// Define strict weekday type
type WeekDay = "Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat"

const daysOfWeek: WeekDay[] = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
]

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const monthWeekLabels = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"]

export const calendarDayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export interface CalendarDayItem {
  date: Date
  dayOfMonth: number
  isCurrentMonth: boolean
  spending: number
  chargeType: "none" | "canceled" | "active-recurring" | "mixed"
}

export interface SpendingChartItem {
  label: string
  amount: number
}

function parseDateOnly(dateString: string): Date {
  const [yearText, monthText, dayText] = dateString.split("-")
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)

  if (
    Number.isInteger(year)
    && Number.isInteger(month)
    && Number.isInteger(day)
    && month >= 1
    && month <= 12
    && day >= 1
    && day <= 31
  ) {
    return new Date(year, month - 1, day)
  }

  return new Date(dateString)
}

function addMonthsClamped(base: Date, monthsToAdd: number): Date {
  const targetYear = base.getFullYear() + Math.floor((base.getMonth() + monthsToAdd) / 12)
  const targetMonth = (base.getMonth() + monthsToAdd + 1200) % 12
  const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate()
  const targetDay = Math.min(base.getDate(), daysInTargetMonth)
  return new Date(targetYear, targetMonth, targetDay)
}

function addYearsClamped(base: Date, yearsToAdd: number): Date {
  const targetYear = base.getFullYear() + yearsToAdd
  const targetMonth = base.getMonth()
  const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate()
  const targetDay = Math.min(base.getDate(), daysInTargetMonth)
  return new Date(targetYear, targetMonth, targetDay)
}

function getFirstRenewalDate(subscription: Subscription): Date {
  const billingDate = parseDateOnly(subscription.billingDate)

  if (subscription.recurrenceType === "weekly") {
    return new Date(billingDate.getFullYear(), billingDate.getMonth(), billingDate.getDate() + 7)
  }

  if (subscription.recurrenceType === "yearly") {
    return addYearsClamped(billingDate, 1)
  }

  return addMonthsClamped(billingDate, 1)
}

function getMonthlyRecurringDaySpending(
  subscription: Subscription,
  year: number,
  monthIndex: number,
): Map<number, number> {
  const spendingByDay = new Map<number, number>()
  const originalBillingDate = parseDateOnly(subscription.billingDate)
  const referenceDate = subscription.autoRenew ? getFirstRenewalDate(subscription) : originalBillingDate
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const monthEnd = new Date(year, monthIndex, daysInMonth)

  // One-time behavior: non-auto-renew subscriptions only count on the original billing date.
  if (!subscription.autoRenew) {
    if (
      originalBillingDate.getFullYear() === year
      && originalBillingDate.getMonth() === monthIndex
    ) {
      spendingByDay.set(originalBillingDate.getDate(), (spendingByDay.get(originalBillingDate.getDate()) ?? 0) + subscription.cost)
    }
    return spendingByDay
  }

  // Do not project costs into months that are fully before the original billing date.
  if (monthEnd < originalBillingDate) {
    return spendingByDay
  }

  // Show the original billed occurrence in the month it was set.
  if (
    subscription.recurrenceType !== "weekly"
    && originalBillingDate.getFullYear() === year
    && originalBillingDate.getMonth() === monthIndex
  ) {
    const originalDay = Math.min(originalBillingDate.getDate(), daysInMonth)
    spendingByDay.set(originalDay, (spendingByDay.get(originalDay) ?? 0) + subscription.cost)
  }

  if (subscription.recurrenceType === "weekly") {
    const targetWeekday = originalBillingDate.getDay()
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, monthIndex, day)
      if (date.getDay() === targetWeekday && date >= originalBillingDate) {
        spendingByDay.set(day, (spendingByDay.get(day) ?? 0) + subscription.cost)
      }
    }
    return spendingByDay
  }

  if (subscription.recurrenceType === "monthly") {
    const targetDay = Math.min(referenceDate.getDate(), daysInMonth)
    const monthlyOccurrence = new Date(year, monthIndex, targetDay)
    if (monthlyOccurrence >= referenceDate) {
      spendingByDay.set(targetDay, (spendingByDay.get(targetDay) ?? 0) + subscription.cost)
    }
    return spendingByDay
  }

  if (referenceDate.getMonth() === monthIndex && year >= referenceDate.getFullYear()) {
    const targetDay = Math.min(referenceDate.getDate(), daysInMonth)
    const yearlyOccurrence = new Date(year, monthIndex, targetDay)
    if (yearlyOccurrence >= referenceDate) {
      spendingByDay.set(targetDay, (spendingByDay.get(targetDay) ?? 0) + subscription.cost)
    }
  }

  return spendingByDay
}

function generateMonthlySpending(subscriptions: Subscription[]): SpendingChartItem[] {
  const monthlyData = new Array<number>(monthWeekLabels.length).fill(0)

  subscriptions.forEach((sub) => {
    const day = parseDateOnly(sub.billingDate).getDate()
    const weekIndex = Math.min(monthWeekLabels.length - 1, Math.floor((day - 1) / 7))
    monthlyData[weekIndex] += sub.cost
  })

  return monthWeekLabels.map((label, index) => ({
    label,
    amount: Number(monthlyData[index].toFixed(2)),
  }))
}

function generateYearlySpending(subscriptions: Subscription[]): SpendingChartItem[] {
  const yearlyData = new Array<number>(monthLabels.length).fill(0)

  subscriptions.forEach((sub) => {
    const monthIndex = parseDateOnly(sub.billingDate).getMonth()
    yearlyData[monthIndex] += sub.cost
  })

  return monthLabels.map((label, index) => ({
    label,
    amount: Number(yearlyData[index].toFixed(2)),
  }))
}

function generateWeeklySpending(subscriptions: Subscription[]): SpendingChartItem[] {
  // Properly typed record
  const weeklyData: Record<WeekDay, number> = {
    Sun: 0,
    Mon: 0,
    Tue: 0,
    Wed: 0,
    Thu: 0,
    Fri: 0,
    Sat: 0,
  }

  subscriptions.forEach((sub) => {
    const date = parseDateOnly(sub.billingDate)
    const dayName = daysOfWeek[date.getDay()] // Now typed as WeekDay
    weeklyData[dayName] += sub.cost
  })

  return daysOfWeek.map((day) => ({
    label: day,
    amount: Number(weeklyData[day].toFixed(2)),
  }))
}

export function generateSpendingChartData(
  subscriptions: Subscription[],
  period: SpendingPeriod,
): SpendingChartItem[] {
  if (period === "monthly") {
    return generateMonthlySpending(subscriptions)
  }

  if (period === "yearly") {
    return generateYearlySpending(subscriptions)
  }

  return generateWeeklySpending(subscriptions)
}

export function generateCalendarSpendingData(
  subscriptions: Subscription[],
  year: number,
  monthIndex: number,
): CalendarDayItem[] {
  const firstDayOfMonth = new Date(year, monthIndex, 1)
  const calendarStart = new Date(firstDayOfMonth)
  calendarStart.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay())

  const dailyTotals = new Map<number, number>()
  const dailyChargeFlags = new Map<number, { hasCanceled: boolean; hasRecurring: boolean }>()

  const updateFlags = (day: number, isAutoRenew: boolean) => {
    const current = dailyChargeFlags.get(day) ?? { hasCanceled: false, hasRecurring: false }
    if (isAutoRenew) {
      current.hasRecurring = true
    } else {
      current.hasCanceled = true
    }
    dailyChargeFlags.set(day, current)
  }

  subscriptions.forEach((subscription) => {
    const spendingForSubscription = getMonthlyRecurringDaySpending(subscription, year, monthIndex)
    spendingForSubscription.forEach((amount, day) => {
      dailyTotals.set(day, (dailyTotals.get(day) ?? 0) + amount)
      updateFlags(day, subscription.autoRenew)
    })
  })

  const grid: CalendarDayItem[] = []
  for (let offset = 0; offset < 42; offset += 1) {
    const date = new Date(calendarStart)
    date.setDate(calendarStart.getDate() + offset)

    const isCurrentMonth = date.getMonth() === monthIndex && date.getFullYear() === year
    const dayOfMonth = date.getDate()
    const spending = isCurrentMonth ? Number((dailyTotals.get(dayOfMonth) ?? 0).toFixed(2)) : 0
    const flags = dailyChargeFlags.get(dayOfMonth)
    let chargeType: CalendarDayItem["chargeType"] = "none"

    if (spending > 0 && flags) {
      if (flags.hasRecurring && flags.hasCanceled) {
        chargeType = "mixed"
      } else if (flags.hasRecurring) {
        chargeType = "active-recurring"
      } else if (flags.hasCanceled) {
        chargeType = "canceled"
      }
    }

    grid.push({
      date,
      dayOfMonth,
      isCurrentMonth,
      spending,
      chargeType,
    })
  }

  return grid
}
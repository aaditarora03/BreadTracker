/**
 * Utility: Date Functions
 * 
 * getDaysLeft - Calculates the number of days left until the billing date.
 * Used for subscription badges
 * ~ Osbaldo Mota
 */

import type { Subscription } from "../../types/Subscription"


const DAY_IN_MS = 1000 * 60 * 60 * 24

function startOfDay(date: Date): Date {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  return value
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

export function getNextBillingDateForSubscription(
  subscription: Subscription,
  referenceDate: Date = new Date(),
): Date | null {
  const today = startOfDay(referenceDate)
  const billingDate = startOfDay(parseDateOnly(subscription.billingDate))

  if (!subscription.autoRenew) {
    if (billingDate >= today) {
      return billingDate
    }

    if (subscription.recurrenceType === "weekly") {
      const cycleEnd = new Date(
        billingDate.getFullYear(),
        billingDate.getMonth(),
        billingDate.getDate() + 7,
      )
      return cycleEnd >= today ? cycleEnd : null
    }

    if (subscription.recurrenceType === "monthly") {
      const cycleEnd = addMonthsClamped(billingDate, 1)
      return cycleEnd >= today ? cycleEnd : null
    }

    const cycleEnd = addYearsClamped(billingDate, 1)
    return cycleEnd >= today ? cycleEnd : null
  }

  // For recurring subscriptions, include the initial billing date if it is still in the future.
  if (billingDate >= today) {
    return billingDate
  }

  if (subscription.recurrenceType === "weekly") {
    const diffDays = Math.floor((today.getTime() - billingDate.getTime()) / DAY_IN_MS)
    const weeksToAdd = Math.floor(diffDays / 7)
    let candidate = new Date(
      billingDate.getFullYear(),
      billingDate.getMonth(),
      billingDate.getDate() + weeksToAdd * 7,
    )

    if (candidate < today) {
      candidate = new Date(candidate.getFullYear(), candidate.getMonth(), candidate.getDate() + 7)
    }

    return candidate
  }

  if (subscription.recurrenceType === "monthly") {
    const monthsDiff = (today.getFullYear() - billingDate.getFullYear()) * 12 + (today.getMonth() - billingDate.getMonth())
    let candidate = addMonthsClamped(billingDate, Math.max(0, monthsDiff))
    if (candidate < today) {
      candidate = addMonthsClamped(billingDate, Math.max(0, monthsDiff) + 1)
    }
    return candidate
  }

  const yearsDiff = today.getFullYear() - billingDate.getFullYear()
  let candidate = addYearsClamped(billingDate, Math.max(0, yearsDiff))
  if (candidate < today) {
    candidate = addYearsClamped(billingDate, Math.max(0, yearsDiff) + 1)
  }
  return candidate
}

export function getDaysLeftFromDate(targetDate: Date, referenceDate: Date = new Date()): number {
  const diffTime = startOfDay(targetDate).getTime() - startOfDay(referenceDate).getTime()
  return Math.ceil(diffTime / DAY_IN_MS)
}

export function getDaysLeftForSubscription(subscription: Subscription, referenceDate: Date = new Date()) {
  const nextBillingDate = getNextBillingDateForSubscription(subscription, referenceDate)
  if (!nextBillingDate) {
    return undefined
  }

  return getDaysLeftFromDate(nextBillingDate, referenceDate)
}

export function getBillingOccurrenceInMonth(
  subscription: Subscription,
  year: number,
  monthIndex: number,
): Date | null {
  const billingDate = startOfDay(parseDateOnly(subscription.billingDate))
  const monthStart = new Date(year, monthIndex, 1)
  const monthEnd = new Date(year, monthIndex + 1, 0)

  if (!subscription.autoRenew) {
    if (billingDate.getFullYear() === year && billingDate.getMonth() === monthIndex) {
      return billingDate
    }
    return null
  }

  if (subscription.recurrenceType === "weekly") {
    if (monthEnd < billingDate) {
      return null
    }

    let candidate = billingDate
    if (candidate < monthStart) {
      const diffDays = Math.floor((monthStart.getTime() - candidate.getTime()) / DAY_IN_MS)
      const weeksToAdd = Math.ceil(diffDays / 7)
      candidate = new Date(candidate.getFullYear(), candidate.getMonth(), candidate.getDate() + weeksToAdd * 7)
    }

    return candidate <= monthEnd ? candidate : null
  }

  if (subscription.recurrenceType === "monthly") {
    const monthsDiff = (year - billingDate.getFullYear()) * 12 + (monthIndex - billingDate.getMonth())
    if (monthsDiff < 0) {
      return null
    }

    const occurrence = addMonthsClamped(billingDate, monthsDiff)
    if (occurrence.getFullYear() === year && occurrence.getMonth() === monthIndex) {
      return occurrence
    }
    return null
  }

  const yearsDiff = year - billingDate.getFullYear()
  if (yearsDiff < 0) {
    return null
  }

  const occurrence = addYearsClamped(billingDate, yearsDiff)
  if (occurrence.getFullYear() === year && occurrence.getMonth() === monthIndex) {
    return occurrence
  }

  return null
}


// Calculates days between the current date and ther billing date
export function getDaysLeft(dateString: string): number {
  return getDaysLeftFromDate(parseDateOnly(dateString))
}
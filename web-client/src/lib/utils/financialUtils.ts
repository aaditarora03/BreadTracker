/**
 * Utility: Financial Calculations
 * 
 * Purpose:
 * Provides helper functions to calculate dashboard metrics
 * based on subscription data.
 * 
 * Why this exists:
 * - Keeps business logic separate from UI components
 * - Makes dashboard fully dynamic
 * - Easier to replace with backend API later
 */

import type { Subscription } from "../Subscription"
import { getNextBillingDateForSubscription } from "./dateUtils"

export type SpendingPeriod = "weekly" | "monthly" | "yearly"

function getMonthlyEquivalent(sub: Subscription): number {
  if (sub.recurrenceType === "weekly") {
    return (sub.cost * 52) / 12
  }

  if (sub.recurrenceType === "yearly") {
    return sub.cost / 12
  }

  return sub.cost
}

/**
 * Calculates the total monthly cost of all active subscriptions
 */
export function calculateMonthlyExpenses(subscriptions: Subscription[]): number {
  return subscriptions.reduce((total, sub) => total + getMonthlyEquivalent(sub), 0)
}

export function calculateSpendingByPeriod(
  subscriptions: Subscription[],
  period: SpendingPeriod,
): number {
  const monthlyTotal = calculateMonthlyExpenses(subscriptions)

  if (period === "weekly") {
    return (monthlyTotal * 12) / 52
  }

  if (period === "yearly") {
    return monthlyTotal * 12
  }

  return monthlyTotal
}

/**
 * Returns the number of active subscriptions
 */
export function calculateActiveSubscriptions(subscriptions: Subscription[]): number {
  return subscriptions.length
}

/**
 * Calculates total cost of upcoming charges (future billing dates)
 */
export function calculateUpcomingChargesTotal(subscriptions: Subscription[]): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return subscriptions
    .map((sub) => ({
      sub,
      nextBillingDate: getNextBillingDateForSubscription(sub, today),
    }))
    .filter((item): item is { sub: Subscription; nextBillingDate: Date } => item.nextBillingDate !== null)
    .filter((item) => {
      return item.nextBillingDate.getFullYear() === today.getFullYear()
        && item.nextBillingDate.getMonth() === today.getMonth()
        && item.nextBillingDate >= today
    })
    .reduce((total, item) => total + item.sub.cost, 0)
}
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

  return subscriptions
    .filter((sub) => {
      const billingDate = new Date(sub.billingDate)
      return billingDate >= today
    })
    .reduce((total, sub) => total + sub.cost, 0)
}
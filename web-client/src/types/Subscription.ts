export interface Subscription {
  subscriptionId: number
  serviceName: string
  cost: number
  billingDate: string
  recurrenceType: "weekly" | "monthly" | "yearly"
  autoRenew: boolean
  isActive: boolean
  emailReminder: boolean
}
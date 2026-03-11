/** 
SubscriptionList Component

Displays:
-List of current subscriptions
-Days remaing untill next payment
-Delete button
-Dyanmic button (red, yellow, green) based on how close the billing date is

~ Osbaldo Mota
*/

import type { Subscription } from "../../types/Subscription"
import { getDaysLeftForSubscription } from "../../types/utils/dateUtils"
import SubscriptionForm from "./SubscriptionForm"

interface Props {
  subscriptions: Subscription[]
  onDelete: (subscriptionId: number) => Promise<void>
  onAdd: (subscription: Omit<Subscription, "subscriptionId">) => Promise<void>
  onCancel: (subscriptionId: number) => Promise<void>
  onEnableAutoRenew: (subscriptionId: number) => Promise<void>
  onRenew: (subscriptionId: number) => Promise<void>
}

export default function SubscriptionList({
  subscriptions,
  onDelete,
  onAdd,
  onCancel,
  onEnableAutoRenew,
  onRenew,
}: Props) {
  const formatRenewalLabel = (sub: Subscription, daysLeft: number) => {
    if (daysLeft <= 0) {
      return sub.autoRenew ? "Renews today" : "Expires today"
    }

    return sub.autoRenew ? `Renews in ${daysLeft} days` : `Expires in ${daysLeft} days`
  }

  const getRenewalBadgeColor = (sub: Subscription) => {
    return sub.autoRenew ? "bg-emerald-100 text-emerald-700" : "bg-yellow-100 text-yellow-700"
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const isPastSubscription = (sub: Subscription) => {
    const billingDate = new Date(sub.billingDate)
    billingDate.setHours(0, 0, 0, 0)
    return !sub.autoRenew && billingDate < today
  }

  const activeSubscriptions = subscriptions.filter((sub) => !isPastSubscription(sub))
  const pastSubscriptions = subscriptions.filter((sub) => isPastSubscription(sub))

  return (
    <div>
      <SubscriptionForm onAdd={onAdd} />
    
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-3xl">
      <h2 className="text-xl font-semibold mb-6 text-gray-900">
        Subscriptions
      </h2>

      {activeSubscriptions.length === 0 ? (
        <p className="text-gray-500 text-sm">
          No subscriptions added yet.
        </p>
      ) : (

        // Renders each subscription with name, cost, billing date, days left badge, and delete button
        <div className="space-y-4">
          {activeSubscriptions.map((sub) => {
            const daysLeft = getDaysLeftForSubscription(sub) ?? 0

            return (
              <div
                key={sub.subscriptionId}
                className="flex justify-between items-center p-4 border rounded-xl bg-gray-50"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {sub.serviceName}
                  </p>
                  <p className="text-sm text-gray-500">
                    ${sub.cost} • {sub.recurrenceType} • Due: {sub.billingDate}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${getRenewalBadgeColor(sub)}`}
                    >
                    {formatRenewalLabel(sub, daysLeft)}
                    </span>

                  {sub.autoRenew ? (
                    <button
                      onClick={() => onCancel(sub.subscriptionId)}
                      className="text-amber-600 hover:text-amber-700 text-sm font-medium"
                    >
                      Cancel
                    </button>
                  ) : (
                    <button
                      onClick={() => onEnableAutoRenew(sub.subscriptionId)}
                      className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                    >
                      Auto Renew
                    </button>
                  )}

                  <button
                    onClick={() => onDelete(sub.subscriptionId)}
                    className="text-red-500 hover:text-red-600 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Past Subscriptions</h3>

        {pastSubscriptions.length === 0 ? (
          <p className="text-gray-500 text-sm">No past subscriptions.</p>
        ) : (
          <div className="space-y-4">
            {pastSubscriptions.map((sub) => (
              <div
                key={sub.subscriptionId}
                className="flex justify-between items-center p-4 border rounded-xl bg-gray-50"
              >
                <div>
                  <p className="font-medium text-gray-900">{sub.serviceName}</p>
                  <p className="text-sm text-gray-500">
                    ${sub.cost} • {sub.recurrenceType} • Due: {sub.billingDate}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => onRenew(sub.subscriptionId)}
                    className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                  >
                    Renew
                  </button>

                  <button
                    onClick={() => onDelete(sub.subscriptionId)}
                    className="text-red-500 hover:text-red-600 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
  )
}
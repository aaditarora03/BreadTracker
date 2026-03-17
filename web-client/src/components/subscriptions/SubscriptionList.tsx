/** SubscriptionList Component

Displays:
-List of current subscriptions
-Days remaing untill next payment
-Delete button
-Dynamic button (red, yellow, green) based on how close the billing date is

~ Osbaldo Mota
*/

import { useState, useEffect } from "react";
import type { Subscription } from "../../types/Subscription";
import { getDaysLeftForSubscription } from "../../lib/utils/dateUtils";
import SubscriptionForm from "./SubscriptionForm";

interface Props {
  subscriptions: Subscription[];
  onDelete: (subscriptionId: number) => Promise<void>;
  onAdd: (subscription: Omit<Subscription, "subscriptionId">) => Promise<void>;
  onCancel: (subscriptionId: number) => Promise<void>;
  onEnableAutoRenew: (subscriptionId: number) => Promise<void>;
  onRenew: (subscriptionId: number) => Promise<void>;
}

export default function SubscriptionList({
  subscriptions: initialSubscriptions,
  onDelete,
  onAdd,
  onCancel,
  onEnableAutoRenew,
}: Props) {
  // Single state list for subscriptions
  const [subscriptions, setSubscriptions] =
    useState<Subscription[]>(initialSubscriptions);

  // Keep state synced if the parent prop updates
  useEffect(() => {
    setSubscriptions(initialSubscriptions);
  }, [initialSubscriptions]);

  const parseDateOnly = (dateString: string) => {
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
  };

  const startOfDay = (value: Date) => {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const formatRenewalLabel = (sub: Subscription, daysLeft: number) => {
    const today = startOfDay(new Date());
    const billingDate = startOfDay(parseDateOnly(sub.billingDate));

    const dayText = daysLeft === 1 ? "day" : "days";

    if (billingDate > today) {
      if (sub.autoRenew) {
        return daysLeft <= 0 ? "Starting today" : `Starting in ${daysLeft} ${dayText}`;
      } else {
        return daysLeft <= 0 ? "Ends today" : `Ends in ${daysLeft} ${dayText}`;
      }
    }

    if (daysLeft <= 0) {
      return sub.autoRenew ? "Renews today" : "Expires today";
    }

    return sub.autoRenew
      ? `Renews in ${daysLeft} ${dayText}`
      : `Expires in ${daysLeft} ${dayText}`;
  };

  const getRenewalBadgeColor = (sub: Subscription) => {
    return sub.autoRenew
      ? "bg-emerald-100 text-emerald-700"
      : "bg-yellow-100 text-yellow-700";
  };

  const handleCancel = async (subscriptionId: number) => {
    // Optimistically update the local state to set autoRenew to false
    setSubscriptions((prev) =>
      prev.map((sub) =>
        sub.subscriptionId === subscriptionId
          ? { ...sub, autoRenew: false }
          : sub,
      ),
    );
    // Call the parent onCancel handler
    await onCancel(subscriptionId);
  };

  const handleEnableAutoRenew = async (subscriptionId: number) => {
    // Optionally doing the same for enabling auto renew to keep state perfectly in sync
    setSubscriptions((prev) =>
      prev.map((sub) =>
        sub.subscriptionId === subscriptionId
          ? { ...sub, autoRenew: true }
          : sub,
      ),
    );
    await onEnableAutoRenew(subscriptionId);
  };

  const activeSubscriptions = subscriptions.filter((sub) => sub.autoRenew);
  const pastSubscriptions = subscriptions.filter((sub) => !sub.autoRenew);

  console.log(subscriptions);

  return (
    <div>
      <SubscriptionForm onAdd={onAdd} />

      <div className="rounded-2xl border border-gray-200 bg-white shadow-xl p-6 max-w-3xl mt-6">
        <h2 className="text-xl font-semibold mb-6 text-gray-900">
          Subscriptions
        </h2>

        {activeSubscriptions.length === 0 ? (
          <p className="text-gray-500 text-sm">No subscriptions added yet.</p>
        ) : (
          <div className="space-y-4">
            {activeSubscriptions.map((sub) => {
              const daysLeft = getDaysLeftForSubscription(sub) ?? 0;

              return (
                <div
                  key={sub.subscriptionId}
                  className="flex justify-between items-center p-4 border border-gray-200 rounded-xl bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {sub.serviceName}
                    </p>
                    <p className="text-sm text-gray-500">
                      ${sub.cost.toFixed(2)} • {sub.recurrenceType} • Due:{" "}
                      {sub.billingDate}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${getRenewalBadgeColor(
                        sub,
                      )}`}
                    >
                      {formatRenewalLabel(sub, daysLeft)}
                    </span>

                    {sub.autoRenew ? (
                      <button
                        onClick={() => handleCancel(sub.subscriptionId)}
                        className="text-amber-600 hover:text-amber-700 text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          handleEnableAutoRenew(sub.subscriptionId)
                        }
                        className="text-emerald-600 hover:text-emerald-700 text-sm font-medium transition-colors"
                      >
                        Auto Renew
                      </button>
                    )}

                    <button
                      onClick={() => onDelete(sub.subscriptionId)}
                      className="text-red-500 hover:text-red-600 text-sm font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <h2 className="text-xl font-semibold mt-6 text-gray-900">
          Past Subscriptions
        </h2>
        {pastSubscriptions.length === 0 ? (
          <p className="text-gray-500 text-sm">No past subscriptions found.</p>
        ) : (
          <div className="space-y-4">
            {pastSubscriptions.map((sub) => {
              const daysLeft = getDaysLeftForSubscription(sub) ?? 0;

              return (
                <div
                  key={sub.subscriptionId}
                  className="flex justify-between items-center p-4 border border-gray-200 rounded-xl bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {sub.serviceName}
                    </p>
                    <p className="text-sm text-gray-500">
                      ${sub.cost.toFixed(2)} • {sub.recurrenceType} • Due:{" "}
                      {sub.billingDate}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${getRenewalBadgeColor(
                        sub,
                      )}`}
                    >
                      {formatRenewalLabel(sub, daysLeft)}
                    </span>

                    {sub.autoRenew ? (
                      <button
                        onClick={() => handleCancel(sub.subscriptionId)}
                        className="text-amber-600 hover:text-amber-700 text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          handleEnableAutoRenew(sub.subscriptionId)
                        }
                        className="text-emerald-600 hover:text-emerald-700 text-sm font-medium transition-colors"
                      >
                        Auto Renew
                      </button>
                    )}

                    <button
                      onClick={() => onDelete(sub.subscriptionId)}
                      className="text-red-500 hover:text-red-600 text-sm font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

import type { Subscription } from "../../types/Subscription";
import {
  getDaysLeftFromDate,
  getNextBillingDateForSubscription,
} from "../../lib/utils/dateUtils";

interface Props {
  subscriptions: Subscription[];
}

export default function UpcomingCharges({ subscriptions }: Props) {
  const sorted = subscriptions
    .map((sub) => ({
      sub,
      nextBillingDate: getNextBillingDateForSubscription(sub),
    }))
    .filter(
      (item): item is { sub: Subscription; nextBillingDate: Date } =>
        item.nextBillingDate !== null && item.sub.autoRenew,
    )
    .sort((a, b) => a.nextBillingDate.getTime() - b.nextBillingDate.getTime());

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Upcoming Charges
        </h3>
      </div>

      <div className="space-y-4">
        {sorted.length === 0 ? (
          <p className="text-sm text-gray-500">No upcoming charges.</p>
        ) : (
          sorted.slice(0, 4).map(({ sub, nextBillingDate }) => {
            const daysLeft = getDaysLeftFromDate(nextBillingDate);
            const dayText = daysLeft === 1 ? "day" : "days";
            const dueText =
              daysLeft <= 0 ? "Due today" : `Due in ${daysLeft} ${dayText}`;

            return (
              <div
                key={sub.subscriptionId}
                className="flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-gray-900">{sub.serviceName}</p>
                  <p className="text-sm text-gray-500">{dueText}</p>
                </div>

                <p className="font-semibold text-gray-700">
                  ${sub.cost.toFixed(2)}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

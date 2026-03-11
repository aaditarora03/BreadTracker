import type { Subscription } from "../../types/Subscription"
import { getDaysLeftFromDate, getNextBillingDateForSubscription } from "../../types/utils/dateUtils"

interface Props {
  subscriptions: Subscription[]
}

export default function UpcomingCharges({ subscriptions }: Props) {
  const sorted = subscriptions
    .map((sub) => ({
      sub,
      nextBillingDate: getNextBillingDateForSubscription(sub),
    }))
    .filter((item): item is { sub: Subscription; nextBillingDate: Date } => item.nextBillingDate !== null)
    .sort((a, b) => a.nextBillingDate.getTime() - b.nextBillingDate.getTime())

  return (
    <div className="rounded-2xl border border-violet-300/25 bg-[rgba(24,10,40,0.8)] backdrop-blur-md shadow-[0_14px_35px_rgba(5,0,15,0.45)] p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-violet-50">
          Upcoming Charges
        </h3>
      </div>

      <div className="space-y-4">
        {sorted.slice(0, 4).map(({ sub, nextBillingDate }) => {
          const daysLeft = getDaysLeftFromDate(nextBillingDate)
          const dueText = daysLeft <= 0 ? "Due today" : `Due in ${daysLeft} days`

          return (
            <div
              key={sub.subscriptionId}
              className="flex justify-between items-center"
            >
              <div>
                <p className="font-medium text-violet-50">
                  {sub.serviceName}
                </p>
                <p className="text-sm text-violet-200/80">
                  {dueText}
                </p>
              </div>

              <p className="font-semibold text-violet-100">
                ${sub.cost}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
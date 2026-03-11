import type { Subscription } from "../../types/Subscription"
import { getDaysLeft } from "../../types/utils/dateUtils"

interface Props {
  subscriptions: Subscription[]
}

export default function UpcomingCharges({ subscriptions }: Props) {
  const sorted = [...subscriptions].sort(
    (a, b) =>
      new Date(a.billingDate).getTime() -
      new Date(b.billingDate).getTime()
  )

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Upcoming Charges
        </h3>
      </div>

      <div className="space-y-4">
        {sorted.slice(0, 4).map((sub) => {
          const daysLeft = getDaysLeft(sub.billingDate)

          return (
            <div
              key={sub.subscriptionId}
              className="flex justify-between items-center"
            >
              <div>
                <p className="font-medium text-gray-900">
                  {sub.serviceName}
                </p>
                <p className="text-sm text-gray-500">
                  Due in {daysLeft} days
                </p>
              </div>

              <p className="font-semibold text-gray-800">
                ${sub.cost}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
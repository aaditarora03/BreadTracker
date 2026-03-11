/**
 * WeeklySpendingChart Component
 * 
 * Displays a bar chart of weekly spending based on the user's subscriptions.
 * 
 * Notes:
 * Currently uses front-end-calculated data until we integrate backend
 * ~ Osbaldo Mota
 */


import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import type { Subscription } from "../../types/Subscription"
import { generateSpendingChartData } from "../../types/utils/chartUtils"
import type { SpendingPeriod } from "../../types/utils/financialUtils"

interface Props {
  subscriptions: Subscription[]
  period: SpendingPeriod
}

function getChartTitle(period: SpendingPeriod): string {
  if (period === "monthly") {
    return "Monthly Spending"
  }

  if (period === "yearly") {
    return "Yearly Spending"
  }

  return "Weekly Spending"
}

export default function WeeklySpendingChart({ subscriptions, period }: Props) {
  const data = generateSpendingChartData(subscriptions, period)

  return (
    <div className="rounded-2xl border border-violet-300/25 bg-[rgba(24,10,40,0.8)] backdrop-blur-md shadow-[0_14px_35px_rgba(5,0,15,0.45)] p-6">
      <h3 className="text-lg font-semibold mb-4 text-violet-50">
        {getChartTitle(period)}
      </h3>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="amount" fill="#059669" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
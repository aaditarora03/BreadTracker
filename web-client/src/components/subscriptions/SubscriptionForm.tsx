/** 
 * Subscription Component

Allows users:
-Add a new subscription by entering the service name, cost, and billing date
-Sends new subscription data up to the parent
Notes:
- This is an inline form
~ Osbaldo Mota
*/


import { useState } from "react"
import type { Subscription } from "../../types/Subscription"

interface Props {
  onAdd: (subscription: Omit<Subscription, "subscriptionId">) => Promise<void>
}

export default function SubscriptionForm({ onAdd }: Props) {
  const [name, setName] = useState("")
  const [cost, setCost] = useState("")
  const [billingDate, setBillingDate] = useState("")
  const [recurrenceType, setRecurrenceType] = useState<"weekly" | "monthly" | "yearly">("monthly")
  const [autoRenew, setAutoRenew] = useState(true)

    // Handles form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !cost || !billingDate) return

    const newSubscription: Omit<Subscription, "subscriptionId"> = {
      serviceName: name,
      cost: parseFloat(cost),
      billingDate,
      recurrenceType,
      autoRenew,
      isActive: true,
    }

    await onAdd(newSubscription)

    // Clears form
    setName("")
    setCost("")
    setBillingDate("")
    setRecurrenceType("monthly")
    setAutoRenew(true)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 max-w-3xl"
    >
      <h3 className="text-lg font-semibold mb-4 text-gray-900">
        Add Subscription
      </h3>

      <div className="grid md:grid-cols-4 gap-4">
        <input
          type="text"
          placeholder="Service Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />

        <input
          type="number"
          step="0.01"
          placeholder="Cost"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />

        <input
          type="date"
          value={billingDate}
          onChange={(e) => setBillingDate(e.target.value)}
          className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />

        <select
          value={recurrenceType}
          onChange={(e) => setRecurrenceType(e.target.value as "weekly" | "monthly" | "yearly")}
          className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-white"
        >
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={autoRenew}
          onChange={(e) => setAutoRenew(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        Auto renew
      </label>

      <button
        type="submit"
        className="mt-5 inline-block bg-primary text-white px-3 py-1.5 rounded-lg text-sm hover:bg-primary-dark transition"
      >
        Add Subscription
      </button>
    </form>
  )
}
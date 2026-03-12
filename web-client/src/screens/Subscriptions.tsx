import SubscriptionList from "../components/subscriptions/SubscriptionList";
import { type Subscription } from "../types/Subscription";

interface Props {
  subscriptions: Subscription[];
  onDelete: (id: number) => Promise<void>;
  onAdd: (sub: Omit<Subscription, "subscriptionId">) => Promise<void>;
  onCancel: (id: number) => Promise<void>;
  onEnableAutoRenew: (id: number) => Promise<void>;
  onRenew: (id: number) => Promise<void>;
}

export default function SubscriptionsPage({
  subscriptions,
  onDelete,
  onAdd,
  onCancel,
  onEnableAutoRenew,
  onRenew,
}: Props) {
  return (
    <SubscriptionList
      subscriptions={subscriptions}
      onDelete={onDelete}
      onAdd={onAdd}
      onCancel={onCancel}
      onEnableAutoRenew={onEnableAutoRenew}
      onRenew={onRenew}
    />
  );
}

import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Navbar from "./components/layout/Navbar";
import SubscriptionList from "./components/subscriptions/SubscriptionList";
import type { Subscription } from "./types/Subscription";
import Dashboard from "./screens/Dashboard";
import Login from "./screens/Login";
import Signup from "./screens/Signup";
import ForgotPassword from "./screens/ForgotPassword";
import { useAuth } from "./hooks/useAuth";
import {
  createSubscription,
  deleteSubscription,
  getSubscriptions,
  updateSubscription,
  AuthError,
} from "./api/client";

export default function App() {
  const { auth, signOut } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [budget, setBudget] = useState<number | null>(() => {
    const savedBudget = localStorage.getItem("monthlyBudget");
    if (savedBudget) {
      const parsedBudget = Number(savedBudget);
      if (!Number.isNaN(parsedBudget)) {
        return parsedBudget;
      }
    }
    return null;
  });

  const handleBudgetSave = (nextBudget: number) => {
    setBudget(nextBudget);
    localStorage.setItem("monthlyBudget", String(nextBudget));
  };

  useEffect(() => {
    if (!auth) {
      setSubscriptions([]);
      return;
    }

    const loadSubscriptions = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getSubscriptions(auth.token);
        setSubscriptions(data);
      } catch (requestError) {
        if (requestError instanceof AuthError) {
          void signOut();
        } else {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Failed to load subscriptions",
          );
        }
      } finally {
        setLoading(false);
      }
    };

    void loadSubscriptions();
  }, [auth, signOut]);

  const handleAdd = async (
    newSubscription: Omit<Subscription, "subscriptionId">,
  ) => {
    if (!auth) {
      return;
    }

    try {
      setError(null);
      const created = await createSubscription(auth.token, {
        serviceName: newSubscription.serviceName,
        cost: newSubscription.cost,
        billingDate: newSubscription.billingDate,
        recurrenceType: newSubscription.recurrenceType,
        autoRenew: newSubscription.autoRenew,
      });
      setSubscriptions((prev) => [...prev, created]);
    } catch (requestError) {
      if (requestError instanceof AuthError) {
        void signOut();
      } else {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to add subscription",
        );
      }
    }
  };

  const handleDelete = async (subscriptionId: number) => {
    if (!auth) {
      return;
    }

    try {
      setError(null);
      await deleteSubscription(auth.token, subscriptionId);
      setSubscriptions((prev) =>
        prev.filter((sub) => sub.subscriptionId !== subscriptionId),
      );
    } catch (requestError) {
      if (requestError instanceof AuthError) {
        void signOut();
      } else {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to delete subscription",
        );
      }
    }
  };

  const getNextBillingDate = (
    recurrenceType: Subscription["recurrenceType"],
  ) => {
    const nextDate = new Date();

    if (recurrenceType === "weekly") {
      nextDate.setDate(nextDate.getDate() + 7);
    } else if (recurrenceType === "yearly") {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    } else {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }

    return nextDate.toISOString().slice(0, 10);
  };

  const handleCancel = async (subscriptionId: number) => {
    if (!auth) {
      return;
    }

    try {
      setError(null);
      const updated = await updateSubscription(auth.token, subscriptionId, {
        autoRenew: false,
      });
      setSubscriptions((prev) =>
        prev.map((sub) =>
          sub.subscriptionId === subscriptionId ? updated : sub,
        ),
      );
    } catch (requestError) {
      if (requestError instanceof AuthError) {
        void signOut();
      } else {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to cancel subscription",
        );
      }
    }
  };

  const handleEnableAutoRenew = async (subscriptionId: number) => {
    if (!auth) {
      return;
    }

    try {
      setError(null);
      const updated = await updateSubscription(auth.token, subscriptionId, {
        autoRenew: true,
      });
      setSubscriptions((prev) =>
        prev.map((sub) =>
          sub.subscriptionId === subscriptionId ? updated : sub,
        ),
      );
    } catch (requestError) {
      if (requestError instanceof AuthError) {
        void signOut();
      } else {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to enable auto renew",
        );
      }
    }
  };

  const handleRenew = async (subscriptionId: number) => {
    if (!auth) {
      return;
    }

    const target = subscriptions.find(
      (sub) => sub.subscriptionId === subscriptionId,
    );
    if (!target) {
      return;
    }

    try {
      setError(null);
      const updated = await updateSubscription(auth.token, subscriptionId, {
        autoRenew: true,
        billingDate: getNextBillingDate(target.recurrenceType),
      });
      setSubscriptions((prev) =>
        prev.map((sub) =>
          sub.subscriptionId === subscriptionId ? updated : sub,
        ),
      );
    } catch (requestError) {
      if (requestError instanceof AuthError) {
        void signOut();
      } else {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to renew subscription",
        );
      }
    }
  };

  if (!auth) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <>
      <Navbar budget={budget} onSaveBudget={handleBudgetSave} />

      <Layout>
        {error && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {loading && <p className="mb-4 text-sm text-gray-500">Loading...</p>}

        <Routes>
          <Route
            path="/"
            element={
              <Dashboard subscriptions={subscriptions} budget={budget} />
            }
          />
          <Route
            path="/subscriptions"
            element={
              <SubscriptionList
                subscriptions={subscriptions}
                onDelete={handleDelete}
                onAdd={handleAdd}
                onCancel={handleCancel}
                onEnableAutoRenew={handleEnableAutoRenew}
                onRenew={handleRenew}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </>
  );
}

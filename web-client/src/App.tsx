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

  useEffect(() => {
    const root = document.documentElement;
    let rafId: number | null = null;
    let targetX = 50;
    let targetY = 50;
    let leadX = 50;
    let leadY = 50;
    let trailX = 50;
    let trailY = 50;
    let leadVX = 0;
    let leadVY = 0;
    let trailVX = 0;
    let trailVY = 0;

    const animateCursorGlow = () => {
      // Damped spring motion keeps a liquid feel without harsh snapping.
      leadVX = leadVX * 0.86 + (targetX - leadX) * 0.09;
      leadVY = leadVY * 0.86 + (targetY - leadY) * 0.09;
      leadX += leadVX;
      leadY += leadVY;

      trailVX = trailVX * 0.88 + (leadX - trailX) * 0.08;
      trailVY = trailVY * 0.88 + (leadY - trailY) * 0.08;
      trailX += trailVX;
      trailY += trailVY;

      const pullX = leadX - trailX;
      const pullY = leadY - trailY;
      const pullDistance = Math.min(20, Math.hypot(pullX, pullY));
      const leadSpeed = Math.min(12, Math.hypot(leadVX, leadVY));
      const stretchX = Math.min(1.22, 1 + pullDistance / 60 + leadSpeed / 90);
      const stretchY = Math.max(0.88, 1 - pullDistance / 80);
      const angle = Math.atan2(leadVY, leadVX) * (180 / Math.PI);
      const time = performance.now() / 1000;
      const wobbleStrength = Math.min(
        0.28,
        pullDistance / 95 + leadSpeed / 120,
      );
      const wobbleX = Math.sin(time * 7) * wobbleStrength;
      const wobbleY = Math.cos(time * 6.5) * wobbleStrength;
      const energy = Math.min(0.22, pullDistance / 160 + leadSpeed / 80);

      root.style.setProperty("--cursor-x", `${leadX + wobbleX}%`);
      root.style.setProperty("--cursor-y", `${leadY + wobbleY}%`);
      root.style.setProperty("--cursor-trail-x", `${trailX - wobbleX * 0.5}%`);
      root.style.setProperty("--cursor-trail-y", `${trailY - wobbleY * 0.5}%`);
      root.style.setProperty("--cursor-stretch-x", `${stretchX}`);
      root.style.setProperty("--cursor-stretch-y", `${stretchY}`);
      root.style.setProperty(
        "--cursor-angle",
        `${Number.isFinite(angle) ? angle : 0}deg`,
      );
      root.style.setProperty("--cursor-energy", `${energy}`);

      rafId = window.requestAnimationFrame(animateCursorGlow);
    };

    const handleMouseMove = (event: MouseEvent) => {
      targetX = (event.clientX / window.innerWidth) * 100;
      targetY = (event.clientY / window.innerHeight) * 100;
    };

    window.addEventListener("mousemove", handleMouseMove);
    rafId = window.requestAnimationFrame(animateCursorGlow);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

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

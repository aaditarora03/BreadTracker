// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Dashboard from "./Dashboard";
import type { Subscription } from "../types/Subscription";

vi.mock("../components/ui/Card", () => ({
  default: ({ title, value }: { title: string; value: string }) => (
    <div data-testid={`card-${title}`}>
      <h3>{title}</h3>
      <p>{value}</p>
    </div>
  ),
}));

vi.mock("../components/dashboard/SpendingCalendar", () => ({
  default: ({ subscriptions }: { subscriptions: Subscription[] }) => (
    <div data-testid="spending-calendar">
      Calendar mock - {subscriptions.length} subscriptions
    </div>
  ),
}));

vi.mock("../components/dashboard/WeeklySpendingChart", () => ({
  default: ({ subscriptions }: { subscriptions: Subscription[] }) => (
    <div data-testid="weekly-spending-chart">
      Bar chart mock - {subscriptions.length} subscriptions
    </div>
  ),
}));

vi.mock("../components/dashboard/UpcomingCharges", () => ({
  default: ({ subscriptions }: { subscriptions: Subscription[] }) => (
    <div data-testid="upcoming-charges">
      Upcoming charges mock - {subscriptions.length} subscriptions
    </div>
  ),
}));

const subscriptions: Subscription[] = [
  {
    subscriptionId: 1,
    serviceName: "Netflix",
    cost: 12,
    billingDate: "2026-03-20",
    recurrenceType: "monthly",
    autoRenew: true,
    isActive: true,
  },
  {
    subscriptionId: 2,
    serviceName: "Gym",
    cost: 120,
    billingDate: "2026-03-25",
    recurrenceType: "yearly",
    autoRenew: true,
    isActive: true,
  },
  {
    subscriptionId: 3,
    serviceName: "News+",
    cost: 6,
    billingDate: "2026-03-14",
    recurrenceType: "weekly",
    autoRenew: true,
    isActive: true,
  },
];

describe("Dashboard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-12T12:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the dashboard overview and default calendar view", () => {
    render(<Dashboard subscriptions={subscriptions} budget={200} />);

    expect(
      screen.getByRole("heading", { name: /dashboard overview/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/here’s a summary of your financial activity/i),
    ).toBeInTheDocument();

    expect(screen.getByTestId("spending-calendar")).toBeInTheDocument();
    expect(
      screen.queryByTestId("weekly-spending-chart"),
    ).not.toBeInTheDocument();
  });

  it("switches from calendar display to bar chart display", () => {
    render(<Dashboard subscriptions={subscriptions} budget={200} />);

    const displaySelect = screen.getByLabelText(/display/i);
    fireEvent.change(displaySelect, { target: { value: "bar" } });

    expect(screen.getByTestId("weekly-spending-chart")).toBeInTheDocument();
    expect(screen.queryByTestId("spending-calendar")).not.toBeInTheDocument();
  });

  it("shows the calculated dashboard metric cards", () => {
    render(<Dashboard subscriptions={subscriptions} budget={200} />);

    expect(
      screen.getByTestId("card-Monthly Subscription Cost"),
    ).toHaveTextContent("$48.00");

    expect(screen.getByTestId("card-Active Subscriptions")).toHaveTextContent(
      "3",
    );

    expect(screen.getByTestId("card-Upcoming Charges")).toHaveTextContent(
      "$138.00",
    );

    expect(screen.getByTestId("card-Monthly Budget")).toHaveTextContent(
      "$200.00",
    );
  });
});

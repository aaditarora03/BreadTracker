// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

vi.mock("./hooks/useAuth", () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  }),
}));

const renderApp = () =>
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );

describe("App", () => {
  it("renders the login page heading", () => {
    renderApp();
    expect(
      screen.getByRole("heading", { name: /breadtracker/i }),
    ).toBeInTheDocument();
  });

  it("renders the login button", () => {
    renderApp();
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
  });

  it("renders the email input", () => {
    renderApp();
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
  });

  it("renders the password input", () => {
    renderApp();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
  });

  it("renders the sign up link", () => {
    renderApp();
    expect(
      screen.getByRole("link", { name: /need an account\? sign up/i }),
    ).toBeInTheDocument();
  });
});

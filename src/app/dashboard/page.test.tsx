import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("~/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("~/components/LogoutButton", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <button>{children}</button>
  ),
}));

const mockAuth = vi.mocked(await import("~/lib/auth")).auth;

describe("DashboardPage", () => {
  it("renders dashboard for authenticated user", async () => {
    mockAuth.mockResolvedValue({
      user: {
        id: "1",
        name: "Test User",
        email: "test@example.com",
        role: "USER",
        emailVerified: true,
      },
      expires: "2024-01-01",
    });

    const DashboardPage = (await import("./page")).default;
    render(await DashboardPage());

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Bienvenue, Test User !")).toBeInTheDocument();
    expect(screen.getByText("Email: test@example.com")).toBeInTheDocument();
    expect(screen.getByText("Rôle: USER")).toBeInTheDocument();
    expect(screen.getByText("Email vérifié: Oui")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Se déconnecter" }),
    ).toBeInTheDocument();
  });

  it("shows unverified email status", async () => {
    mockAuth.mockResolvedValue({
      user: {
        id: "1",
        name: "Test User",
        email: "test@example.com",
        role: "USER",
        emailVerified: false,
      },
      expires: "2024-01-01",
    });

    const DashboardPage = (await import("./page")).default;
    render(await DashboardPage());

    expect(screen.getByText("Email vérifié: Non")).toBeInTheDocument();
  });
});

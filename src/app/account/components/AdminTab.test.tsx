import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { useSession } from "next-auth/react";
import AdminTab from "./AdminTab";

// Mock the CSS module
vi.mock("./AdminTab.module.scss", () => ({
  default: {
    adminTab: "adminTab",
    adminTab__title: "adminTab__title",
    adminTab__description: "adminTab__description",
    adminTab__section: "adminTab__section",
    adminTab__mainButton: "adminTab__mainButton",
    adminTab__sectionTitle: "adminTab__sectionTitle",
    adminTab__shortcuts: "adminTab__shortcuts",
    adminTab__shortcutLink: "adminTab__shortcutLink",
  },
}));

// Mock useSession
const mockUseSession = vi.mocked(useSession);

describe("AdminTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders admin tab for admin users", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: "1", email: "admin@example.com", role: "ADMIN" },
        expires: "2024-01-01",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    render(<AdminTab />);

    expect(screen.getByText("Administration")).toBeInTheDocument();
    expect(
      screen.getByText("Accès au panel d administration"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Accéder au tableau de bord admin"),
    ).toBeInTheDocument();
    expect(screen.getByText("Gestion des utilisateurs")).toBeInTheDocument();
    expect(screen.getByText("Gestion des produits")).toBeInTheDocument();
  });

  it("does not render for non-admin users", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: "1", email: "user@example.com", role: "USER" },
        expires: "2024-01-01",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    const { container } = render(<AdminTab />);

    expect(container.firstChild).toBeNull();
  });

  it("does not render when no session", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: vi.fn(),
    });

    const { container } = render(<AdminTab />);

    expect(container.firstChild).toBeNull();
  });

  it("has correct admin dashboard link", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: "1", email: "admin@example.com", role: "ADMIN" },
        expires: "2024-01-01",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    render(<AdminTab />);

    const dashboardLink = screen.getByText("Accéder au tableau de bord admin");
    expect(dashboardLink).toHaveAttribute("href", "/admin");
  });

  it("has correct shortcut links", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: "1", email: "admin@example.com", role: "ADMIN" },
        expires: "2024-01-01",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    render(<AdminTab />);

    const usersLink = screen.getByText("Gestion des utilisateurs");
    const productsLink = screen.getByText("Gestion des produits");

    expect(usersLink).toHaveAttribute("href", "/admin/users");
    expect(productsLink).toHaveAttribute("href", "/admin/products");
  });
});

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Header from "./Header";

vi.mock("next-auth/react");
vi.mock("next/navigation");
vi.mock("~/components/LogoutButton", () => ({
  default: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <button className={className}>{children}</button>,
}));

vi.mock("~/../public/assets/cart.svg", () => ({
  default: { src: "/assets/cart.svg" },
}));

vi.mock("~/../public/assets/logo.svg", () => ({
  default: { src: "/assets/logo.svg" },
}));

vi.mock("~/../public/assets/search.svg", () => ({
  default: { src: "/assets/search.svg" },
}));

vi.mock("./Header.css", () => ({}));

const mockUseSession = vi.mocked(useSession);
const mockUsePathname = vi.mocked(usePathname);

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue("/");
  });

  it("renders header with logo and navigation", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: vi.fn(),
    });

    render(<Header />);

    expect(screen.getByAltText("Lyon Beton")).toBeInTheDocument();
    expect(screen.getByText("Boutique")).toBeInTheDocument();
    expect(screen.getByAltText("Search")).toBeInTheDocument();
    expect(screen.getByAltText("Cart")).toBeInTheDocument();
  });

  it("shows login/register links when not authenticated", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: vi.fn(),
    });

    render(<Header />);

    expect(screen.getByText("Se Connecter")).toBeInTheDocument();
    expect(screen.getByText("S inscrire")).toBeInTheDocument();
    expect(screen.queryByText("Mon Compte")).not.toBeInTheDocument();
  });

  it("shows account links when authenticated", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: "1", email: "test@example.com" },
        expires: "2024-01-01",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    render(<Header />);

    expect(screen.getByText("Mon Compte")).toBeInTheDocument();
    expect(screen.getByText("Se déconnecter")).toBeInTheDocument();
    expect(screen.queryByText("Se Connecter")).not.toBeInTheDocument();
    expect(screen.queryByText("S inscrire")).not.toBeInTheDocument();
  });

  it("toggles search input visibility", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: vi.fn(),
    });

    render(<Header />);

    const searchIcon = screen.getByAltText("Search").parentElement;
    const searchInput = screen.getByPlaceholderText("Rechercher...");

    expect(searchInput).not.toHaveClass("header__actions-input--visible");

    if (searchIcon) {
      fireEvent.click(searchIcon);
    }

    expect(searchInput).toHaveClass("header__actions-input--visible");
  });

  it("has correct navigation links", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: vi.fn(),
    });

    render(<Header />);

    const shopLink = screen.getByText("Boutique").closest("a");
    const logoLink = screen.getByAltText("Lyon Beton").closest("a");
    const cartLink = screen.getByAltText("Cart").closest("a");
    const loginLink = screen.getByText("Se Connecter").closest("a");

    expect(shopLink).toHaveAttribute("href", "/products");
    expect(logoLink).toHaveAttribute("href", "/");
    expect(cartLink).toHaveAttribute("href", "/cart");
    expect(loginLink).toHaveAttribute("href", "/login");
  });

  it("handles different pathnames correctly", () => {
    mockUsePathname.mockReturnValue("/products");
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: vi.fn(),
    });

    render(<Header />);

    const header = screen.getByRole("banner");
    expect(header).toHaveClass("header--visible");
  });
});

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { useSession } from "next-auth/react";
import Hero from "./Hero";

vi.mock("./Hero.module.scss", () => ({
  default: {
    hero: "hero",
    videoContainer: "videoContainer",
    video: "video",
    overlay: "overlay",
    content: "content",
    titleContainer: "titleContainer",
    mainTitle: "mainTitle",
    navigation: "navigation",
    navContainer: "navContainer",
    navItem: "navItem",
    collectionsGrid: "collectionsGrid",
    collectionItem: "collectionItem",
    category: "category",
    collectionName: "collectionName",
  },
}));

const mockUseSession = vi.mocked(useSession);

describe("Hero", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with default props", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: vi.fn(),
    });

    render(<Hero />);

    expect(screen.getByText("LYON BETON")).toBeInTheDocument();
    expect(screen.getByText("BOUTIQUE")).toBeInTheDocument();
    expect(screen.getByText("PANIER")).toBeInTheDocument();
  });

  it("shows login link when not authenticated", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: vi.fn(),
    });

    render(<Hero />);

    const loginLink = screen.getByText("SE CONNECTER");
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.closest("a")).toHaveAttribute("href", "/login");
  });

  it("shows account link when authenticated", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: "1", email: "test@example.com" },
        expires: "2024-01-01",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    render(<Hero />);

    const accountLink = screen.getByText("COMPTE");
    expect(accountLink).toBeInTheDocument();
    expect(accountLink.closest("a")).toHaveAttribute("href", "/account");
  });

  it("renders default collections", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: vi.fn(),
    });

    render(<Hero />);

    expect(screen.getByText("BERKSHIRE")).toBeInTheDocument();
    expect(screen.getByText("NEW DICE")).toBeInTheDocument();
    expect(screen.getAllByText("PROJETS")).toHaveLength(3);
    expect(screen.getAllByText("COLLECTIONS")).toHaveLength(2);
  });

  it("renders custom props correctly", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: vi.fn(),
    });

    const customProps = {
      title: "Custom Title",
      navigation: [{ label: "Custom Nav", href: "/custom" }],
      collections: [{ name: "Custom Collection", category: "Custom Category" }],
    };

    render(<Hero {...customProps} />);

    expect(screen.getByText("Custom Title")).toBeInTheDocument();
    expect(screen.getByText("Custom Nav")).toBeInTheDocument();
    expect(screen.getByText("Custom Collection")).toBeInTheDocument();
    expect(screen.getByText("Custom Category")).toBeInTheDocument();
  });

  it("renders video element", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: vi.fn(),
    });

    render(<Hero />);

    const video = document.querySelector("video");
    expect(video).toBeInTheDocument();
    expect(video).toHaveProperty("autoplay", true);
    expect(video).toHaveProperty("loop", true);
    expect(video).toHaveProperty("preload", "auto");
  });

  it("has correct navigation links", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: vi.fn(),
    });

    render(<Hero />);

    const boutiqueLink = screen.getByText("BOUTIQUE").closest("a");
    const panierLink = screen.getByText("PANIER").closest("a");

    expect(boutiqueLink).toHaveAttribute("href", "/products");
    expect(panierLink).toHaveAttribute("href", "/cart");
  });
});

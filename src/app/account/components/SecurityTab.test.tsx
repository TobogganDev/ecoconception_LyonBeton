import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useSession } from "next-auth/react";
import SecurityTab from "./SecurityTab";

vi.mock("./SecurityTab.module.scss", () => ({
  default: {
    securityTab: "securityTab",
    securityTab__title: "securityTab__title",
    securityTab__section: "securityTab__section",
    securityTab__sectionTitle: "securityTab__sectionTitle",
    securityTab__emailInfo: "securityTab__emailInfo",
    securityTab__status: "securityTab__status",
    "securityTab__status--verified": "securityTab__status--verified",
    "securityTab__status--unverified": "securityTab__status--unverified",
    securityTab__verifyButton: "securityTab__verifyButton",
    securityTab__link: "securityTab__link",
    securityTab__form: "securityTab__form",
    securityTab__field: "securityTab__field",
    securityTab__label: "securityTab__label",
    securityTab__input: "securityTab__input",
    securityTab__error: "securityTab__error",
    securityTab__passwordButton: "securityTab__passwordButton",
  },
}));

vi.mock("~/trpc/react", () => ({
  api: {
    account: {
      changePassword: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
        })),
      },
    },
    auth: {
      requestEmailVerification: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
        })),
      },
    },
  },
}));

const mockUseSession = vi.mocked(useSession);

describe("SecurityTab", () => {
  const mockProps = {
    onMessage: vi.fn(),
    isLoading: false,
    setIsLoading: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders security tab with verified email", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: "1", email: "test@example.com", emailVerified: true },
        expires: "2024-01-01",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    render(<SecurityTab {...mockProps} />);

    expect(screen.getByText("Sécurité")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    expect(screen.getByText("Vérifié")).toBeInTheDocument();
    expect(
      screen.queryByText("Re-envoyer email de vérification"),
    ).not.toBeInTheDocument();
  });

  it("renders security tab with unverified email", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: "1", email: "test@example.com", emailVerified: false },
        expires: "2024-01-01",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    render(<SecurityTab {...mockProps} />);

    expect(screen.getByText("Non vérifié")).toBeInTheDocument();
    expect(
      screen.getByText("Re-envoyer email de vérification"),
    ).toBeInTheDocument();
  });

  it("renders password change form", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: "1", email: "test@example.com", emailVerified: true },
        expires: "2024-01-01",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    render(<SecurityTab {...mockProps} />);

    expect(screen.getByLabelText("Mot de passe actuel")).toBeInTheDocument();
    expect(screen.getByLabelText("Nouveau mot de passe")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Confirmer le nouveau mot de passe"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Changer le mot de passe" }),
    ).toBeInTheDocument();
  });

  it("renders 2FA link", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: "1", email: "test@example.com", emailVerified: true },
        expires: "2024-01-01",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    render(<SecurityTab {...mockProps} />);

    const twoFactorLink = screen.getByText("Ajouter 2FA");
    expect(twoFactorLink).toBeInTheDocument();
    expect(twoFactorLink).toHaveAttribute(
      "href",
      "/account/security/two-factor",
    );
  });

  it("shows loading state when isLoading is true", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: "1", email: "test@example.com", emailVerified: false },
        expires: "2024-01-01",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    render(<SecurityTab {...mockProps} isLoading={true} />);

    expect(screen.getByText("Envoi...")).toBeInTheDocument();
    expect(screen.getByText("Changement...")).toBeInTheDocument();
  });

  it("handles password form input changes", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: "1", email: "test@example.com", emailVerified: true },
        expires: "2024-01-01",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    render(<SecurityTab {...mockProps} />);

    const currentPasswordInput = screen.getByLabelText("Mot de passe actuel");
    fireEvent.change(currentPasswordInput, { target: { value: "oldpass" } });

    expect(currentPasswordInput).toHaveValue("oldpass");
  });
});

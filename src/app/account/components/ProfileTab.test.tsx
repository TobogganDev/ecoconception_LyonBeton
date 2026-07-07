import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useSession } from "next-auth/react";
import ProfileTab from "./ProfileTab";

vi.mock("./ProfileTab.module.scss", () => ({
  default: {
    profileTab: "profileTab",
    profileTab__title: "profileTab__title",
    profileTab__form: "profileTab__form",
    profileTab__field: "profileTab__field",
    profileTab__label: "profileTab__label",
    profileTab__input: "profileTab__input",
    profileTab__error: "profileTab__error",
    profileTab__button: "profileTab__button",
  },
}));

vi.mock("~/trpc/react", () => ({
  api: {
    useUtils: () => ({
      account: {
        getProfile: {
          invalidate: vi.fn(),
        },
      },
    }),
    account: {
      getProfile: {
        useQuery: vi.fn(() => ({
          data: { name: "Test User" },
        })),
      },
      updateProfile: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
        })),
      },
    },
  },
}));

const mockUseSession = vi.mocked(useSession);

describe("ProfileTab", () => {
  const mockProps = {
    onMessage: vi.fn(),
    isLoading: false,
    setIsLoading: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSession.mockReturnValue({
      data: {
        user: { id: "1", email: "test@example.com", name: "Test User" },
        expires: "2024-01-01",
      },
      status: "authenticated",
      update: vi.fn(),
    });
  });

  it("renders profile form", () => {
    render(<ProfileTab {...mockProps} />);

    expect(screen.getByText("Info Profil")).toBeInTheDocument();
    expect(screen.getByLabelText("Nom")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Mettre à jour le profil" }),
    ).toBeInTheDocument();
  });

  it("shows loading state when isLoading is true", () => {
    render(<ProfileTab {...mockProps} isLoading={true} />);

    expect(
      screen.getByRole("button", { name: "Mise à jour..." }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("handles form input changes", () => {
    render(<ProfileTab {...mockProps} />);

    const nameInput = screen.getByLabelText("Nom");
    fireEvent.change(nameInput, { target: { value: "New Name" } });

    expect(nameInput).toHaveValue("New Name");
  });

  it("accepts props correctly", () => {
    const { rerender } = render(<ProfileTab {...mockProps} />);

    expect(screen.getByRole("button")).not.toBeDisabled();

    rerender(<ProfileTab {...mockProps} isLoading={true} />);

    expect(screen.getByRole("button")).toBeDisabled();
  });
});

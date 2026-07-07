import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { signOut } from "next-auth/react";
import LogoutButton from "./LogoutButton";

// Mock signOut
vi.mocked(signOut).mockImplementation(() => Promise.resolve(undefined));

describe("LogoutButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with default text", () => {
    render(<LogoutButton />);
    expect(
      screen.getByRole("button", { name: "Se déconnecter" }),
    ).toBeInTheDocument();
  });

  it("renders with custom children", () => {
    render(<LogoutButton>Custom Logout</LogoutButton>);
    expect(
      screen.getByRole("button", { name: "Custom Logout" }),
    ).toBeInTheDocument();
  });

  it("calls signOut when clicked", () => {
    render(<LogoutButton />);
    fireEvent.click(screen.getByRole("button"));
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: "/" });
  });

  it("handles keyboard events", () => {
    render(<LogoutButton />);
    const button = screen.getByRole("button");

    fireEvent.keyDown(button, { key: "Enter", code: "Enter" });
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: "/" });

    vi.clearAllMocks();

    fireEvent.keyDown(button, { key: " ", code: "Space" });
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: "/" });
  });

  it("forwards props correctly", () => {
    render(<LogoutButton data-testid="logout-btn" disabled />);
    const button = screen.getByTestId("logout-btn");
    expect(button).toBeDisabled();
  });

  it("applies custom className", () => {
    render(<LogoutButton className="custom-class" />);
    expect(screen.getByRole("button")).toHaveClass("custom-class");
  });
});

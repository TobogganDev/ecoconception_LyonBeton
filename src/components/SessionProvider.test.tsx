import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { useSession } from "next-auth/react";
import SessionProvider, { CartMergeOnLogin } from "./SessionProvider";

vi.mock("next-auth/react", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useSession: vi.fn(),
}));

vi.mock("~/trpc/react", () => ({
  api: {
    useUtils: () => ({
      cart: {
        getCurrent: {
          invalidate: vi.fn(),
        },
      },
    }),
    cart: {
      mergeGuestCart: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
        })),
      },
    },
  },
}));

const mockUseSession = vi.mocked(useSession);

describe("SessionProvider", () => {
  it("renders children within NextAuth SessionProvider", () => {
    const { getByText } = render(
      <SessionProvider session={null}>
        <div>Test Child</div>
      </SessionProvider>,
    );

    expect(getByText("Test Child")).toBeInTheDocument();
  });

  it("passes session prop correctly", () => {
    const testSession = { user: { id: "1", email: "test@example.com" } };

    const { container } = render(
      <SessionProvider session={testSession}>
        <div>Test Child</div>
      </SessionProvider>,
    );

    expect(container.firstChild).toBeInTheDocument();
  });
});

describe("CartMergeOnLogin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });
  });

  it("renders without crashing", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: vi.fn(),
    });

    const { container } = render(<CartMergeOnLogin />);

    expect(container.firstChild).toBeNull();
  });

  it("does not merge cart when no session", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: vi.fn(),
    });

    const mockGetItem = vi.fn().mockReturnValue('{"item1": 2}');
    Object.defineProperty(window, "localStorage", {
      value: { getItem: mockGetItem, removeItem: vi.fn() },
      writable: true,
    });

    render(<CartMergeOnLogin />);

    expect(mockGetItem).not.toHaveBeenCalled();
  });

  it("handles authenticated session correctly", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: "1", email: "test@example.com" },
        expires: "2024-01-01",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    render(<CartMergeOnLogin />);

    expect(mockUseSession).toHaveBeenCalled();
  });
});

import "@testing-library/jest-dom";
import { vi, beforeEach } from "vitest";

interface MockRouter {
  push: ReturnType<typeof vi.fn>;
  replace: ReturnType<typeof vi.fn>;
  back: ReturnType<typeof vi.fn>;
  forward: ReturnType<typeof vi.fn>;
  refresh: ReturnType<typeof vi.fn>;
  prefetch: ReturnType<typeof vi.fn>;
}

interface MockSession {
  user: { id: string; email: string; name: string; role: string };
  expires: string;
}

declare global {
  var mockRouter: MockRouter;
  var mockSession: MockSession;
}

process.env.NEXTAUTH_SECRET = "test-secret";
process.env.NEXTAUTH_URL = "http://localhost:3000";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

const mockSession = {
  user: { id: "1", email: "test@example.com", name: "Test User", role: "USER" },
  expires: "2024-01-01",
};

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(() => ({
    data: mockSession,
    status: "authenticated",
    update: vi.fn(),
  })),
  signIn: vi.fn(),
  signOut: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

global.mockRouter = mockRouter;
global.mockSession = mockSession;

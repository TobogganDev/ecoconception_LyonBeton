import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useRequireAuth } from "./useRequireAuth";

describe("useRequireAuth", () => {
  it("returns correct structure", () => {
    const { result } = renderHook(() => useRequireAuth());

    expect(result.current).toHaveProperty("session");
    expect(result.current).toHaveProperty("isLoading");
    expect(result.current).toHaveProperty("authenticated");
    expect(typeof result.current.isLoading).toBe("boolean");
    expect(typeof result.current.authenticated).toBe("boolean");
  });

  it("can be called with custom redirect", () => {
    const { result } = renderHook(() => useRequireAuth("/custom-login"));

    expect(result.current).toHaveProperty("session");
    expect(result.current).toHaveProperty("isLoading");
    expect(result.current).toHaveProperty("authenticated");
  });

  it("can be called with options", () => {
    const { result } = renderHook(() =>
      useRequireAuth("/login", { requireAdmin: true }),
    );

    expect(result.current).toHaveProperty("session");
    expect(result.current).toHaveProperty("isLoading");
    expect(result.current).toHaveProperty("authenticated");
  });
});

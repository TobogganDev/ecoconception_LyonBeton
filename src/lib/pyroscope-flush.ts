import { after } from "next/server";

/**
 * `@pyroscope/nodejs` exports profiles on a background timer (default 60s).
 * On Vercel, the serverless function is frozen between requests, so that
 * timer rarely gets CPU time to fire — profiles are captured but never sent.
 * `after()` runs once the response has been sent, so we use it to force a
 * stop/restart of the profiler, which flushes whatever was captured during
 * this request before the function freezes again.
 */
let flushing: Promise<void> | null = null;

export function schedulePyroscopeFlush() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const profilingEnabled =
    process.env.NODE_ENV === "production" ||
    process.env.ENABLE_PROFILING === "true";
  if (!profilingEnabled || !process.env.PYROSCOPE_SERVER_ADDRESS) return;

  try {
    after(async () => {
      if (flushing) return;
      flushing = flushOnce();
      try {
        await flushing;
      } finally {
        flushing = null;
      }
    });
  } catch {
    // after() throws when called outside a request context (e.g. at build time).
  }
}

async function flushOnce() {
  try {
    const Pyroscope = (await import("@pyroscope/nodejs")).default;
    await Pyroscope.stop();
    Pyroscope.start();
  } catch (err) {
    console.error("[pyroscope] Failed to flush profile:", err);
  }
}

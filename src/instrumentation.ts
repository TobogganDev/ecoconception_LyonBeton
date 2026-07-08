/**
 * Next.js instrumentation hook. `register()` runs once when the server process
 * boots (App Router, Next.js 15). We use it to start Pyroscope continuous
 * profiling against Grafana Cloud.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  // `@pyroscope/nodejs` relies on native addons and only works in the Node.js
  // runtime — bail out for the Edge runtime (middleware, edge routes).
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const profilingEnabled =
    process.env.NODE_ENV === "production" ||
    process.env.ENABLE_PROFILING === "true";
  if (!profilingEnabled) return;

  const serverAddress = process.env.PYROSCOPE_SERVER_ADDRESS;
  if (!serverAddress) {
    console.warn(
      "[pyroscope] Profiling enabled but PYROSCOPE_SERVER_ADDRESS is not set — skipping.",
    );
    return;
  }

  // Import lazily so the profiler (and its native deps) is never pulled into
  // the Edge bundle.
  const Pyroscope = (await import("@pyroscope/nodejs")).default;

  Pyroscope.init({
    serverAddress,
    // v1.x API: tenantID + authToken instead of basicAuthUser + basicAuthPassword
    tenantID: process.env.PYROSCOPE_BASIC_AUTH_USER,
    authToken: process.env.PYROSCOPE_AUTH_TOKEN,
    appName: process.env.PYROSCOPE_APPLICATION_NAME ?? "lyon-beton-backend",
    tags: { env: process.env.NODE_ENV ?? "development" },
  });

  console.info(
    "[pyroscope] tenantID set:", !!process.env.PYROSCOPE_BASIC_AUTH_USER,
    "token set:", !!process.env.PYROSCOPE_AUTH_TOKEN,
  );

  try {
    Pyroscope.start();
    console.info("[pyroscope] Continuous profiling started.");
  } catch (err) {
    console.error("[pyroscope] Failed to start profiling:", err);
  }
}
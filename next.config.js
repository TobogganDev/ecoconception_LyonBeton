/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/**
 * Stratégie de cache HTTP (Vercel Edge Network).
 *
 * PUBLIC : catalogue sans données personnelles. On autorise le CDN à mettre en
 * cache la réponse pendant 1 h (`s-maxage=3600`) et à continuer de servir la
 * version périmée pendant 24 h le temps de la régénérer en arrière-plan
 * (`stale-while-revalidate=86400`). Résultat attendu : `x-vercel-cache: HIT`.
 *
 * PRIVATE : tout ce qui dépend de la session. `private` interdit tout cache
 * partagé (CDN/proxy) et `no-store` interdit même le cache navigateur : la
 * réponse d'un utilisateur ne peut jamais être servie à un autre.
 * Résultat attendu : `x-vercel-cache: MISS` (jamais de HIT).
 */
const PUBLIC_CACHE_CONTROL =
  "public, s-maxage=3600, stale-while-revalidate=86400";
const PRIVATE_CACHE_CONTROL = "private, no-store";

/** @type {import("next").NextConfig} */
const config = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/ddlod4evf/**",
      },
    ],
  },

  async headers() {
    return [
      // --- Routes publiques : cache CDN agressif ---
      {
        source: "/products",
        headers: [{ key: "Cache-Control", value: PUBLIC_CACHE_CONTROL }],
      },
      {
        // /product/[id] : fiche produit
        source: "/product/:id*",
        headers: [{ key: "Cache-Control", value: PUBLIC_CACHE_CONTROL }],
      },

      // --- Routes privées : jamais de cache partagé ---
      {
        source: "/cart",
        headers: [{ key: "Cache-Control", value: PRIVATE_CACHE_CONTROL }],
      },
      {
        source: "/account/:path*",
        headers: [{ key: "Cache-Control", value: PRIVATE_CACHE_CONTROL }],
      },
      {
        source: "/orders/:path*",
        headers: [{ key: "Cache-Control", value: PRIVATE_CACHE_CONTROL }],
      },
      {
        source: "/dashboard/:path*",
        headers: [{ key: "Cache-Control", value: PRIVATE_CACHE_CONTROL }],
      },
      {
        source: "/checkout/:path*",
        headers: [{ key: "Cache-Control", value: PRIVATE_CACHE_CONTROL }],
      },
      {
        source: "/admin/:path*",
        headers: [{ key: "Cache-Control", value: PRIVATE_CACHE_CONTROL }],
      },
    ];
  },
};

export default config;

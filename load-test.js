import http from "k6/http";
import { check } from "k6";
import { Trend, Rate, Counter } from "k6/metrics";

// -----------------------------------------------------------------------------
// Test de charge k6 pour la route /api/benchmark (Lyon Béton).
//
// Objectif : comparer les performances de la route AVANT et APRÈS mise en cache.
// La route expose deux niveaux de cache (LRU applicatif via le header X-Cache,
// et CDN via Cache-Control). La 1ʳᵉ requête recalcule le payload (X-Cache: MISS)
// puis les suivantes sont servies depuis le cache (X-Cache: HIT).
//
// Le test enchaîne DEUX phases identiques (même profil de charge) afin de
// pouvoir comparer les métriques :
//   - Phase 1 "avant cache" : le cache est froid, on subit les MISS coûteux.
//   - Phase 2 "après cache" : le cache est chaud, on mesure les HIT.
//
// Chaque phase : 50 VUs pendant 30 s avec une rampe progressive.
//
// Usage :
//   BASE_URL=http://localhost:3000 k6 run load-test.js
//   (BASE_URL par défaut : http://localhost:3000)
// -----------------------------------------------------------------------------

const BASE_URL = (__ENV.BASE_URL || "http://localhost:3000").replace(
  /\/+$/,
  "",
);
const TARGET = `${BASE_URL}/api/benchmark`;

// Profil de charge commun aux deux phases : rampe montante jusqu'à 50 VUs,
// palier, puis rampe descendante. Durée utile ~30 s par phase.
const RAMP_STAGES = [
  { duration: "10s", target: 50 }, // rampe progressive de 0 -> 50 VUs
  { duration: "15s", target: 50 }, // palier à 50 VUs
  { duration: "5s", target: 0 }, // descente à 0
];

// Métriques personnalisées, étiquetées par phase pour la comparaison.
const respTime = new Trend("phase_response_time", true);
const errorRate = new Rate("phase_error_rate");
const cacheHits = new Counter("phase_cache_hits");
const cacheMisses = new Counter("phase_cache_misses");

export const options = {
  // Sends results to Grafana Cloud k6 when run with `k6 run -o cloud`.
  // Requires K6_CLOUD_TOKEN (from `k6 cloud login` or the Grafana Cloud
  // portal) and the k6 Cloud app enabled on the Grafana Cloud stack.
  cloud: {
    name: "lyon-beton-benchmark",
    ...(__ENV.K6_CLOUD_PROJECT_ID
      ? { projectID: Number(__ENV.K6_CLOUD_PROJECT_ID) }
      : {}),
  },
  scenarios: {
    // Phase 1 : cache froid -> majorité de MISS.
    avant_cache: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: RAMP_STAGES,
      startTime: "0s",
      tags: { phase: "avant_cache" },
      env: { PHASE: "avant_cache" },
    },
    // Phase 2 : démarre après la fin complète de la phase 1 (30 s + marge).
    // Configuration strictement identique pour une comparaison équitable.
    apres_cache: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: RAMP_STAGES,
      startTime: "35s",
      tags: { phase: "apres_cache" },
      env: { PHASE: "apres_cache" },
    },
  },
  thresholds: {
    // Seuils indicatifs : p95 du temps de réponse et taux d'erreur global.
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.01"],
    // Suivi par phase : ces seuils sont volontairement non-bloquants (toujours
    // vrais). Ils servent à FORCER la création des sous-métriques taguées afin
    // qu'elles soient disponibles dans handleSummary pour la comparaison.
    "phase_response_time{phase:avant_cache}": ["p(95)>=0"],
    "phase_response_time{phase:apres_cache}": ["p(95)>=0"],
    "phase_error_rate{phase:avant_cache}": ["rate>=0"],
    "phase_error_rate{phase:apres_cache}": ["rate>=0"],
    "phase_cache_hits{phase:avant_cache}": ["count>=0"],
    "phase_cache_hits{phase:apres_cache}": ["count>=0"],
    "phase_cache_misses{phase:avant_cache}": ["count>=0"],
    "phase_cache_misses{phase:apres_cache}": ["count>=0"],
  },
};

export default function () {
  const phase = __ENV.PHASE || "inconnue";

  const res = http.get(TARGET, { tags: { phase } });

  const cacheHeader = res.headers["X-Cache"];

  // Checks k6 : status HTTP 200 et présence du header X-Cache.
  check(
    res,
    {
      "status is 200": (r) => r.status === 200,
      "header X-Cache present": (r) => r.headers["X-Cache"] !== undefined,
    },
    { phase },
  );

  // Alimentation des métriques personnalisées, taguées par phase.
  respTime.add(res.timings.duration, { phase });
  errorRate.add(res.status !== 200, { phase });

  if (cacheHeader === "HIT") {
    cacheHits.add(1, { phase });
  } else if (cacheHeader === "MISS") {
    cacheMisses.add(1, { phase });
  }
}

// -----------------------------------------------------------------------------
// Résumé personnalisé : affiche pour chaque phase le p95, le RPS et le taux
// d'erreur, afin de comparer directement "avant cache" vs "après cache".
// -----------------------------------------------------------------------------
export function handleSummary(data) {
  const lines = [];
  lines.push("");
  lines.push("========================================================");
  lines.push("  COMPARAISON /api/benchmark : avant vs après cache");
  lines.push("========================================================");

  for (const phase of ["avant_cache", "apres_cache"]) {
    const p95 = metricValue(data, "phase_response_time", `p(95)`, phase);
    const count = metricCount(data, "phase_response_time", phase);
    const errRate = metricValue(data, "phase_error_rate", "rate", phase);
    const hits = metricCount(data, "phase_cache_hits", phase);
    const misses = metricCount(data, "phase_cache_misses", phase);

    // RPS estimé sur la durée utile de la phase (~30 s).
    const durationSec = 30;
    const rps = count != null ? count / durationSec : null;

    lines.push("");
    lines.push(`--- Phase : ${phase} ---`);
    lines.push(`  Requêtes totales : ${fmt(count, 0)}`);
    lines.push(`  Temps de réponse p95 : ${fmt(p95, 2)} ms`);
    lines.push(`  RPS (req/s, moyenné sur 30s) : ${fmt(rps, 2)}`);
    lines.push(
      `  Taux d'erreur : ${errRate != null ? (errRate * 100).toFixed(2) : "n/a"} %`,
    );
    lines.push(`  Cache HIT / MISS : ${fmt(hits, 0)} / ${fmt(misses, 0)}`);
  }

  lines.push("");
  lines.push("========================================================");
  lines.push("");

  return {
    stdout: lines.join("\n"),
    "summary.json": JSON.stringify(data, null, 2),
  };
}

// Helpers d'extraction sur l'objet `data` fourni par handleSummary.
function subMetric(data, name, phase) {
  return data.metrics[`${name}{phase:${phase}}`];
}

function metricValue(data, name, key, phase) {
  const m = subMetric(data, name, phase);
  if (m && m.values && m.values[key] != null) return m.values[key];
  return null;
}

function metricCount(data, name, phase) {
  const m = subMetric(data, name, phase);
  if (!m || !m.values) return null;
  return m.values.count != null ? m.values.count : null;
}

function fmt(v, decimals) {
  if (v == null || Number.isNaN(v)) return "n/a";
  return Number(v).toFixed(decimals);
}

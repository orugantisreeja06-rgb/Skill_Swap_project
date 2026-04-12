/**
 * API + Socket.IO base (no trailing slash).
 * - REACT_APP_DEMO_MODE=true: offline demo (localStorage); no real server required.
 * - Local dev: CRA on :3000 → defaults to http://localhost:5000 unless REACT_APP_API_URL.
 * - Production: set REACT_APP_API_URL to your deployed API origin.
 */
export const DEMO_MODE = process.env.REACT_APP_DEMO_MODE === "true";

/** Strip trailing slashes and accidental /api (app adds /api itself). */
function normalizeApiOrigin(raw) {
  let s = String(raw).trim().replace(/\/+$/, "");
  while (s.endsWith("/api")) {
    s = s.slice(0, -4).replace(/\/+$/, "");
  }
  return s;
}

function resolveApiOrigin() {
  if (DEMO_MODE) {
    return "http://127.0.0.1:0";
  }
  const env = process.env.REACT_APP_API_URL;
  if (typeof env === "string" && env.trim()) {
    return normalizeApiOrigin(env);
  }
  if (typeof window !== "undefined" && window.location) {
    const { hostname, port, origin } = window.location;
    if (hostname === "localhost" && String(port) === "3000") {
      return "http://localhost:5000";
    }
    return origin;
  }
  return "http://localhost:5000";
}

export const API_ORIGIN = resolveApiOrigin();

export const API_BASE_URL = `${API_ORIGIN}/api`;

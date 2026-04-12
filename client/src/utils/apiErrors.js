import { DEMO_MODE } from "../config";

/**
 * Human-readable messages when the API is missing, blocked by CORS, or unreachable.
 */
export function getApiErrorMessage(error, fallback) {
  const serverMsg = error.response?.data?.message;
  if (serverMsg) return serverMsg;

  if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
    if (DEMO_MODE) return fallback;
    return "Cannot reach the API. If you use GitHub Pages, set the REACT_APP_API_URL variable and deploy the backend; on the server set CLIENT_ORIGIN to your github.io URL (see .github/DEPLOY.md).";
  }

  const status = error.response?.status;
  if (status === 404) {
    return "API not found at this address. Check REACT_APP_API_URL (no /api suffix).";
  }
  if (status === 503) {
    return error.response?.data?.message || fallback;
  }

  return fallback;
}

import { DEMO_MODE } from "../config";

export default function DemoBanner() {
  if (!DEMO_MODE) return null;

  return (
    <div
      className="bg-amber-500/95 text-slate-900 text-center text-xs sm:text-sm font-medium py-2 px-3 border-b border-amber-600/50"
      role="status"
    >
      Offline demo — your data stays in this browser only. Set the{" "}
      <code className="rounded bg-black/10 px-1">REACT_APP_API_URL</code>{" "}
      variable and deploy the API for a shared live backend (
      <span className="whitespace-nowrap">see .github/DEPLOY.md</span>).
    </div>
  );
}

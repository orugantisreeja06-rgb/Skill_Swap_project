import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";

function Dashboard() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProtectedData = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/");
          return;
        }

        const res = await API.get("/auth/protected");

        setMessage(res.data.message);
      } catch (err) {
        console.error("Error:", err);

        setMessage(
          err.response?.data?.message || "Access denied. Invalid token."
        );

        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchProtectedData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    navigate("/");
  };

  const handleSearch = () => {
    navigate("/search");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 to-indigo-50/40 px-4 py-10">
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-indigo-600 text-sm font-semibold uppercase tracking-wider mb-2">
          Your hub
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-2">
          Dashboard
        </h1>
        <p className="text-slate-600 mb-8 max-w-md mx-auto">
          Search for skills, manage swap requests, and chat live when a swap is
          accepted.
        </p>

        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xl shadow-indigo-100/50 p-8 mb-8">
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="h-8 w-8 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
            </div>
          ) : (
            <p className="text-lg font-medium text-emerald-600">{message}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          <button
            type="button"
            onClick={handleSearch}
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold px-6 py-3 shadow-lg shadow-indigo-300/40 hover:from-indigo-500 hover:to-violet-500 transition"
          >
            Search skills
          </button>
          <Link
            to="/requests"
            className="inline-flex items-center justify-center rounded-xl bg-amber-500 text-white font-semibold px-6 py-3 shadow-md hover:bg-amber-400 transition"
          >
            Swap requests
          </Link>
          <Link
            to="/profile"
            className="inline-flex items-center justify-center rounded-xl bg-slate-800 text-white font-semibold px-6 py-3 hover:bg-slate-700 transition"
          >
            My profile
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center rounded-xl border-2 border-slate-200 bg-white text-slate-700 font-semibold px-6 py-3 hover:bg-slate-50 transition"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

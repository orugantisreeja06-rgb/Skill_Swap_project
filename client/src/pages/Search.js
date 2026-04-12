import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function Search() {
  const [skill, setSkill] = useState("");
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSearch = async () => {
    try {
      if (!skill) {
        setMessage("Please enter a skill");
        return;
      }

      const res = await API.get(
        `/auth/search?skill=${encodeURIComponent(skill)}`
      );
      setUsers(res.data);

      if (res.data.length === 0) {
        setMessage("No users found");
      } else {
        setMessage("");
      }
    } catch (err) {
      console.error(err);
      setMessage("Error fetching users");
    }
  };

  const handleSwapRequest = async (userId) => {
    try {
      await API.post("/swap/request", {
        toUser: userId,
        skillOffered: skill,
        skillRequested: "Any",
      });

      alert("Swap request sent!");
    } catch (err) {
      const msg =
        err.response?.data?.message || "Failed to send request";
      alert(msg);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 to-violet-50/30 px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            Find skill partners
          </h2>
          <p className="text-slate-600 mt-2 max-w-lg mx-auto">
            Search by a skill people offer. Add your own skills in Profile so
            others can find you.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-0 sm:gap-0 mb-8 max-w-xl mx-auto shadow-lg shadow-indigo-100/80 rounded-xl overflow-hidden border border-slate-200/80">
          <input
            type="text"
            placeholder="e.g. React, guitar, Spanish…"
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 min-w-0 px-4 py-3.5 border-0 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 outline-none"
          />
          <button
            type="button"
            onClick={handleSearch}
            className="sm:w-36 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold py-3.5 px-6 hover:from-indigo-500 hover:to-violet-500 transition"
          >
            Search
          </button>
        </div>

        {message && (
          <p className="text-center text-slate-600 mb-6 text-sm font-medium">
            {message}
          </p>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {users.map((user) => (
            <div
              key={user._id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-md hover:shadow-lg hover:border-indigo-200/60 transition duration-200"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-lg font-bold shrink-0">
                  {user.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-slate-900 truncate">
                    {user.name}
                  </h3>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>

              <p className="text-sm text-slate-600 mb-2">
                <span className="font-semibold text-slate-800">Offers:</span>{" "}
                {user.skillsOffered?.join(", ") || "—"}
              </p>
              <p className="text-sm text-slate-600 mb-2">
                <span className="font-semibold text-slate-800">Wants:</span>{" "}
                {user.skillsWanted?.join(", ") || "—"}
              </p>
              <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                {user.bio || "No bio yet."}
              </p>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/profile/${user._id}`)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium py-2.5 hover:bg-slate-100 transition"
                >
                  View profile
                </button>
                <button
                  type="button"
                  onClick={() => handleSwapRequest(user._id)}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold py-2.5 hover:from-emerald-400 hover:to-teal-500 transition shadow-sm"
                >
                  Request swap
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="text-slate-600 font-medium hover:text-indigo-600 transition"
          >
            ← Back to dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default Search;
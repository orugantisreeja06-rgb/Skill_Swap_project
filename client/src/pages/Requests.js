import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function Requests() {
  const [tab, setTab] = useState("incoming");
  const [incoming, setIncoming] = useState([]);
  const [sent, setSent] = useState([]);
  const navigate = useNavigate();

  const loadAll = async () => {
    try {
      const [inRes, outRes] = await Promise.all([
        API.get("/swap/requests"),
        API.get("/swap/sent"),
      ]);
      setIncoming(inRes.data);
      setSent(outRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const updateIncoming = async (id, status) => {
    try {
      await API.put(`/swap/${id}`, { status });
      setIncoming((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status } : r))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Could not update request");
    }
  };

  const withdrawSent = async (id) => {
    try {
      await API.put(`/swap/${id}`, { status: "cancelled" });
      setSent((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status: "cancelled" } : r))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Could not withdraw");
    }
  };

  const getStatusColor = (status) => {
    if (status === "accepted") return "text-green-600";
    if (status === "rejected") return "text-red-600";
    if (status === "cancelled") return "text-gray-500";
    return "text-yellow-600";
  };

  const openChat = (userId) => {
    navigate(`/chat/${userId}`);
  };

  const pendingIncoming = incoming.filter((r) => r.status === "pending").length;
  const pendingSent = sent.filter((r) => r.status === "pending").length;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 to-indigo-50/40 px-4 py-8">
      <div className="max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold text-center text-slate-900 tracking-tight mb-2">
        Swap requests
      </h2>
      <p className="text-center text-slate-600 text-sm mb-8 max-w-md mx-auto">
        Accept offers from others or manage what you sent. Open chat when a swap
        is accepted — it updates in real time.
      </p>

      <div className="flex justify-center gap-2 mb-8">
        <button
          type="button"
          onClick={() => setTab("incoming")}
          className={`px-5 py-2.5 rounded-xl font-semibold transition ${
            tab === "incoming"
              ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200/50"
              : "bg-white text-slate-700 border border-slate-200 hover:border-indigo-200"
          }`}
        >
          Incoming
          {pendingIncoming > 0 && (
            <span className="ml-2 text-xs bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full font-bold">
              {pendingIncoming}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab("sent")}
          className={`px-5 py-2.5 rounded-xl font-semibold transition ${
            tab === "sent"
              ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200/50"
              : "bg-white text-slate-700 border border-slate-200 hover:border-indigo-200"
          }`}
        >
          Sent
          {pendingSent > 0 && (
            <span className="ml-2 text-xs bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full font-bold">
              {pendingSent}
            </span>
          )}
        </button>
      </div>

      {tab === "incoming" && (
        <>
          {incoming.length === 0 ? (
            <p className="text-center text-gray-500">No incoming requests</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {incoming.map((req) => (
                <div
                  key={req._id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-md hover:shadow-lg transition"
                >
                  <h3 className="text-lg font-bold mb-2">{req.fromUser?.name}</h3>
                  <p className="text-sm mb-1">
                    <b>Email:</b> {req.fromUser?.email}
                  </p>
                  <p className="text-sm mb-1">
                    <b>They offer:</b> {req.skillOffered}
                  </p>
                  <p className="text-sm mb-1">
                    <b>They want:</b> {req.skillRequested}
                  </p>
                  <p className={`font-semibold ${getStatusColor(req.status)}`}>
                    Status: {req.status}
                  </p>

                  {req.status === "pending" && (
                    <div className="mt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={() => updateIncoming(req._id, "accepted")}
                        className="flex-1 bg-emerald-500 text-white font-semibold py-2.5 rounded-xl hover:bg-emerald-400 transition"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => updateIncoming(req._id, "rejected")}
                        className="flex-1 bg-rose-500 text-white font-semibold py-2.5 rounded-xl hover:bg-rose-400 transition"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {req.status === "accepted" && (
                    <button
                      type="button"
                      onClick={() => openChat(req.fromUser._id)}
                      className="mt-4 w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold py-2.5 rounded-xl hover:from-indigo-500 hover:to-violet-500 transition"
                    >
                      Open chat
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "sent" && (
        <>
          {sent.length === 0 ? (
            <p className="text-center text-gray-500">
              You have not sent any requests yet. Use Search to find people.
            </p>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {sent.map((req) => (
                <div
                  key={req._id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-md hover:shadow-lg transition"
                >
                  <h3 className="text-lg font-bold mb-2">To: {req.toUser?.name}</h3>
                  <p className="text-sm mb-1">
                    <b>Email:</b> {req.toUser?.email}
                  </p>
                  <p className="text-sm mb-1">
                    <b>You offer:</b> {req.skillOffered}
                  </p>
                  <p className="text-sm mb-1">
                    <b>You want:</b> {req.skillRequested}
                  </p>
                  <p className={`font-semibold ${getStatusColor(req.status)}`}>
                    Status: {req.status}
                  </p>

                  {req.status === "pending" && (
                    <button
                      type="button"
                      onClick={() => withdrawSent(req._id)}
                      className="mt-4 w-full bg-slate-700 text-white font-semibold py-2.5 rounded-xl hover:bg-slate-600 transition"
                    >
                      Withdraw request
                    </button>
                  )}

                  {req.status === "accepted" && (
                    <button
                      type="button"
                      onClick={() => openChat(req.toUser._id)}
                      className="mt-4 w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold py-2.5 rounded-xl hover:from-indigo-500 hover:to-violet-500 transition"
                    >
                      Open chat
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}

export default Requests;

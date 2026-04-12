import { useEffect, useState, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { getChatHistory } from "../services/api.js";
import { API_ORIGIN, DEMO_MODE } from "../config";
import { appendDemoChatMessage } from "../demo/handlers";
import { getMessages } from "../demo/store";

function mapHistoryRow(msg) {
  return {
    message: msg.message,
    senderId: msg.sender?._id ?? msg.senderId,
    senderName: msg.sender?.name ?? msg.senderName,
    timestamp: msg.createdAt ?? msg.timestamp,
  };
}

function loadDemoChatRows(peerId, myId) {
  const raw = getMessages(myId, peerId);
  return raw.map(mapHistoryRow);
}

export default function Chat() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  useEffect(() => {
    if (!userId) {
      navigate("/requests");
      return undefined;
    }

    const token = localStorage.getItem("token");
    const myId = localStorage.getItem("userId");

    const applyHistory = (rows) => setChat(rows);

    if (DEMO_MODE) {
      const sync = () => {
        if (!myId) return;
        applyHistory(loadDemoChatRows(userId, myId));
      };
      sync();
      const bc = new BroadcastChannel("skillswap-demo");
      bc.onmessage = sync;
      return () => bc.close();
    }

    const socket = io(API_ORIGIN, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    const syncSocket = () => {
      if (token) socket.emit("authenticate", token);
      socket.emit("joinRoom", userId);
    };

    socket.on("connect", syncSocket);
    syncSocket();

    const loadHistory = async () => {
      try {
        const res = await getChatHistory(userId);
        applyHistory(res.data.map(mapHistoryRow));
      } catch (err) {
        console.error("Load history error:", err);
      }
    };
    loadHistory();

    const onReceive = (data) => {
      setChat((prev) => [...prev, data]);
    };
    socket.on("receiveMessage", onReceive);

    return () => {
      socket.off("connect", syncSocket);
      socket.off("receiveMessage", onReceive);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, navigate]);

  const sendMessage = () => {
    if (!message.trim() || !userId) return;
    const myId = localStorage.getItem("userId");

    if (DEMO_MODE) {
      if (!myId) return;
      appendDemoChatMessage(myId, userId, message.trim());
      setChat((prev) => [
        ...prev,
        {
          message: message.trim(),
          senderId: myId,
          senderName: "You",
          timestamp: new Date().toISOString(),
        },
      ]);
      setMessage("");
      return;
    }

    const socket = socketRef.current;
    if (!socket) return;
    socket.emit("sendMessage", {
      peerId: userId,
      message: message.trim(),
    });
    setMessage("");
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] bg-slate-100">
      <header className="flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-white/10">
        <Link
          to="/requests"
          className="text-sm text-indigo-200 hover:text-white shrink-0"
        >
          ← Requests
        </Link>
        <div className="text-center min-w-0 flex-1">
          <h1 className="text-lg font-bold truncate">Live chat</h1>
          <p className="text-xs text-indigo-200/90 truncate">
            {DEMO_MODE
              ? "Demo chat — messages stay in this browser"
              : "Messages appear instantly for both of you"}
          </p>
        </div>
        <span className="w-16 shrink-0" aria-hidden="true" />
      </header>

      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {chat.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-8">
            No messages yet. Say hello below
            {DEMO_MODE ? "." : " — delivery is real-time."}
          </p>
        )}
        {chat.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              String(msg.senderId) === String(localStorage.getItem("userId"))
                ? "justify-end"
                : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] sm:max-w-xs rounded-2xl px-4 py-2.5 shadow-sm ${
                String(msg.senderId) ===
                String(localStorage.getItem("userId"))
                  ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-br-md"
                  : "bg-white text-slate-800 border border-slate-200 rounded-bl-md"
              }`}
            >
              <div className="text-[11px] font-medium opacity-80 mb-0.5">
                {String(msg.senderId) ===
                String(localStorage.getItem("userId"))
                  ? "You"
                  : msg.senderName || "Partner"}
              </div>
              <div className="text-sm leading-relaxed">{msg.message}</div>
              {msg.timestamp && (
                <div className="text-[10px] opacity-60 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-white border-t border-slate-200 flex gap-2 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <input
          type="text"
          placeholder="Type a message…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
        />
        <button
          type="button"
          onClick={sendMessage}
          className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold px-5 py-3 hover:from-indigo-500 hover:to-violet-500 transition shrink-0"
        >
          Send
        </button>
      </div>
    </div>
  );
}

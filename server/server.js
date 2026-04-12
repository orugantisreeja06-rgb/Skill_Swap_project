const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

if (!process.env.MONGO_URI?.trim()) {
  console.error(
    "\n❌ Missing MONGO_URI in server/.env\n" +
      "   Copy server/.env.example → server/.env and set your connection string.\n" +
      "   Local: mongodb://127.0.0.1:27017/skillswapdb\n" +
      "   Atlas: mongodb+srv://USER:PASS@cluster.../skillswapdb\n"
  );
  process.exit(1);
}

if (!process.env.JWT_SECRET?.trim()) {
  console.error(
    "\n❌ Missing JWT_SECRET in server/.env\n" +
      "   Add a long random string (used to sign login tokens).\n"
  );
  process.exit(1);
}

const path = require("path");
const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const Message = require("./models/Message");
const User = require("./models/User");

const app = express();

const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// ✅ Middleware
app.use(express.json());
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowedOrigins.includes(origin)) {
        return cb(null, true);
      }
      cb(null, false);
    },
  })
);

// ✅ Routes
const authRoutes = require("./routes/auth");
const swapRoutes = require("./routes/swap");
const chatRoutes = require("./routes/chat");

app.use("/api/auth", authRoutes);
app.use("/api/swap", swapRoutes);
app.use("/api/chat", chatRoutes);

// ✅ Optional: serve React build (one public URL for API + real-time + UI)
const clientBuild = path.join(__dirname, "..", "client", "build");
const indexHtml = path.join(clientBuild, "index.html");
const hasClientBuild = fs.existsSync(indexHtml);
const serveClient =
  process.env.SERVE_CLIENT === "true" ||
  (process.env.NODE_ENV === "production" && hasClientBuild);

if (serveClient && hasClientBuild) {
  app.use(express.static(clientBuild));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(indexHtml);
  });
} else {
  app.get("/", (req, res) => {
    res.send("API running 🚀 (build the client and set SERVE_CLIENT=true for one-URL deploy)");
  });
}

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:");
    console.error(err.message);
  });

// =====================
// ✅ SOCKET.IO SETUP (PRIVATE CHAT)
// =====================
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

function conversationRoomId(userIdA, userIdB) {
  return [String(userIdA), String(userIdB)].sort().join("_");
}

function joinPeerRoom(socket) {
  if (!socket.userId || !socket.currentPeerId) return;
  const roomId = conversationRoomId(socket.userId, socket.currentPeerId);
  if (socket.lastJoinedRoom && socket.lastJoinedRoom !== roomId) {
    socket.leave(socket.lastJoinedRoom);
  }
  socket.join(roomId);
  socket.lastJoinedRoom = roomId;
}

io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  socket.on("authenticate", (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = String(decoded.id);
      joinPeerRoom(socket);
      socket.emit("authenticated");
      console.log(`✅ User authenticated: ${socket.userId}`);
    } catch (err) {
      console.error("Socket auth failed:", err.message);
      socket.emit("auth_error", "Invalid or expired token");
      socket.disconnect(true);
    }
  });

  socket.on("joinRoom", (peerUserId) => {
    if (!peerUserId) return;
    socket.currentPeerId = String(peerUserId);
    joinPeerRoom(socket);
  });

  // ✅ Send message: client sends { peerId, message }
  socket.on("sendMessage", async (data) => {
    if (!socket.userId) {
      socket.emit("error", "Not authenticated");
      return;
    }

    const peerId = data.peerId ?? data.room;
    const text = data.message;
    if (!peerId || !text || !String(text).trim()) {
      socket.emit("error", "Invalid message");
      return;
    }

    try {
      await Message.create({
        sender: socket.userId,
        receiver: peerId,
        message: String(text).trim(),
      });

      const senderDoc = await User.findById(socket.userId).select("name").lean();
      const roomId = conversationRoomId(socket.userId, peerId);
      const now = new Date().toISOString();
      const messageData = {
        room: roomId,
        peerId,
        message: String(text).trim(),
        senderId: socket.userId,
        senderName: senderDoc?.name || "User",
        timestamp: now,
      };

      io.to(roomId).emit("receiveMessage", messageData);
    } catch (err) {
      console.error("Message save error:", err);
      socket.emit("error", "Failed to send message");
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.userId || socket.id);
  });
});

// ✅ Server Start
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  if (serveClient && hasClientBuild) {
    console.log(
      "📦 Serving the React app — open this URL in the browser (API + real-time chat same origin)."
    );
  }
});
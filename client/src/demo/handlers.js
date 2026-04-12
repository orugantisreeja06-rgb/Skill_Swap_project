import {
  broadcastDemo,
  getMessages,
  getSwaps,
  getUserById,
  getUsers,
  makeDemoToken,
  publicUser,
  readUserIdFromAuth,
  setMessages,
  setSwaps,
  setUsers,
  uid,
} from "./store";

function reject(status, message) {
  const err = new Error(message);
  err.response = { status, data: { message } };
  return Promise.reject(err);
}

function ok(data) {
  return Promise.resolve(data);
}

function apiRoute(config) {
  const base = (config.baseURL || "").replace(/\/$/, "");
  const pathPart = String(config.url || "").replace(/^\//, "");
  const joined = `${base}/${pathPart}`;
  const m = joined.match(/\/api\/(.+)$/);
  const tail = m ? m[1] : pathPart;
  const [pathOnly] = tail.split("?");
  return {
    path: pathOnly.replace(/\/$/, ""),
    query: tail.includes("?") ? new URLSearchParams(tail.split("?")[1]) : null,
    method: String(config.method || "get").toLowerCase(),
  };
}

function authHeader(config) {
  const h = config.headers;
  if (!h) return "";
  if (typeof h.get === "function") {
    return h.get("Authorization") || h.get("authorization") || "";
  }
  return h.Authorization || h.authorization || "";
}

function requireUserId(config) {
  const id = readUserIdFromAuth(authHeader(config));
  if (!id) return reject(401, "Not authorized");
  if (!getUserById(id)) return reject(401, "Not authorized");
  return id;
}

/**
 * Axios custom adapter: resolves with response body data only (wrapper adds envelope).
 */
export default async function handleDemoRequest(config) {
  const { path, query, method } = apiRoute(config);
  let body = {};
  if (config.data != null && config.data !== "") {
    try {
      body =
        typeof config.data === "string"
          ? JSON.parse(config.data)
          : config.data;
    } catch {
      body = {};
    }
  }

  if (method === "post" && path === "auth/register") {
    const { name, email, password } = body;
    if (!name || !email || !password) {
      return reject(400, "All fields are required");
    }
    const users = getUsers();
    if (users.some((u) => u.email === String(email).toLowerCase())) {
      return reject(400, "User already exists");
    }
    const user = {
      _id: uid(),
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      password,
      bio: "",
      skillsOffered: [],
      skillsWanted: [],
      ratings: [],
    };
    users.push(user);
    setUsers(users);
    return ok({ message: "User registered successfully" });
  }

  if (method === "post" && path === "auth/login") {
    const { email, password } = body;
    if (!email || !password) {
      return reject(400, "All fields are required");
    }
    const user = getUsers().find(
      (u) => u.email === String(email).toLowerCase().trim()
    );
    if (!user || user.password !== password) {
      return reject(400, "Invalid credentials");
    }
    if (!user.password && user.googleId) {
      return reject(400, "This account uses Google. Sign in with Google.");
    }
    return ok({
      token: makeDemoToken(user._id),
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
      },
    });
  }

  if (method === "post" && path === "auth/google") {
    return reject(
      503,
      "Google sign-in needs a live API. Use email/password in offline demo."
    );
  }

  if (method === "get" && path === "auth/protected") {
    const id = requireUserId(config);
    if (id && typeof id.then === "function") return id;
    return ok({ message: "Welcome to Dashboard 🚀", userId: id });
  }

  if (method === "get" && path === "auth/profile") {
    const id = requireUserId(config);
    if (id && typeof id.then === "function") return id;
    const u = getUserById(id);
    if (!u) return reject(404, "User not found");
    return ok(publicUser(u));
  }

  if (method === "put" && path === "auth/profile") {
    const id = requireUserId(config);
    if (id && typeof id.then === "function") return id;
    const users = getUsers();
    const i = users.findIndex((u) => String(u._id) === id);
    if (i < 0) return reject(404, "User not found");
    const u = users[i];
    const { bio, skillsOffered, skillsWanted } = body;
    if (bio !== undefined) u.bio = String(bio).trim().slice(0, 500);
    if (skillsOffered !== undefined) {
      u.skillsOffered = Array.isArray(skillsOffered)
        ? skillsOffered
        : String(skillsOffered || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 30);
    }
    if (skillsWanted !== undefined) {
      u.skillsWanted = Array.isArray(skillsWanted)
        ? skillsWanted
        : String(skillsWanted || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 30);
    }
    users[i] = u;
    setUsers(users);
    return ok(publicUser(u));
  }

  const profMatch = path.match(/^auth\/profile\/([^/]+)$/);
  if (method === "get" && profMatch) {
    const u = getUserById(profMatch[1]);
    if (!u) return reject(404, "User not found");
    return ok(publicUser(u));
  }

  if (method === "post" && path === "auth/rate") {
    const id = requireUserId(config);
    if (id && typeof id.then === "function") return id;
    const { userId, value, review } = body;
    const score = Number(value);
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return reject(400, "Rating must be 1–5");
    }
    if (String(userId) === String(id)) {
      return reject(400, "Cannot rate yourself");
    }
    const users = getUsers();
    const ti = users.findIndex((u) => String(u._id) === String(userId));
    if (ti < 0) return reject(404, "User not found");
    const target = users[ti];
    const dup = target.ratings?.some((r) => String(r.fromUser) === String(id));
    if (dup) return reject(400, "Already rated this user");
    if (!target.ratings) target.ratings = [];
    target.ratings.push({
      value: score,
      review: review != null ? String(review).slice(0, 500) : "",
      fromUser: id,
    });
    users[ti] = target;
    setUsers(users);
    return ok({ message: "Rating added successfully" });
  }

  if (method === "get" && path === "auth/search") {
    const id = requireUserId(config);
    if (id && typeof id.then === "function") return id;
    const skill = (query?.get("skill") || "").trim();
    if (!skill) return reject(400, "Skill query is required");
    const esc = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(esc, "i");
    const list = getUsers()
      .filter(
        (u) =>
          String(u._id) !== String(id) &&
          (u.skillsOffered || []).some((s) => re.test(s))
      )
      .map((u) => publicUser(u));
    return ok(list);
  }

  if (method === "post" && path === "swap/request") {
    const id = requireUserId(config);
    if (id && typeof id.then === "function") return id;
    const { toUser, skillOffered, skillRequested } = body;
    if (!toUser || String(toUser) === String(id)) {
      return reject(400, "Invalid recipient");
    }
    const swaps = getSwaps();
    const dup = swaps.some(
      (s) =>
        String(s.fromUser) === String(id) &&
        String(s.toUser) === String(toUser) &&
        s.status === "pending"
    );
    if (dup) {
      return reject(400, "You already have a pending request to this user");
    }
    swaps.push({
      _id: uid(),
      fromUser: id,
      toUser: String(toUser),
      skillOffered: skillOffered || "",
      skillRequested: skillRequested || "",
      status: "pending",
    });
    setSwaps(swaps);
    return ok({ message: "Swap request sent" });
  }

  if (method === "get" && path === "swap/requests") {
    const id = requireUserId(config);
    if (id && typeof id.then === "function") return id;
    const swaps = getSwaps().filter((s) => String(s.toUser) === String(id));
    const out = swaps.map((s) => ({
      ...s,
      fromUser: getUserById(s.fromUser)
        ? {
            _id: s.fromUser,
            name: getUserById(s.fromUser).name,
            email: getUserById(s.fromUser).email,
          }
        : { _id: s.fromUser, name: "?", email: "" },
    }));
    return ok(out);
  }

  if (method === "get" && path === "swap/sent") {
    const id = requireUserId(config);
    if (id && typeof id.then === "function") return id;
    const swaps = getSwaps().filter((s) => String(s.fromUser) === String(id));
    const out = swaps.map((s) => ({
      ...s,
      toUser: getUserById(s.toUser)
        ? {
            _id: s.toUser,
            name: getUserById(s.toUser).name,
            email: getUserById(s.toUser).email,
          }
        : { _id: s.toUser, name: "?", email: "" },
    }));
    return ok(out);
  }

  const swapPut = path.match(/^swap\/([^/]+)$/);
  if (method === "put" && swapPut) {
    const id = requireUserId(config);
    if (id && typeof id.then === "function") return id;
    const swapId = swapPut[1];
    const { status: next } = body;
    const nextSt = String(next || "");
    if (!["accepted", "rejected", "cancelled"].includes(nextSt)) {
      return reject(400, "Invalid status");
    }
    const swaps = getSwaps();
    const si = swaps.findIndex((s) => String(s._id) === swapId);
    if (si < 0) return reject(404, "Not found");
    const swap = swaps[si];
    if (swap.status !== "pending") {
      return reject(400, "This request is already resolved");
    }
    const isRecipient = String(swap.toUser) === String(id);
    const isSender = String(swap.fromUser) === String(id);
    if (nextSt === "cancelled") {
      if (!isSender) {
        return reject(403, "Only the sender can withdraw");
      }
    } else if (!isRecipient) {
      return reject(403, "Not allowed");
    }
    swap.status = nextSt;
    swaps[si] = swap;
    setSwaps(swaps);
    return ok(swap);
  }

  const chatGet = path.match(/^chat\/([^/]+)$/);
  if (method === "get" && chatGet) {
    const id = requireUserId(config);
    if (id && typeof id.then === "function") return id;
    const peer = chatGet[1];
    const raw = getMessages(id, peer);
    const list = raw.map((m) => ({
      ...m,
      sender:
        typeof m.sender === "object"
          ? m.sender
          : { _id: m.senderId, name: m.senderName || "User" },
    }));
    return ok(list);
  }

  return reject(404, "Not found");
}

export function appendDemoChatMessage(senderId, receiverId, text) {
  const list = getMessages(senderId, receiverId);
  const sender = getUserById(senderId);
  list.push({
    _id: uid(),
    message: text,
    sender: { _id: senderId, name: sender?.name || "You" },
    createdAt: new Date().toISOString(),
  });
  setMessages(senderId, receiverId, list);
  broadcastDemo();
}

const USERS = "skillswap_demo_users";
const SWAPS = "skillswap_demo_swaps";

export function uid() {
  return `d_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function save(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

export function getUsers() {
  return load(USERS, []);
}

export function setUsers(list) {
  save(USERS, list);
}

export function getUserById(id) {
  return getUsers().find((u) => String(u._id) === String(id));
}

export function getSwaps() {
  return load(SWAPS, []);
}

export function setSwaps(list) {
  save(SWAPS, list);
}

export function msgKey(a, b) {
  return `skillswap_demo_msg_${[String(a), String(b)].sort().join("__")}`;
}

export function getMessages(a, b) {
  return load(msgKey(a, b), []);
}

export function setMessages(a, b, list) {
  save(msgKey(a, b), list);
}

export function broadcastDemo() {
  try {
    new BroadcastChannel("skillswap-demo").postMessage("tick");
  } catch {
    /* ignore */
  }
}

export function makeDemoToken(userId) {
  const h = btoa(JSON.stringify({ alg: "none", typ: "JWT" }));
  const p = btoa(JSON.stringify({ id: String(userId) }));
  return `${h}.${p}.demo`;
}

export function readUserIdFromAuth(header) {
  if (!header || typeof header !== "string") return null;
  const m = header.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const parts = m[1].split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(atob(parts[1]));
    return payload.id != null ? String(payload.id) : null;
  } catch {
    return null;
  }
}

export function publicUser(u) {
  if (!u) return null;
  const { password: _p, ...rest } = u;
  const ratings = rest.ratings || [];
  const avgRating =
    ratings.length > 0
      ? Math.round(
          (ratings.reduce((s, r) => s + r.value, 0) / ratings.length) * 10
        ) / 10
      : 0;
  return { ...rest, avgRating };
}

import axios from "axios";
import { API_BASE_URL, DEMO_MODE } from "../config";
import demoAxiosAdapter from "../demo/adapter";

const API = axios.create({
  baseURL: API_BASE_URL,
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

if (DEMO_MODE) {
  API.interceptors.request.use((config) => {
    config.adapter = demoAxiosAdapter;
    return config;
  });
}

function loginPageHref() {
  const pub = (process.env.PUBLIC_URL || "").replace(/\/$/, "");
  return pub ? `${pub}/` : "/";
}

function isAuthRoute(pathname) {
  const p = pathname.replace(/\/$/, "") || "/";
  const home = loginPageHref().replace(/\/$/, "") || "/";
  if (p === home || p === "/") return true;
  if (p.endsWith("/register")) return true;
  return false;
}

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      const path = window.location.pathname;
      if (!isAuthRoute(path)) {
        window.location.assign(loginPageHref());
      }
    }
    return Promise.reject(err);
  }
);

export const updateMyProfile = (body) => API.put("/auth/profile", body);

export const getChatHistory = (userId) => API.get(`/chat/${userId}`);

export const getProfile = (userId) => API.get(`/auth/profile/${userId}`);
export const getMyProfile = () => API.get("/auth/profile");

export default API;

import { BrowserRouter, Routes, Route } from "react-router-dom";

import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Search from "./pages/Search";
import Requests from "./pages/Requests";
import Navbar from "./components/Navbar";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";

import ProtectedRoute from "./components/ProtectedRoute";
import DemoBanner from "./components/DemoBanner";

// GitHub Actions sets PUBLIC_URL=/RepoName/ for project Pages; routes must use the same base.
const ROUTER_BASENAME = (() => {
  const p = (process.env.PUBLIC_URL || "").replace(/\/$/, "");
  if (!p || p === "/") return undefined;
  return p;
})();

function App() {
  return (
    <BrowserRouter basename={ROUTER_BASENAME}>
      <DemoBanner />
      <Navbar />
      <Routes>
        {/* ✅ Default → Login */}
        <Route path="/" element={<Login />} />

        {/* ✅ Register */}
        <Route path="/register" element={<Register />} />

        {/* ✅ Protected Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:userId"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />

        {/* ✅ Protected Search */}
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <Search />
            </ProtectedRoute>
          }
        />

        {/* ✅ Protected Requests */}
        <Route
          path="/requests"
          element={
            <ProtectedRoute>
              <Requests />
            </ProtectedRoute>
          }
        />

        {/* ✅ Profile */}
        <Route
          path="/profile/:id"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* ✅ Fallback Route */}
        <Route path="*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
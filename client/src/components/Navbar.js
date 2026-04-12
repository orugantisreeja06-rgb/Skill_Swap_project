import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    navigate("/");
  };

  const linkClass =
    "text-sm font-medium text-slate-200 hover:text-white transition rounded-lg px-3 py-2 hover:bg-white/10";

  return (
    <nav className="sticky top-0 z-50 border-b border-indigo-500/20 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 shadow-lg shadow-indigo-950/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <Link
          to={token ? "/dashboard" : "/"}
          className="flex items-center gap-2 text-white no-underline group"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 text-lg shadow-md group-hover:shadow-indigo-500/40 transition">
            ⇄
          </span>
          <span className="font-bold text-lg tracking-tight">SkillSwap</span>
        </Link>

        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
          {token && (
            <>
              <Link to="/dashboard" className={linkClass}>
                Dashboard
              </Link>
              <Link to="/profile" className={linkClass}>
                Profile
              </Link>
              <Link to="/search" className={linkClass}>
                Search
              </Link>
              <Link to="/requests" className={linkClass}>
                Requests
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm font-semibold ml-1 rounded-lg bg-rose-500/90 text-white px-4 py-2 hover:bg-rose-600 transition shadow-sm"
              >
                Log out
              </button>
            </>
          )}

          {!token && (
            <>
              <Link to="/" className={linkClass}>
                Login
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold rounded-lg bg-indigo-500 text-white px-4 py-2 hover:bg-indigo-400 transition ml-1"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

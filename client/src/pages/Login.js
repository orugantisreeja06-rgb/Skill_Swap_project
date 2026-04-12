import { useState } from "react";
import "./Auth.css";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { getApiErrorMessage } from "../utils/apiErrors";
import GoogleAuthSection from "../components/GoogleAuthSection";

function Login() {
  const [data, setData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError("");
    if (!data.email || !data.password) {
      setError("Please fill in email and password.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await API.post("/auth/login", data);

      localStorage.setItem("token", res.data.token);
      if (res.data.user?.id) {
        localStorage.setItem("userId", res.data.user.id);
      }

      navigate("/dashboard");
    } catch (err) {
      setError(getApiErrorMessage(err, "Login failed. Check your details."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-brand" aria-hidden="true">
          ⇄
        </div>
        <h2>Welcome back</h2>
        <p className="auth-tagline">
          Sign in to find people to swap skills with and chat in real time.
        </p>

        {error ? (
          <div className="auth-alert auth-alert--error" role="alert">
            {error}
          </div>
        ) : null}

        <input
          placeholder="Email"
          autoComplete="email"
          disabled={submitting}
          onChange={(e) => setData({ ...data, email: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && !submitting && handleSubmit()}
        />

        <input
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          disabled={submitting}
          onChange={(e) => setData({ ...data, password: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && !submitting && handleSubmit()}
        />

        <button
          type="button"
          className="btn-primary"
          disabled={submitting}
          onClick={handleSubmit}
        >
          {submitting ? (
            <>
              <span className="btn-spinner" aria-hidden="true" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </button>

        <GoogleAuthSection />

        <p>
          Don’t have an account?{" "}
          <span
            role="button"
            tabIndex={0}
            className="auth-link"
            onClick={() => !submitting && navigate("/register")}
            onKeyDown={(e) =>
              e.key === "Enter" && !submitting && navigate("/register")
            }
          >
            Register
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;

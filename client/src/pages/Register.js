import { useState } from "react";
import "./Auth.css";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { getApiErrorMessage } from "../utils/apiErrors";
import GoogleAuthSection from "../components/GoogleAuthSection";

function Register() {
  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError("");
    if (!data.name || !data.email || !data.password) {
      setError("Please fill in all fields.");
      return;
    }

    setSubmitting(true);
    try {
      await API.post("/auth/register", data);
      navigate("/");
    } catch (err) {
      setError(
        getApiErrorMessage(err, "Could not register. Try another email.")
      );
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
        <h2>Create your account</h2>
        <p className="auth-tagline">
          Join SkillSwap to offer what you know and learn what you need.
        </p>

        {error ? (
          <div className="auth-alert auth-alert--error" role="alert">
            {error}
          </div>
        ) : null}

        <input
          placeholder="Full Name"
          autoComplete="name"
          disabled={submitting}
          onChange={(e) => setData({ ...data, name: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && !submitting && handleSubmit()}
        />

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
          autoComplete="new-password"
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
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </button>

        <GoogleAuthSection />

        <p>
          Already have an account?{" "}
          <span
            role="button"
            tabIndex={0}
            className="auth-link"
            onClick={() => !submitting && navigate("/")}
            onKeyDown={(e) =>
              e.key === "Enter" && !submitting && navigate("/")
            }
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}

export default Register;

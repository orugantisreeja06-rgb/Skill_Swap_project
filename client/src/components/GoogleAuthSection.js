import { useState } from "react";
import "../pages/Auth.css";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { DEMO_MODE } from "../config";
import { getApiErrorMessage } from "../utils/apiErrors";

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID?.trim();

export default function GoogleAuthSection() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (DEMO_MODE || !GOOGLE_CLIENT_ID) {
    return null;
  }

  const onSuccess = async (credentialResponse) => {
    setError("");
    setBusy(true);
    try {
      const res = await API.post("/auth/google", {
        credential: credentialResponse.credential,
      });
      localStorage.setItem("token", res.data.token);
      if (res.data.user?.id) {
        localStorage.setItem("userId", res.data.user.id);
      }
      navigate("/dashboard");
    } catch (err) {
      setError(getApiErrorMessage(err, "Google sign-in failed."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="divider">OR</div>
      {error ? (
        <div className="auth-alert auth-alert--error" role="alert">
          {error}
        </div>
      ) : null}
      <div
        className={`google-login-wrap ${busy ? "opacity-60 pointer-events-none" : ""}`}
      >
        <GoogleLogin
          onSuccess={onSuccess}
          onError={() =>
            setError("Google sign-in was cancelled or could not complete.")
          }
          useOneTap={false}
          theme="filled_black"
          size="large"
          width="320"
          text="continue_with"
          shape="rectangular"
        />
      </div>
    </>
  );
}

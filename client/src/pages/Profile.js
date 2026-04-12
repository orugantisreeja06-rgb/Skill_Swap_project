import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API, {
  getProfile,
  getMyProfile,
  updateMyProfile,
} from "../services/api.js";

function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isMe, setIsMe] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editOffered, setEditOffered] = useState("");
  const [editWanted, setEditWanted] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const currentUserId = localStorage.getItem("userId");

    if (token && !currentUserId) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.id) localStorage.setItem("userId", String(payload.id));
      } catch {}
    }

    const currentId = localStorage.getItem("userId");

    if (String(id || "") === String(currentId || "") || !id) {
      // My profile
      getMyProfile()
        .then(res => {
          setUser(res.data);
          setIsMe(true);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      // Other profile
      getProfile(id)
        .then(res => {
          setUser(res.data);
          setIsMe(false);
          setLoading(false);
        })
        .catch(() => {
          alert("Profile not found");
          navigate("/dashboard");
        });
    }
  }, [id, navigate]);

  useEffect(() => {
    if (user && isMe) {
      setEditBio(user.bio || "");
      setEditOffered((user.skillsOffered || []).join(", "));
      setEditWanted((user.skillsWanted || []).join(", "));
    }
  }, [user, isMe]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await updateMyProfile({
        bio: editBio,
        skillsOffered: editOffered,
        skillsWanted: editWanted,
      });
      setUser(res.data);
      alert("Profile saved");
    } catch (err) {
      alert(err.response?.data?.message || "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleRate = async () => {
    if (rating < 1) return;

    try {
      await API.post("/auth/rate", {
        userId: id,
        value: rating,
        review: reviewText
      });
      alert("Rating submitted!");
      setRating(0);
      setReviewText("");
      // Reload profile
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.message || "Rating failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-3 bg-slate-50">
        <div className="h-10 w-10 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
        <p className="text-slate-600 text-sm font-medium">Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 to-violet-50/30 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white p-8 sm:p-10 rounded-2xl border border-slate-200/80 shadow-xl shadow-indigo-100/40">
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-indigo-300/40">
            <span className="text-3xl font-bold text-white">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
            {user.name}
          </h1>
          <p className="text-slate-600 mb-4">{user.email}</p>
          {typeof user.avgRating === "number" && user.ratings?.length > 0 && (
            <div className="flex items-center justify-center mb-4">
              <div className="text-2xl">⭐</div>
              <span className="ml-2 text-xl font-semibold">
                {user.avgRating}/5
              </span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {!isMe && (
            <>
              <div>
                <h2 className="text-xl font-semibold mb-2">Bio</h2>
                <p className="text-gray-700">{user.bio || "No bio yet."}</p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-2">Skills offered</h2>
                <div className="flex flex-wrap gap-2">
                  {(user.skillsOffered || []).map((skill, i) => (
                    <span
                      key={i}
                      className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-3 py-1 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-2">Skills wanted</h2>
                <div className="flex flex-wrap gap-2">
                  {(user.skillsWanted || []).map((skill, i) => (
                    <span
                      key={i}
                      className="bg-indigo-50 text-indigo-800 border border-indigo-200/80 px-3 py-1 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {isMe && (
            <div className="border-t pt-6 space-y-4">
              <h2 className="text-xl font-semibold">Edit your profile</h2>
              <p className="text-sm text-gray-500">
                List skills separated by commas so others can find you in Search.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  rows={3}
                  maxLength={500}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skills offered
                </label>
                <input
                  type="text"
                  value={editOffered}
                  onChange={(e) => setEditOffered(e.target.value)}
                  placeholder="e.g. React, MongoDB, Public speaking"
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skills wanted
                </label>
                <input
                  type="text"
                  value={editWanted}
                  onChange={(e) => setEditWanted(e.target.value)}
                  placeholder="e.g. Spanish, UI design"
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                />
              </div>
              <button
                type="button"
                onClick={saveProfile}
                disabled={saving}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3 px-6 rounded-xl hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 font-semibold shadow-md"
              >
                {saving ? "Saving…" : "Save profile"}
              </button>
            </div>
          )}

          {!isMe && (
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold mb-4">Rate this user</h2>
              <div className="flex items-center mb-4">
                {[1,2,3,4,5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-2xl ${
                      star <= rating ? "text-yellow-400" : "text-gray-300"
                    } hover:text-yellow-400`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Optional review..."
                className="w-full p-3 border border-slate-200 rounded-xl mb-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                rows="3"
              />
              <button
                type="button"
                onClick={handleRate}
                disabled={rating < 1}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3 px-6 rounded-xl hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                Submit Rating
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;


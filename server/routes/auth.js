const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

// ======================
// REGISTER
// ======================
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // ✅ Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // ✅ Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create user
    user = new User({
      name,
      email,
      password: hashedPassword,
    });

    await user.save();

    res.json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ======================
// LOGIN
// ======================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ Validation
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // ✅ Check user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.password) {
      return res.status(400).json({
        message: "This account uses Google. Sign in with Google.",
      });
    }

    // ✅ Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const userId = String(user._id);
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      token,
      user: {
        id: userId,
        name: user.name,
        email: user.email,
      },
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ======================
// GOOGLE SIGN-IN (ID token from @react-oauth/google)
// ======================
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: "Missing Google credential" });
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
    if (!googleClientId) {
      return res.status(503).json({
        message:
          "Google sign-in is not configured on the server (set GOOGLE_CLIENT_ID).",
      });
    }

    const gClient = new OAuth2Client(googleClientId);
    let ticket;
    try {
      ticket = await gClient.verifyIdToken({
        idToken: credential,
        audience: googleClientId,
      });
    } catch (verifyErr) {
      console.error("Google token verify:", verifyErr.message);
      return res.status(401).json({ message: "Invalid Google token" });
    }

    const payload = ticket.getPayload();
    const googleId = payload.sub;
    const email = (payload.email || "").toLowerCase().trim();
    const name = (payload.name || email.split("@")[0] || "User").trim();

    if (!email) {
      return res.status(400).json({ message: "Google account has no email" });
    }

    let user = await User.findOne({ googleId });
    if (!user) {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({
          message:
            "An account with this email already exists. Sign in with your password.",
        });
      }
      user = new User({ name, email, googleId });
      await user.save();
    }

    const userId = String(user._id);
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      token,
      user: {
        id: userId,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ======================
// SEARCH USERS BY SKILL (offered)
// ======================
router.get("/search", authMiddleware, async (req, res) => {
  try {
    const skill = (req.query.skill || "").trim();
    if (!skill) {
      return res.status(400).json({ message: "Skill query is required" });
    }

    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const users = await User.find({
      skillsOffered: { $regex: new RegExp(escaped, "i") },
      _id: { $ne: req.user.id },
    })
      .select("-password")
      .limit(50);

    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ======================
// PROFILE - Self profile (authenticated)
// ======================
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const avgRating =
      user.ratings.length > 0
        ? user.ratings.reduce((sum, r) => sum + r.value, 0) /
          user.ratings.length
        : 0;
    res.json({
      ...user.toObject(),
      avgRating: Math.round(avgRating * 10) / 10,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ======================
// PROFILE - Update own profile (skills, bio)
// ======================
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { bio, skillsOffered, skillsWanted } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (bio !== undefined) {
      user.bio = String(bio).trim().slice(0, 500);
    }
    if (skillsOffered !== undefined) {
      const list = Array.isArray(skillsOffered)
        ? skillsOffered
        : String(skillsOffered || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
      user.skillsOffered = list.slice(0, 30);
    }
    if (skillsWanted !== undefined) {
      const list = Array.isArray(skillsWanted)
        ? skillsWanted
        : String(skillsWanted || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
      user.skillsWanted = list.slice(0, 30);
    }

    await user.save();
    const fresh = await User.findById(req.user.id).select("-password");
    const avgRating =
      fresh.ratings.length > 0
        ? fresh.ratings.reduce((sum, r) => sum + r.value, 0) /
          fresh.ratings.length
        : 0;
    res.json({
      ...fresh.toObject(),
      avgRating: Math.round(avgRating * 10) / 10,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ======================
// PROFILE - Public profile by ID
// ======================
router.get("/profile/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Calculate average rating
    const avgRating = user.ratings.length > 0 
      ? user.ratings.reduce((sum, r) => sum + r.value, 0) / user.ratings.length 
      : 0;

    res.json({
      ...user.toObject(),
      avgRating: Math.round(avgRating * 10) / 10,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ======================
// RATE USER
// ======================
router.post("/rate", authMiddleware, async (req, res) => {
  try {
    const { userId, value, review } = req.body;
    const score = Number(value);
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return res.status(400).json({ message: "Rating must be 1–5" });
    }

    // Prevent self-rating
    if (String(userId) === String(req.user.id)) {
      return res.status(400).json({ message: "Cannot rate yourself" });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already rated
    const existingRating = targetUser.ratings.find(
      (r) => String(r.fromUser) === String(req.user.id)
    );
    if (existingRating) {
      return res.status(400).json({ message: "Already rated this user" });
    }

    targetUser.ratings.push({
      value: score,
      review: review != null ? String(review).slice(0, 500) : "",
      fromUser: req.user.id,
    });

    await targetUser.save();

    res.json({ message: "Rating added successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ======================
// PROTECTED ROUTE (DASHBOARD)
// ======================
router.get("/protected", authMiddleware, (req, res) => {
  res.json({
    message: "Welcome to Dashboard 🚀",
    userId: req.user.id,
  });
});

module.exports = router;


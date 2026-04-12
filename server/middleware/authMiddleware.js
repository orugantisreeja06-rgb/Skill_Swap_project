const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const authHeader = req.header("Authorization");

  // ❌ No header
  if (!authHeader) {
    return res.status(401).json({ message: "No token" });
  }

  // ✅ Extract token from "Bearer <token>"
  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: String(decoded.id) };
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};
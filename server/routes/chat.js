const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const Message = require("../models/Message");
const User = require("../models/User");

// ✅ Get chat history with specific user (bidirectional)
router.get("/:userId", authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.userId;

    // Fetch all messages between current user and target user
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: targetUserId },
        { sender: targetUserId, receiver: currentUserId },
      ],
    })
      .populate("sender", "name")  // Add sender name
      .populate("receiver", "name") // Add receiver name
      .sort({ createdAt: 1 }); // Oldest first

    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;


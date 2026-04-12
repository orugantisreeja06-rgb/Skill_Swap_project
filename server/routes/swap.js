const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const Swap = require("../models/Swap");

// ======================
// SEND SWAP REQUEST
// ======================
router.post("/request", authMiddleware, async (req, res) => {
  try {
    const { toUser, skillOffered, skillRequested } = req.body;

    if (!toUser || String(toUser) === String(req.user.id)) {
      return res.status(400).json({ message: "Invalid recipient" });
    }

    const duplicate = await Swap.findOne({
      fromUser: req.user.id,
      toUser,
      status: "pending",
    });
    if (duplicate) {
      return res.status(400).json({
        message: "You already have a pending request to this user",
      });
    }

    const swap = new Swap({
      fromUser: req.user.id,
      toUser,
      skillOffered,
      skillRequested,
    });

    await swap.save();

    res.json({ message: "Swap request sent" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ======================
// GET MY REQUESTS
// ======================
router.get("/requests", authMiddleware, async (req, res) => {
  try {
    const swaps = await Swap.find({
      toUser: req.user.id,
    }).populate("fromUser", "name email");

    res.json(swaps);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// ======================
// SENT REQUESTS (outgoing)
// ======================
router.get("/sent", authMiddleware, async (req, res) => {
  try {
    const swaps = await Swap.find({ fromUser: req.user.id })
      .populate("toUser", "name email")
      .sort({ createdAt: -1 });

    res.json(swaps);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// ======================
// ACCEPT / REJECT (recipient) or CANCEL (sender)
// ======================
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const next = String(status || "");

    if (!["accepted", "rejected", "cancelled"].includes(next)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const swap = await Swap.findById(req.params.id);
    if (!swap) {
      return res.status(404).json({ message: "Not found" });
    }

    if (swap.status !== "pending") {
      return res.status(400).json({ message: "This request is already resolved" });
    }

    const isRecipient = String(swap.toUser) === String(req.user.id);
    const isSender = String(swap.fromUser) === String(req.user.id);

    if (next === "cancelled") {
      if (!isSender) {
        return res.status(403).json({ message: "Only the sender can withdraw" });
      }
    } else if (!isRecipient) {
      return res.status(403).json({ message: "Not allowed" });
    }

    swap.status = next;
    await swap.save();

    res.json(swap);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
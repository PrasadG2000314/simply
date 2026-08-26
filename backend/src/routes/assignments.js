const express = require("express");
const Assignment = require("../models/Assignment");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

// ─── POST /api/assignments/submit (Protected) ────────────────────────────────
router.post("/submit", protect, async (req, res) => {
  try {
    const {
      title,
      description,
      requirements,
      deliverables,
      deadline,
      attachment,
      attachmentName,
    } = req.body;

    if (!title || !description || !deadline) {
      return res.status(400).json({
        success: false,
        message: "Assignment title, description, and deadline are required.",
      });
    }

    // Check current user credit balance
    const freshUser = await User.findById(req.user._id);
    if (!freshUser || (freshUser.credits || 0) < 1) {
      return res.status(400).json({
        success: false,
        message: "Insufficient coins! You need at least 1 available coin to submit an assignment.",
      });
    }

    // Move 1 coin from available credits to holdCredits
    freshUser.credits = (freshUser.credits || 0) - 1;
    freshUser.holdCredits = (freshUser.holdCredits || 0) + 1;
    await freshUser.save({ validateBeforeSave: false });

    // Create assignment submission
    const newAssignment = await Assignment.create({
      userId: req.user._id,
      userName: req.user.fullName,
      userEmail: req.user.email,
      title,
      description,
      requirements: requirements || "",
      deliverables: deliverables || "",
      deadline: new Date(deadline),
      attachment: attachment || "",
      attachmentName: attachmentName || "",
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Assignment submitted successfully! 1 coin placed on hold.",
      assignment: newAssignment,
      availableCredits: freshUser.credits,
      holdCredits: freshUser.holdCredits,
    });
  } catch (error) {
    console.error("Assignment submission error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit assignment. Please try again.",
    });
  }
});

// ─── GET /api/assignments/my-assignments (Protected) ────────────────────────
router.get("/my-assignments", protect, async (req, res) => {
  try {
    const assignments = await Assignment.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      assignments,
    });
  } catch (error) {
    console.error("Get my assignments error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your assignments.",
    });
  }
});

module.exports = router;

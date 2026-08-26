const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const PaymentSlip = require("../models/PaymentSlip");
const Assignment = require("../models/Assignment");
const { adminProtect } = require("../middleware/adminAuth");

const router = express.Router();

// ─── POST /api/admin/login ────────────────────────────────────────────────────
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Username and password are required.",
    });
  }

  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "simply@admin2024";

  if (username !== adminUsername || password !== adminPassword) {
    return res.status(401).json({
      success: false,
      message: "Invalid admin credentials.",
    });
  }

  // Sign admin-specific JWT
  const token = jwt.sign(
    { role: "admin", username: adminUsername },
    process.env.ADMIN_JWT_SECRET || "admin_secret_change_this",
    { expiresIn: "8h" }
  );

  res.status(200).json({
    success: true,
    message: "Admin login successful.",
    token,
    admin: { username: adminUsername },
  });
});

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
router.get("/users", adminProtect, async (req, res) => {
  try {
    const users = await User.find()
      .select("fullName email credits holdCredits createdAt token")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: users.length,
      users: users.map((u) => ({
        id: u._id,
        fullName: u.fullName,
        email: u.email,
        credits: u.credits || 0,
        holdCredits: u.holdCredits || 0,
        createdAt: u.createdAt,
        hasActiveToken: !!u.token,
      })),
    });
  } catch (error) {
    console.error("Admin get users error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ─── GET /api/admin/stats ────────────────────────────────────────────────────
router.get("/stats", adminProtect, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newToday = await User.countDocuments({ createdAt: { $gte: today } });

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const newThisWeek = await User.countDocuments({ createdAt: { $gte: weekAgo } });

    const pendingSlips = await PaymentSlip.countDocuments({ status: "pending" });
    const pendingAssignments = await Assignment.countDocuments({ status: "pending" });

    res.status(200).json({
      success: true,
      stats: { totalUsers, newToday, newThisWeek, pendingSlips, pendingAssignments },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ─── GET /api/admin/slips ────────────────────────────────────────────────────
router.get("/slips", adminProtect, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const slips = await PaymentSlip.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: slips.length,
      slips,
    });
  } catch (error) {
    console.error("Admin get slips error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch payment slips." });
  }
});

// ─── PUT /api/admin/slips/:id/approve ───────────────────────────────────────
router.put("/slips/:id/approve", adminProtect, async (req, res) => {
  try {
    const slip = await PaymentSlip.findById(req.params.id);
    if (!slip) {
      return res.status(404).json({ success: false, message: "Payment slip not found." });
    }

    if (slip.status === "approved") {
      return res.status(400).json({ success: false, message: "Payment slip is already approved." });
    }

    // Update slip status
    slip.status = "approved";
    await slip.save();

    // Increment customer coins/credits in database
    const user = await User.findByIdAndUpdate(
      slip.userId,
      { $inc: { credits: slip.credits } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: `Payment slip approved successfully! ${slip.credits} coins credited to ${slip.userName}.`,
      slip,
      updatedCredits: user ? user.credits : undefined,
    });
  } catch (error) {
    console.error("Admin approve slip error:", error);
    res.status(500).json({ success: false, message: "Failed to approve payment slip." });
  }
});

// ─── PUT /api/admin/slips/:id/reject ────────────────────────────────────────
router.put("/slips/:id/reject", adminProtect, async (req, res) => {
  try {
    const { adminNote } = req.body;
    const slip = await PaymentSlip.findById(req.params.id);

    if (!slip) {
      return res.status(404).json({ success: false, message: "Payment slip not found." });
    }

    if (slip.status === "approved") {
      return res.status(400).json({
        success: false,
        message: "Cannot reject an already approved payment slip.",
      });
    }

    slip.status = "rejected";
    if (adminNote) slip.adminNote = adminNote;
    await slip.save();

    res.status(200).json({
      success: true,
      message: "Payment slip rejected.",
      slip,
    });
  } catch (error) {
    console.error("Admin reject slip error:", error);
    res.status(500).json({ success: false, message: "Failed to reject payment slip." });
  }
});

// ─── GET /api/admin/assignments ─────────────────────────────────────────────
router.get("/assignments", adminProtect, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const assignments = await Assignment.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: assignments.length,
      assignments,
    });
  } catch (error) {
    console.error("Admin get assignments error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch assignments." });
  }
});

// ─── PUT /api/admin/assignments/:id/approve ──────────────────────────────────
router.put("/assignments/:id/approve", adminProtect, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found." });
    }

    if (assignment.status === "approved") {
      return res.status(400).json({ success: false, message: "Assignment is already approved." });
    }

    assignment.status = "approved";
    await assignment.save();

    // Held coin disappears (decrement holdCredits by 1)
    await User.findByIdAndUpdate(assignment.userId, {
      $inc: { holdCredits: -1 },
    });

    res.status(200).json({
      success: true,
      message: "Assignment approved successfully! Held coin consumed.",
      assignment,
    });
  } catch (error) {
    console.error("Admin approve assignment error:", error);
    res.status(500).json({ success: false, message: "Failed to approve assignment." });
  }
});

// ─── PUT /api/admin/assignments/:id/reject ───────────────────────────────────
router.put("/assignments/:id/reject", adminProtect, async (req, res) => {
  try {
    const { adminNote } = req.body;
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found." });
    }

    if (assignment.status === "approved") {
      return res.status(400).json({
        success: false,
        message: "Cannot reject an already approved assignment.",
      });
    }

    assignment.status = "rejected";
    if (adminNote) assignment.adminNote = adminNote;
    await assignment.save();

    // Refund 1 coin back to customer (decrement holdCredits by 1, increment credits by 1)
    await User.findByIdAndUpdate(assignment.userId, {
      $inc: { holdCredits: -1, credits: 1 },
    });

    res.status(200).json({
      success: true,
      message: "Assignment rejected. 1 coin refunded to customer's available balance.",
      assignment,
    });
  } catch (error) {
    console.error("Admin reject assignment error:", error);
    res.status(500).json({ success: false, message: "Failed to reject assignment." });
  }
});

module.exports = router;


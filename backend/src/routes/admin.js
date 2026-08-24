const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
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
      .select("fullName email createdAt token")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: users.length,
      users: users.map((u) => ({
        id: u._id,
        fullName: u.fullName,
        email: u.email,
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

    res.status(200).json({
      success: true,
      stats: { totalUsers, newToday, newThisWeek },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;

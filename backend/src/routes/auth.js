const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

// ─── Helper: Sign JWT token ───────────────────────────────────────────────────
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Validate required fields
    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Full name, email, and password are required.",
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // Create new user (password auto-hashed via pre-save hook)
    const user = await User.create({ fullName, email, password });

    // Generate JWT token
    const token = signToken(user._id);

    // Save token to user document
    user.token = token;
    await user.save({ validateBeforeSave: false });

    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Register error:", error);

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }

    res.status(500).json({ success: false, message: "Server error. Please try again." });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // Find user and include password field for comparison
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email address or password.",
      });
    }

    // Compare entered password against stored hash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email address or password.",
      });
    }

    // Generate new JWT token
    const token = signToken(user._id);

    // Update stored token
    user.token = token;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: "Logged in successfully.",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error. Please try again." });
  }
});

// ─── GET /api/auth/me (Protected) ────────────────────────────────────────────
router.get("/me", protect, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({ success: false, message: "Server error. Please try again." });
  }
});

// ─── POST /api/auth/logout (Protected) ────────────────────────────────────────
router.post("/logout", protect, async (req, res) => {
  try {
    // Clear stored token from user document
    await User.findByIdAndUpdate(req.user._id, { token: null });

    res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ success: false, message: "Server error. Please try again." });
  }
});

module.exports = router;

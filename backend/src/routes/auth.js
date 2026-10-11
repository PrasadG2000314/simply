const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const { sendPasswordResetEmail, verifySMTP } = require("../utils/mailer");

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
    const { username, fullName, email, password } = req.body;
    const finalUsername = (username || fullName || "").toLowerCase().trim();

    // Validate required fields
    if (!finalUsername || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email, and password are required.",
      });
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ username: finalUsername });
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: "Username is already taken. Please choose a different username.",
      });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // Create new user (password auto-hashed via pre-save hook)
    const user = await User.create({
      username: finalUsername,
      fullName: finalUsername,
      email: email.toLowerCase(),
      password,
    });

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
        username: user.username,
        fullName: user.username,
        email: user.email,
        credits: user.credits || 0,
        holdCredits: user.holdCredits || 0,
        officialCredits: user.officialCredits || 0,
        officialHoldCredits: user.officialHoldCredits || 0,
        apiCredits: user.apiCredits || 0,
        apiHoldCredits: user.apiHoldCredits || 0,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Register error:", error);

    // Handle Mongoose validation / duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || "field";
      return res.status(409).json({
        success: false,
        message: `This ${field} is already taken. Please choose another one.`,
      });
    }

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
    const { identifier, email, username, password } = req.body;
    const loginKey = (identifier || email || username || "").toLowerCase().trim();

    if (!loginKey || !password) {
      return res.status(400).json({
        success: false,
        message: "Username or Email and password are required.",
      });
    }

    // Find user by either email OR username
    const user = await User.findOne({
      $or: [{ email: loginKey }, { username: loginKey }],
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid username/email or password.",
      });
    }

    // Compare entered password against stored hash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid username/email or password.",
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
        username: user.username || user.fullName,
        fullName: user.username || user.fullName,
        email: user.email,
        credits: user.credits || 0,
        holdCredits: user.holdCredits || 0,
        officialCredits: user.officialCredits || 0,
        officialHoldCredits: user.officialHoldCredits || 0,
        apiCredits: user.apiCredits || 0,
        apiHoldCredits: user.apiHoldCredits || 0,
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
        username: req.user.username || req.user.fullName,
        fullName: req.user.username || req.user.fullName,
        email: req.user.email,
        credits: req.user.credits || 0,
        holdCredits: req.user.holdCredits || 0,
        officialCredits: req.user.officialCredits || 0,
        officialHoldCredits: req.user.officialHoldCredits || 0,
        apiCredits: req.user.apiCredits || 0,
        apiHoldCredits: req.user.apiHoldCredits || 0,
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

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = (email || "").toLowerCase().trim();

    if (!cleanEmail) {
      return res.status(400).json({
        success: false,
        message: "Please provide your email address.",
      });
    }

    const user = await User.findOne({ email: cleanEmail });

    // Always return success even if user not found to prevent user enumeration
    if (!user) {
      console.log(`ℹ️ [Forgot Password] Requested for '${cleanEmail}' but user was NOT found in DB.`);
      return res.status(200).json({
        success: true,
        message: "If an account exists with this email, a password reset link has been sent.",
      });
    }

    console.log(`🚀 [Forgot Password] User found for '${cleanEmail}'. Generating token and dispatching email...`);

    // Generate random unhashed reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Store SHA256 hashed token in DB with 1-hour expiration
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour

    await user.save({ validateBeforeSave: false });

    // Build reset URL
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${resetToken}`;

    // Send reset email
    await sendPasswordResetEmail({
      to: user.email,
      resetUrl,
      userName: user.fullName || user.username,
    });

    res.status(200).json({
      success: true,
      message: "If an account exists with this email, a password reset link has been sent.",
      // Include devPreview only in non-production for easy testing
      ...(process.env.NODE_ENV !== "production" ? { devResetUrl: resetUrl } : {}),
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send password reset email. Please try again later.",
    });
  }
});

// ─── GET /api/auth/verify-reset-token ────────────────────────────────────────
router.get("/verify-reset-token", async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: "Token is required.",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: "Password reset link is invalid or has expired.",
      });
    }

    res.status(200).json({
      success: true,
      valid: true,
      message: "Token is valid.",
    });
  } catch (error) {
    console.error("Verify reset token error:", error);
    res.status(500).json({
      success: false,
      valid: false,
      message: "Server error while verifying token.",
    });
  }
});

// ─── POST /api/auth/reset-password ───────────────────────────────────────────
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: "Reset token and new password are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long.",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Password reset link is invalid or has expired. Please request a new one.",
      });
    }

    // Update password (pre-save hook will hash it automatically)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Your password has been successfully reset. You can now log in.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
});

// ─── GET /api/auth/test-smtp ─────────────────────────────────────────────────
router.get("/test-smtp", async (req, res) => {
  try {
    const result = await verifySMTP();
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

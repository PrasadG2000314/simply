const express = require("express");
const jwt = require("jsonwebtoken");
const PaymentSlip = require("../models/PaymentSlip");
const User = require("../models/User");

const router = express.Router();

// ─── POST /api/payments/upload-slip ──────────────────────────────────────────
router.post("/upload-slip", async (req, res) => {
  try {
    const { packageName, credits, amount, slipImage, userName, userEmail } = req.body;

    if (!packageName || !credits || !amount || !slipImage) {
      return res.status(400).json({
        success: false,
        message: "Package name, credits, amount, and payment slip image are required.",
      });
    }

    let userId = null;
    let finalUserName = userName || "Customer";
    let finalUserEmail = userEmail ? userEmail.toLowerCase() : "";

    // Extract user from JWT token if provided
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      const token = req.headers.authorization.split(" ")[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");
        if (user) {
          userId = user._id;
          finalUserName = user.fullName;
          finalUserEmail = user.email.toLowerCase();
        }
      } catch (e) {
        // Token verification failed; fallback to body parameters
      }
    }

    // If userId not found via token, try looking up user by email in DB
    if (!userId && finalUserEmail) {
      const existingUser = await User.findOne({ email: finalUserEmail });
      if (existingUser) {
        userId = existingUser._id;
        finalUserName = existingUser.fullName || finalUserName;
      }
    }

    // Create payment slip in MongoDB Database
    const newSlip = await PaymentSlip.create({
      userId,
      userName: finalUserName,
      userEmail: finalUserEmail,
      packageName,
      credits: Number(credits),
      amount: Number(amount),
      slipImage,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Payment slip submitted successfully. Awaiting admin approval.",
      slip: newSlip,
    });
  } catch (error) {
    console.error("Upload slip error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload payment slip. Please try again.",
    });
  }
});

// ─── GET /api/payments/my-slips ──────────────────────────────────────────────
router.get("/my-slips", async (req, res) => {
  try {
    let query = {};
    let userEmail = req.query.email ? req.query.email.toLowerCase() : "";

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      const token = req.headers.authorization.split(" ")[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (user) {
          query = { $or: [{ userId: user._id }, { userEmail: user.email.toLowerCase() }] };
        }
      } catch (e) {}
    }

    if (!query.$or && userEmail) {
      query = { userEmail };
    }

    const slips = await PaymentSlip.find(query).sort({ createdAt: -1 });

    const pendingCredits = slips
      .filter((s) => s.status === "pending")
      .reduce((sum, s) => sum + s.credits, 0);

    res.status(200).json({
      success: true,
      slips,
      pendingCredits,
    });
  } catch (error) {
    console.error("Get my slips error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment slips.",
    });
  }
});

module.exports = router;

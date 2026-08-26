const express = require("express");
const PaymentSlip = require("../models/PaymentSlip");
const { protect } = require("../middleware/auth");

const router = express.Router();

// ─── POST /api/payments/upload-slip (Protected) ──────────────────────────────
router.post("/upload-slip", protect, async (req, res) => {
  try {
    const { packageName, credits, amount, slipImage } = req.body;

    if (!packageName || !credits || !amount || !slipImage) {
      return res.status(400).json({
        success: false,
        message: "Package name, credits, amount, and payment slip image are required.",
      });
    }

    const newSlip = await PaymentSlip.create({
      userId: req.user._id,
      userName: req.user.fullName,
      userEmail: req.user.email,
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

// ─── GET /api/payments/my-slips (Protected) ──────────────────────────────────
router.get("/my-slips", protect, async (req, res) => {
  try {
    const slips = await PaymentSlip.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });

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

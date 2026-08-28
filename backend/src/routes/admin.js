const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const PaymentSlip = require("../models/PaymentSlip");
const Document = require("../models/Document");
const { adminProtect } = require("../middleware/adminAuth");
const { saveFileToDisk } = require("../utils/fileStorage");

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
    const pendingAssignments = await Document.countDocuments({ status: "pending" });

    res.status(200).json({
      success: true,
      stats: { totalUsers, newToday, newThisWeek, pendingSlips, pendingAssignments, pendingDocuments: pendingAssignments },
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
    let user = null;
    if (slip.userId) {
      user = await User.findByIdAndUpdate(
        slip.userId,
        { $inc: { credits: slip.credits } },
        { new: true }
      );
    } else if (slip.userEmail) {
      user = await User.findOneAndUpdate(
        { email: slip.userEmail.toLowerCase() },
        { $inc: { credits: slip.credits } },
        { new: true }
      );
    }

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

const handleGetAdminDocuments = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const documents = await Document.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: documents.length,
      documents,
      assignments: documents,
    });
  } catch (error) {
    console.error("Admin get documents error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch documents." });
  }
};

router.get("/documents", adminProtect, handleGetAdminDocuments);
router.get("/assignments", adminProtect, handleGetAdminDocuments);

const handleApproveDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found." });
    }

    if (document.status === "approved") {
      return res.status(400).json({ success: false, message: "Document is already approved." });
    }

    const { resultFile, resultFileName, similarityScore, aiScore, adminNote } = req.body;

    document.status = "approved";
    if (resultFile) {
      document.resultFile = saveFileToDisk(resultFile, resultFileName || `turnitin_report_${document.title}`, document.userName || document.userEmail);
    }
    if (resultFileName) document.resultFileName = resultFileName;
    if (similarityScore !== undefined && similarityScore !== null && similarityScore !== "") {
      document.similarityScore = Number(similarityScore);
    }
    if (aiScore !== undefined && aiScore !== null && aiScore !== "") {
      document.aiScore = Number(aiScore);
    }
    if (adminNote) document.adminNote = adminNote;

    await document.save();

    // Held coin disappears (decrement holdCredits by 1)
    if (document.userId) {
      await User.findByIdAndUpdate(document.userId, { $inc: { holdCredits: -1 } });
    } else if (document.userEmail) {
      await User.findOneAndUpdate({ email: document.userEmail.toLowerCase() }, { $inc: { holdCredits: -1 } });
    }

    res.status(200).json({
      success: true,
      message: "Document approved successfully! Held coin consumed.",
      document,
      assignment: document,
    });
  } catch (error) {
    console.error("Admin approve document error:", error);
    res.status(500).json({ success: false, message: "Failed to approve document." });
  }
};

router.put("/documents/:id/approve", adminProtect, handleApproveDocument);
router.put("/assignments/:id/approve", adminProtect, handleApproveDocument);

const handleRejectDocument = async (req, res) => {
  try {
    const { adminNote } = req.body;
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found." });
    }

    if (document.status === "approved") {
      return res.status(400).json({
        success: false,
        message: "Cannot reject an already approved document.",
      });
    }

    document.status = "rejected";
    if (adminNote) document.adminNote = adminNote;
    await document.save();

    // Refund 1 coin back to customer (decrement holdCredits by 1, increment credits by 1)
    if (document.userId) {
      await User.findByIdAndUpdate(document.userId, { $inc: { holdCredits: -1, credits: 1 } });
    } else if (document.userEmail) {
      await User.findOneAndUpdate({ email: document.userEmail.toLowerCase() }, { $inc: { holdCredits: -1, credits: 1 } });
    }

    res.status(200).json({
      success: true,
      message: "Document rejected. 1 coin refunded to customer's available balance.",
      document,
      assignment: document,
    });
  } catch (error) {
    console.error("Admin reject document error:", error);
    res.status(500).json({ success: false, message: "Failed to reject document." });
  }
};

router.put("/documents/:id/reject", adminProtect, handleRejectDocument);
router.put("/assignments/:id/reject", adminProtect, handleRejectDocument);

module.exports = router;


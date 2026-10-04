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
      .select("fullName email credits holdCredits officialCredits officialHoldCredits apiCredits apiHoldCredits createdAt token")
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
        officialCredits: u.officialCredits || 0,
        officialHoldCredits: u.officialHoldCredits || 0,
        apiCredits: u.apiCredits || 0,
        apiHoldCredits: u.apiHoldCredits || 0,
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
    const pendingOfficialSlips = await PaymentSlip.countDocuments({ status: "pending", coinType: { $ne: "api" } });
    const pendingApiSlips = await PaymentSlip.countDocuments({ status: "pending", coinType: "api" });

    const pendingAssignments = await Document.countDocuments({ status: "pending" });
    const pendingOfficialAssignments = await Document.countDocuments({ status: "pending", scanType: { $ne: "api" } });
    const pendingApiAssignments = await Document.countDocuments({ status: "pending", scanType: "api" });

    const totalOfficialDocuments = await Document.countDocuments({ scanType: { $ne: "api" } });
    const totalApiDocuments = await Document.countDocuments({ scanType: "api" });

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        newToday,
        newThisWeek,
        pendingSlips,
        pendingOfficialSlips,
        pendingApiSlips,
        pendingAssignments,
        pendingOfficialAssignments,
        pendingApiAssignments,
        totalOfficialDocuments,
        totalApiDocuments,
        pendingDocuments: pendingAssignments,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ─── GET /api/admin/slips ────────────────────────────────────────────────────
router.get("/slips", adminProtect, async (req, res) => {
  try {
    const { status, coinType } = req.query;
    const filter = {};
    if (status && status !== "all") filter.status = status;
    if (coinType && coinType !== "all") {
      if (coinType === "official") {
        filter.coinType = { $ne: "api" };
      } else {
        filter.coinType = coinType;
      }
    }

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

    const isApiSlip = slip.coinType === "api" || (slip.packageName && slip.packageName.toLowerCase().includes("api"));
    const incUpdate = isApiSlip
      ? { $inc: { apiCredits: slip.credits, credits: slip.credits } }
      : { $inc: { officialCredits: slip.credits, credits: slip.credits } };

    // Increment customer coins/credits in database
    let user = null;
    if (slip.userId) {
      user = await User.findByIdAndUpdate(slip.userId, incUpdate, { new: true });
    } else if (slip.userEmail) {
      user = await User.findOneAndUpdate({ email: slip.userEmail.toLowerCase() }, incUpdate, { new: true });
    }

    res.status(200).json({
      success: true,
      message: `Payment slip approved successfully! ${slip.credits} ${isApiSlip ? "API Tool" : "Official Turnitin"} coins credited to ${slip.userName}.`,
      slip,
      updatedCredits: user ? user.credits : undefined,
      officialCredits: user ? user.officialCredits : undefined,
      apiCredits: user ? user.apiCredits : undefined,
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
    const { status, scanType } = req.query;
    const filter = {};
    if (status && status !== "all") filter.status = status;
    if (scanType && scanType !== "all") {
      if (scanType === "official") {
        filter.scanType = { $ne: "api" };
      } else {
        filter.scanType = scanType;
      }
    }

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

    const wasAlreadyApproved = document.status === "approved";
    const { resultFile, resultFileName, resultFiles, similarityScore, aiScore, adminNote } = req.body;

    document.status = "approved";

    let savedFilesList = [];

    if (Array.isArray(resultFiles) && resultFiles.length > 0) {
      savedFilesList = resultFiles.map((rf, idx) => {
        const fileContent = rf.fileData || rf.url || rf.file || "";
        const fileName = rf.name || rf.fileName || `turnitin_report_${idx + 1}_${document.title}`;
        const savedUrl = saveFileToDisk(fileContent, fileName, document.userName || document.userEmail);
        return {
          url: savedUrl,
          name: fileName,
        };
      });
      document.resultFiles = savedFilesList;
      if (savedFilesList[0]) {
        document.resultFile = savedFilesList[0].url;
        document.resultFileName = savedFilesList[0].name;
      }
    } else if (resultFile) {
      const savedUrl = saveFileToDisk(resultFile, resultFileName || `turnitin_report_${document.title}`, document.userName || document.userEmail);
      document.resultFile = savedUrl;
      document.resultFileName = resultFileName || "Turnitin_Report.pdf";
      document.resultFiles = [{ url: savedUrl, name: document.resultFileName }];
    }

    if (similarityScore !== undefined && similarityScore !== null && similarityScore !== "") {
      document.similarityScore = Number(similarityScore);
    }
    if (aiScore !== undefined && aiScore !== null && aiScore !== "") {
      document.aiScore = Number(aiScore);
    }
    if (adminNote !== undefined) {
      document.adminNote = adminNote;
    }

    await document.save();

    // Held coin disappears (decrement holdCredits by 1) if not already approved
    if (!wasAlreadyApproved) {
      const isApiScan = document.scanType === "api";
      const holdDec = isApiScan
        ? { apiHoldCredits: -1, holdCredits: -1 }
        : { officialHoldCredits: -1, holdCredits: -1 };

      if (document.userId) {
        await User.findByIdAndUpdate(document.userId, { $inc: holdDec });
      } else if (document.userEmail) {
        await User.findOneAndUpdate({ email: document.userEmail.toLowerCase() }, { $inc: holdDec });
      }
    }

    res.status(200).json({
      success: true,
      message: "Document approved successfully! Turnitin report(s) saved.",
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

    // Refund 1 coin back to customer based on scanType
    const isApiScan = document.scanType === "api";
    const refundInc = isApiScan
      ? { apiHoldCredits: -1, apiCredits: 1, holdCredits: -1, credits: 1 }
      : { officialHoldCredits: -1, officialCredits: 1, holdCredits: -1, credits: 1 };

    if (document.userId) {
      await User.findByIdAndUpdate(document.userId, { $inc: refundInc });
    } else if (document.userEmail) {
      await User.findOneAndUpdate({ email: document.userEmail.toLowerCase() }, { $inc: refundInc });
    }

    res.status(200).json({
      success: true,
      message: `Document rejected. 1 ${isApiScan ? "API Tool" : "Official Turnitin"} coin refunded to customer's available balance.`,
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

const handleRefundDocument = async (req, res) => {
  try {
    const { adminNote } = req.body;
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found." });
    }

    if (document.status === "refunded") {
      return res.status(400).json({
        success: false,
        message: "Document has already been refunded.",
      });
    }

    const wasPending = document.status === "pending";
    document.status = "refunded";
    if (adminNote) document.adminNote = adminNote;
    await document.save();

    // Refund 1 coin back to customer available credits based on scanType
    const isApiScan = document.scanType === "api";
    let user = null;
    const refundUpdate = wasPending
      ? (isApiScan
          ? { apiHoldCredits: -1, apiCredits: 1, holdCredits: -1, credits: 1 }
          : { officialHoldCredits: -1, officialCredits: 1, holdCredits: -1, credits: 1 })
      : (isApiScan
          ? { apiCredits: 1, credits: 1 }
          : { officialCredits: 1, credits: 1 });

    if (document.userId) {
      user = await User.findByIdAndUpdate(document.userId, { $inc: refundUpdate }, { new: true });
    } else if (document.userEmail) {
      user = await User.findOneAndUpdate({ email: document.userEmail.toLowerCase() }, { $inc: refundUpdate }, { new: true });
    }

    res.status(200).json({
      success: true,
      message: `Document refunded successfully! 1 ${isApiScan ? "API Tool" : "Official Turnitin"} coin returned to customer's available balance.`,
      document,
      assignment: document,
      updatedCredits: user ? user.credits : undefined,
      officialCredits: user ? user.officialCredits : undefined,
      apiCredits: user ? user.apiCredits : undefined,
    });
  } catch (error) {
    console.error("Admin refund document error:", error);
    res.status(500).json({ success: false, message: "Failed to refund document." });
  }
};

router.put("/documents/:id/refund", adminProtect, handleRefundDocument);
router.put("/assignments/:id/refund", adminProtect, handleRefundDocument);

module.exports = router;


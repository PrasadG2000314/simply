const express = require("express");
const Document = require("../models/Document");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

// ─── POST /api/documents/submit (Protected) ──────────────────────────────────
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

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Document title is required.",
      });
    }

    // Check current user credit balance
    const freshUser = await User.findById(req.user._id);
    if (!freshUser || (freshUser.credits || 0) < 1) {
      return res.status(400).json({
        success: false,
        message: "Insufficient coins! You need at least 1 available coin to submit a document.",
      });
    }

    // Move 1 coin from available credits to holdCredits
    freshUser.credits = (freshUser.credits || 0) - 1;
    freshUser.holdCredits = (freshUser.holdCredits || 0) + 1;
    await freshUser.save({ validateBeforeSave: false });

    // Create document submission
    const newDocument = await Document.create({
      userId: req.user._id,
      userName: req.user.fullName,
      userEmail: req.user.email,
      title,
      description: description || title,
      requirements: requirements || "",
      deliverables: deliverables || "",
      deadline: deadline ? new Date(deadline) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      attachment: attachment || "",
      attachmentName: attachmentName || "",
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Document submitted successfully! 1 coin placed on hold.",
      document: newDocument,
      assignment: newDocument,
      availableCredits: freshUser.credits,
      holdCredits: freshUser.holdCredits,
    });
  } catch (error) {
    console.error("Document submission error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit document. Please try again.",
    });
  }
});

// ─── POST /api/documents/:id/cancel (Protected) ──────────────────────────────
router.post("/:id/cancel", protect, async (req, res) => {
  try {
    const documentId = req.params.id;
    const document = await Document.findOne({ _id: documentId, userId: req.user._id });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document submission not found.",
      });
    }

    if (document.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Document is already cancelled.",
      });
    }

    // Refund 1 coin from holdCredits back to available credits if pending
    const freshUser = await User.findById(req.user._id);
    if (freshUser && document.status === "pending") {
      freshUser.credits = (freshUser.credits || 0) + 1;
      freshUser.holdCredits = Math.max(0, (freshUser.holdCredits || 0) - 1);
      await freshUser.save({ validateBeforeSave: false });
    }

    document.status = "cancelled";
    await document.save();

    res.status(200).json({
      success: true,
      message: "Document submission cancelled. 1 coin returned to available balance.",
      documentId: document._id,
      availableCredits: freshUser ? freshUser.credits : 0,
      holdCredits: freshUser ? freshUser.holdCredits : 0,
    });
  } catch (error) {
    console.error("Cancel document error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel document submission.",
    });
  }
});

// ─── GET /api/documents/my-documents (Protected) ─────────────────────────────
const handleGetMyDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      documents,
      assignments: documents,
    });
  } catch (error) {
    console.error("Get my documents error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your documents.",
    });
  }
};

router.get("/my-documents", protect, handleGetMyDocuments);
router.get("/my-assignments", protect, handleGetMyDocuments);

module.exports = router;

const express = require("express");
const jwt = require("jsonwebtoken");
const Document = require("../models/Document");
const User = require("../models/User");

const router = express.Router();

const { saveFileToDisk } = require("../utils/fileStorage");

// ─── POST /api/documents/submit ──────────────────────────────────────────────
router.post("/submit", async (req, res) => {
  try {
    const {
      title,
      description,
      requirements,
      deliverables,
      deadline,
      attachment,
      attachmentName,
      userName,
      userEmail,
    } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Document title is required.",
      });
    }

    let userId = null;
    let finalUserName = userName || "Customer";
    let finalUserEmail = userEmail ? userEmail.toLowerCase() : "";

    // Extract user from token if provided
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
      } catch (e) {}
    }

    let freshUser = null;
    if (userId) {
      freshUser = await User.findById(userId);
    } else if (finalUserEmail) {
      freshUser = await User.findOne({ email: finalUserEmail });
      if (freshUser) userId = freshUser._id;
    }

    // Check and update coin balance in DB
    if (freshUser) {
      freshUser.credits = Math.max(0, (freshUser.credits || 0) - 1);
      freshUser.holdCredits = (freshUser.holdCredits || 0) + 1;
      await freshUser.save({ validateBeforeSave: false });
    }

    // Save attachment file to server disk in user folder
    const savedAttachmentPath = saveFileToDisk(attachment, attachmentName || title, finalUserName || finalUserEmail);

    // Create document submission in MongoDB Database
    const newDocument = await Document.create({
      userId,
      userName: finalUserName,
      userEmail: finalUserEmail,
      title,
      description: description || title,
      requirements: requirements || "",
      deliverables: deliverables || "",
      deadline: deadline ? new Date(deadline) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      attachment: savedAttachmentPath,
      attachmentName: attachmentName || "",
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Document submitted successfully! 1 coin placed on hold.",
      document: newDocument,
      assignment: newDocument,
      availableCredits: freshUser ? freshUser.credits : 0,
      holdCredits: freshUser ? freshUser.holdCredits : 1,
    });
  } catch (error) {
    console.error("Document submission error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit document. Please try again.",
    });
  }
});

// ─── POST /api/documents/:id/cancel ──────────────────────────────────────────
router.post("/:id/cancel", async (req, res) => {
  try {
    const documentId = req.params.id;
    const document = await Document.findById(documentId);

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
    let freshUser = null;
    if (document.userId) {
      freshUser = await User.findById(document.userId);
    } else if (document.userEmail) {
      freshUser = await User.findOne({ email: document.userEmail.toLowerCase() });
    }

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

// ─── GET /api/documents/my-documents ─────────────────────────────────────────
const handleGetMyDocuments = async (req, res) => {
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

    const documents = await Document.find(query).sort({
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

router.get("/my-documents", handleGetMyDocuments);
router.get("/my-assignments", handleGetMyDocuments);

module.exports = router;

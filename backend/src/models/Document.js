const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    userEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    title: {
      type: String,
      required: [true, "Document title is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    requirements: {
      type: String,
      default: "",
      trim: true,
    },
    deliverables: {
      type: String,
      default: "",
      trim: true,
    },
    deadline: {
      type: Date,
      default: Date.now,
    },
    attachment: {
      type: String,
      default: "",
    },
    attachmentName: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    adminNote: {
      type: String,
      default: "",
    },
    resultFile: {
      type: String,
      default: "",
    },
    resultFileName: {
      type: String,
      default: "",
    },
    similarityScore: {
      type: Number,
      default: null,
    },
    aiScore: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Document", DocumentSchema);

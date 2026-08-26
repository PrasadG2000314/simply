const mongoose = require("mongoose");

const AssignmentSchema = new mongoose.Schema(
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
      required: [true, "Assignment title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Assignment description is required"],
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
      required: [true, "Assignment deadline date and time is required"],
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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Assignment", AssignmentSchema);

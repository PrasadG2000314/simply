const mongoose = require("mongoose");

const PaymentSlipSchema = new mongoose.Schema(
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
    packageName: {
      type: String,
      required: [true, "Package name is required"],
    },
    credits: {
      type: Number,
      required: [true, "Credits amount is required"],
      min: 1,
    },
    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
    },
    slipImage: {
      type: String,
      required: [true, "Payment slip image is required"],
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

module.exports = mongoose.model("PaymentSlip", PaymentSlipSchema);

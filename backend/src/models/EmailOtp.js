const mongoose = require("mongoose");

const EmailOtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 600, // MongoDB TTL index: expires in 10 minutes (600 seconds)
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("EmailOtp", EmailOtpSchema);

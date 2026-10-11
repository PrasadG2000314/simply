const express = require("express");
const { sendEmail } = require("../utils/mailer");

const router = express.Router();

// ─── POST /api/contact ────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and message are required.",
      });
    }

    const recipient = process.env.SMTP_USER || "support@turnipass.com";
    const mailSubject = subject ? `[Contact Form] ${subject}` : `[Contact Form] New message from ${name}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #0f172a; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">New Contact Form Message</h2>
        <p><strong>From:</strong> ${name} (&lt;<a href="mailto:${email}">${email}</a>&gt;)</p>
        <p><strong>Subject:</strong> ${subject || "No subject provided"}</p>
        <div style="margin-top: 20px; padding: 15px; background: #f8fafc; border-left: 4px solid #2563eb; border-radius: 4px;">
          <p style="white-space: pre-wrap; margin: 0; color: #334155;">${message}</p>
        </div>
        <p style="margin-top: 24px; font-size: 12px; color: #94a3b8;">This message was submitted via the contact form on turnipass.com.</p>
      </div>
    `;

    await sendEmail({
      to: recipient,
      subject: mailSubject,
      html,
      text: `From: ${name} (${email})\nSubject: ${subject}\n\nMessage:\n${message}`,
    });

    res.status(200).json({
      success: true,
      message: "Your message has been sent successfully. We will get back to you shortly.",
    });
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message. Please try again or email us directly at support@turnipass.com.",
    });
  }
});

module.exports = router;

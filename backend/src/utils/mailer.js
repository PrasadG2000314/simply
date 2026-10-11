const nodemailer = require("nodemailer");

/**
 * Creates and returns a Nodemailer transporter.
 * Configured for Namecheap Private Email or any standard SMTP server.
 */
const createTransporter = () => {
  const host = process.env.SMTP_HOST || "mail.privateemail.com";
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  const secure = process.env.SMTP_SECURE !== undefined ? process.env.SMTP_SECURE === "true" : port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn("⚠️  [Mailer] SMTP_USER or SMTP_PASS not set. Emails will be logged to console in dev mode.");
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

/**
 * Send Password Reset Email with TurniPass branding
 */
const sendPasswordResetEmail = async ({ to, resetUrl, userName }) => {
  const transporter = createTransporter();
  const displayName = userName || "User";
  const fromAddress = process.env.EMAIL_FROM || `"TurniPass Support" <${process.env.SMTP_USER || "support@turnipass.com"}>`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Password</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
    }
    .container {
      max-width: 560px;
      margin: 32px auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: #0f172a;
      padding: 28px 24px;
      text-align: center;
    }
    .logo-text {
      color: #ffffff;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .logo-sub {
      color: #38bdf8;
    }
    .body-content {
      padding: 32px 28px;
    }
    h1 {
      font-size: 20px;
      font-weight: 700;
      margin-top: 0;
      margin-bottom: 12px;
      color: #0f172a;
    }
    p {
      font-size: 15px;
      line-height: 1.6;
      color: #475569;
      margin-top: 0;
      margin-bottom: 16px;
    }
    .btn-container {
      text-align: center;
      margin: 28px 0;
    }
    .btn {
      display: inline-block;
      background: #2563eb;
      color: #ffffff !important;
      padding: 13px 32px;
      font-size: 15px;
      font-weight: 700;
      text-decoration: none;
      border-radius: 10px;
      box-shadow: 0 4px 8px rgba(37, 99, 235, 0.25);
    }
    .notice {
      background: #f1f5f9;
      border-left: 4px solid #2563eb;
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 13px;
      color: #475569;
      margin: 20px 0;
    }
    .url-fallback {
      font-size: 12px;
      color: #94a3b8;
      word-break: break-all;
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      margin-top: 24px;
    }
    .url-fallback a {
      color: #2563eb;
      text-decoration: underline;
    }
    .footer {
      background: #f8fafc;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-text">Turni<span class="logo-sub">Pass</span></div>
    </div>
    <div class="body-content">
      <h1>Password Reset Request</h1>
      <p>Hello <strong>${displayName}</strong>,</p>
      <p>We received a request to reset the password associated with your TurniPass account. Click the button below to choose a new password:</p>
      
      <div class="btn-container">
        <a href="${resetUrl}" class="btn" target="_blank">Reset My Password</a>
      </div>

      <div class="notice">
        ⏰ <strong>Security Notice:</strong> This reset link is valid for <strong>1 hour</strong>. If you did not make this request, you can safely ignore this email — your account remains completely secure.
      </div>

      <div class="url-fallback">
        If the button above does not work, copy and paste this URL into your browser:<br />
        <a href="${resetUrl}">${resetUrl}</a>
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} TurniPass. All rights reserved.<br />
      Need help? Reach out to <a href="mailto:support@turnipass.com" style="color: #64748b;">support@turnipass.com</a>
    </div>
  </div>
</body>
</html>
  `;

  // Dev fallback: log to console if no SMTP credentials configured
  if (!transporter) {
    console.log("\n=======================================================");
    console.log("📧 [SIMULATED EMAIL - DEV MODE]");
    console.log(`To: ${to}`);
    console.log(`Subject: Password Reset Request - TurniPass`);
    console.log(`Reset Link: ${resetUrl}`);
    console.log("=======================================================\n");
    return { success: true, simulated: true, resetUrl };
  }

  const mailOptions = {
    from: fromAddress,
    to,
    subject: "Reset Your TurniPass Password",
    html,
  };

  try {
    return await transporter.sendMail(mailOptions);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("\n⚠️  [Mailer Warning] Failed to send email via SMTP:", err.message);
      console.log("=======================================================");
      console.log("📧 [SIMULATED EMAIL - LOCAL DEV FALLBACK]");
      console.log(`To: ${to}`);
      console.log(`Subject: Reset Your TurniPass Password`);
      console.log(`Reset Link: ${resetUrl}`);
      console.log("=======================================================\n");
      return { success: true, simulated: true, resetUrl };
    }
    throw err;
  }
};

/**
 * General purpose email sender
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = createTransporter();
  const fromAddress = process.env.EMAIL_FROM || `"TurniPass Support" <${process.env.SMTP_USER || "support@turnipass.com"}>`;

  if (!transporter) {
    console.log("\n=======================================================");
    console.log("📧 [SIMULATED EMAIL - DEV MODE]");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log("=======================================================\n");
    return { success: true, simulated: true };
  }

  try {
    return await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
      text,
    });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("⚠️  [Mailer Warning] Failed to send email via SMTP:", err.message);
      return { success: true, simulated: true };
    }
    throw err;
  }
};

const verifySMTP = async () => {
  const transporter = createTransporter();
  if (!transporter) {
    return { success: false, message: "SMTP credentials not provided in environment." };
  }
  try {
    await transporter.verify();
    return { success: true, message: "SMTP connection verified successfully!" };
  } catch (err) {
    return { success: false, message: err.message, code: err.code, response: err.response };
  }
};

module.exports = {
  createTransporter,
  sendPasswordResetEmail,
  sendEmail,
  verifySMTP,
};

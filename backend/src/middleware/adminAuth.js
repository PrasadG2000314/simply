const jwt = require("jsonwebtoken");

const adminProtect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Admin access denied. No token provided.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden. Admin privileges required.",
      });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired admin token.",
    });
  }
};

module.exports = { adminProtect };

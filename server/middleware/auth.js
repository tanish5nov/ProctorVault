const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token, access denied',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userPersona = decoded.persona;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token is not valid',
      error: error.message,
    });
  }
};

// Middleware to check if user is Admin
const isAdmin = (req, res, next) => {
  if (req.userPersona !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin rights required.',
    });
  }
  next();
};

// Middleware to check if user is Student
const isStudent = (req, res, next) => {
  if (req.userPersona !== 'Student') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Student access required.',
    });
  }
  next();
};

module.exports = { auth, isAdmin, isStudent };

const jwt = require('jsonwebtoken');
const Session = require('../models/Session');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Access denied. No token provided.'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if session exists and is valid
    const session = await Session.findOne({
      token,
      userId: decoded.userId,
      isValid: true
    });

    if (!session) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid or expired session.'
      });
    }

    // Update session's last activity
    session.lastActivity = new Date();
    await session.save();

    req.user = decoded;
    req.token = token;
    req.session = session;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token expired'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

module.exports = auth; 
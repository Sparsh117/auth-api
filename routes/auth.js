const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const auth = require('../middleware/auth');

// Helper function to get client info
const getClientInfo = (req) => {
  return {
    userAgent: req.get('user-agent') || 'unknown',
    ipAddress: req.ip || req.connection.remoteAddress
  };
};

// Helper function to generate token and create session
const createUserSession = async (userId, req) => {
  try {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });

    const { userAgent, ipAddress } = getClientInfo(req);
    const session = new Session({
      userId,
      token,
      userAgent,
      ipAddress
    });

    await session.save();
    return { token, session };
  } catch (error) {
    console.error('Session creation error:', error);
    throw new Error('Error creating user session');
  }
};

// Helper function to invalidate sessions
const invalidateSession = async (token) => {
  try {
    const session = await Session.findOneAndUpdate(
      { token },
      { isValid: false },
      { new: true }
    );
    return session;
  } catch (error) {
    console.error('Session invalidation error:', error);
    throw new Error('Error invalidating session');
  }
};

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide all required fields'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User already exists'
      });
    }

    const user = new User({ name, email, password });
    await user.save();

    const { token, session } = await createUserSession(user._id, req);

    res.status(201).json({
      status: 'success',
      data: {
        token,
        session: {
          id: session._id,
          userAgent: session.userAgent,
          lastActivity: session.lastActivity
        },
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error creating user',
      error: error.message
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const { token, session } = await createUserSession(user._id, req);

    res.json({
      status: 'success',
      data: {
        token,
        session: {
          id: session._id,
          userAgent: session.userAgent,
          lastActivity: session.lastActivity
        },
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error logging in',
      error: error.message
    });
  }
});

// Get user dashboard
router.get('/dashboard', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password')
      .lean();

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Get all active sessions for the user
    const activeSessions = await Session.find({
      userId: user._id,
      isValid: true
    }).select('userAgent ipAddress lastActivity').lean();

    res.json({
      status: 'success',
      data: {
        user,
        currentSession: req.session,
        activeSessions
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error accessing dashboard',
      error: error.message
    });
  }
});

// Logout current session
router.post('/logout', auth, async (req, res) => {
  try {
    // Invalidate the current session
    const session = await Session.findOneAndUpdate(
      { _id: req.session._id },
      { 
        isValid: false,
        $set: { lastActivity: new Date() }
      },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'Session not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Logged out successfully',
      data: {
        session: {
          id: session._id,
          lastActivity: session.lastActivity
        }
      }
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error logging out',
      error: error.message
    });
  }
});

// Logout from all devices
router.post('/logout-all', auth, async (req, res) => {
  try {
    const result = await Session.updateMany(
      { userId: req.user.userId, isValid: true },
      { 
        isValid: false,
        $set: { lastActivity: new Date() }
      }
    );

    res.json({
      status: 'success',
      message: 'Logged out from all devices successfully',
      data: {
        sessionsTerminated: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error logging out from all devices',
      error: error.message
    });
  }
});

// Get active sessions
router.get('/sessions', auth, async (req, res) => {
  try {
    const sessions = await Session.find({
      userId: req.user.userId,
      isValid: true
    })
    .select('userAgent ipAddress lastActivity createdAt')
    .sort({ lastActivity: -1 })
    .lean();

    res.json({
      status: 'success',
      data: {
        sessions,
        currentSessionId: req.session._id
      }
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching sessions',
      error: error.message
    });
  }
});

module.exports = router; 
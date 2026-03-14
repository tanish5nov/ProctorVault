const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const MOCK_USERS = {
  'admin@example.com': {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'Admin123',
    persona: 'Admin',
  },
  'student@example.com': {
    name: 'Student User',
    email: 'student@example.com',
    password: 'Student123',
    persona: 'Student',
  },
};

// Generate JWT Token
const generateToken = (id, persona) => {
  return jwt.sign({ id, persona }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

const ensureMockUser = async (email) => {
  const mockUser = MOCK_USERS[email];
  if (!mockUser) {
    return null;
  }

  let user = await User.findOne({ email: mockUser.email }).select('+password');

  if (!user) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(mockUser.password, salt);

    user = await User.create({
      name: mockUser.name,
      email: mockUser.email,
      password: hashedPassword,
      persona: mockUser.persona,
    });

    user = await User.findOne({ email: mockUser.email }).select('+password');
  }

  return user;
};

// Register User
exports.register = async (req, res) => {
  try {
    const { name, email, password, persona } = req.body;

    // Validation
    if (!name || !email || !password || !persona) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, password, persona',
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    user = new User({
      name,
      email,
      password: hashedPassword,
      persona,
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id, user.persona);

    // Send response
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        persona: user.persona,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in registration',
      error: error.message,
    });
  }
};

// Login User
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const normalizedEmail = email.toLowerCase();

    let user = null;
    if (MOCK_USERS[normalizedEmail] && MOCK_USERS[normalizedEmail].password === password) {
      user = await ensureMockUser(normalizedEmail);
    } else {
      // Find user by email, include password field
      user = await User.findOne({ email: normalizedEmail }).select('+password');
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate token
    const token = generateToken(user._id, user.persona);

    // Send response
    res.status(200).json({
      success: true,
      message: 'User logged in successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        persona: user.persona,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in login',
      error: error.message,
    });
  }
};

// Get Current User
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User fetched successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        persona: user.persona,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message,
    });
  }
};

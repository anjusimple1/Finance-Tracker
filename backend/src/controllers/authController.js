const User = require('../models/User');
const mongoose = require('mongoose');
const generateToken = require('../utils/generateToken');
const fallbackStore = require('../store/fallbackStore');

const formatUser = (userDoc) => ({
  id: userDoc._id,
  name: userDoc.name,
  email: userDoc.email,
});

/**
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const useFallback = mongoose.connection.readyState !== 1;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    const userExists = useFallback
      ? await fallbackStore.findUserByEmail(email)
      : await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = useFallback
      ? await fallbackStore.createUser({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password,
        })
      : await User.create({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password,
        });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: formatUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    console.error('register error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const useFallback = mongoose.connection.readyState !== 1;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = useFallback
      ? await fallbackStore.findUserByEmail(email)
      : await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = useFallback
      ? await fallbackStore.checkPassword(user, password)
      : await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user: formatUser(user),
    });
  } catch (error) {
    console.error('login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

module.exports = { register, login };

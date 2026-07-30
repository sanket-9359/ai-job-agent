const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

function buildUserPayload(user) {
  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
  };
}

function buildToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    logger.warn('JWT_SECRET is not defined. Using fallback secret. Set JWT_SECRET in your environment for production.');
  }

  return jwt.sign(
    { userId: user._id.toString(), email: user.email },
    secret || 'change-me-in-production',
    { expiresIn: '7d' }
  );
}

exports.register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Full name is required and must be at least 2 characters.' });
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'A valid email address is required.' });
    }

    if (!password || typeof password !== 'string' || !PASSWORD_REGEX.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email is already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      passwordHash,
    });

    const token = buildToken(user);
    return res.status(201).json({
      success: true,
      data: {
        user: buildUserPayload(user),
        token,
      },
    });
  } catch (err) {
    logger.error('register error:', err);
    return res.status(500).json({ success: false, message: 'Failed to register user.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'A valid email address is required.' });
    }

    if (!password || typeof password !== 'string' || password.length === 0) {
      return res.status(400).json({ success: false, message: 'Password is required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = buildToken(user);
    return res.json({
      success: true,
      data: {
        user: buildUserPayload(user),
        token,
      },
    });
  } catch (err) {
    logger.error('login error:', err);
    return res.status(500).json({ success: false, message: 'Failed to login.' });
  }
};

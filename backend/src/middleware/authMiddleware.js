const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authorization token missing.' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'change-me-in-production';
    const payload = jwt.verify(token, secret);
    const user = await User.findById(payload.userId).select('_id fullName email');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid authorization token.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid authorization token.' });
  }
};

const express = require('express');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt'); // Added bcrypt for password verification
const router = express.Router();
const Student = require('../models/student');

// In production, load secret from environment variables.
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';
const TOKEN_EXPIRY = '5m';

// An in-memory set to store used nonces for one-time token use.
// In production, use a persistent store like Redis.
const usedNonces = new Set();

// Apply rate limiting on the /verify endpoint
const verifyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10 // Limit each IP to 10 requests per minute
});

// GET login page (no registration, preloaded data only)
router.get('/login', (req, res) => {
  res.render('auth/login'); // See login.ejs below
});

// POST login - now expects email, studentID, and password
router.post('/login', async (req, res) => {
  try {
    const { email, studentID, password } = req.body;
    const student = await Student.findOne({ email, studentID });
    if (!student) {
      req.session.message = { type: 'danger', text: 'Invalid credentials' };
      return res.redirect('/login');
    }
    // Verify password using bcrypt compare
    const passwordMatch = await bcrypt.compare(password, student.password);
    if (!passwordMatch) {
      req.session.message = { type: 'danger', text: 'Invalid credentials' };
      return res.redirect('/login');
    }
    
    // Generate a random nonce for one-time use
    const nonce = crypto.randomBytes(16).toString('hex');
    
    // Create JWT containing only studentID, email, and nonce.
    const token = jwt.sign(
      { studentID: student.studentID, email: student.email, nonce },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );
    // Generate QR code data URL with the token.
    const qrCodeUrl = await QRCode.toDataURL(token);
    res.render('auth/qr', { qrCodeUrl, student });
  } catch (error) {
    console.error('Login error:', error);
    req.session.message = { type: 'danger', text: 'Login failed. Please try again.' };
    res.redirect('/login');
  }
});

// Add GET /qr route to display the student's QR code
router.get('/qr', async (req, res) => {
  // Ensure the student is logged in (assumes req.session.user is set upon login)
  if (!req.session.user || req.session.user.role !== 'student') {
    return res.redirect('/login');
  }
  const student = req.session.user;
  // Generate a new nonce for one-time token use
  const nonce = crypto.randomBytes(16).toString('hex');
  // Create JWT token with studentID, email, and nonce
  const token = jwt.sign(
    { studentID: student.studentID, email: student.email, nonce },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
  // Generate QR code data URL from token
  const qrCodeUrl = await QRCode.toDataURL(token);
  res.render('auth/qr', { qrCodeUrl, student });
});

// POST /verify - to be called by the librarian's scanning system
router.post('/verify', verifyLimiter, (req, res) => {
  const { token } = req.body;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Prevent token replay: check if this nonce was already used.
    if (usedNonces.has(decoded.nonce)) {
      return res.status(401).json({ success: false, message: 'Token already used' });
    }
    // Mark nonce as used.
    usedNonces.add(decoded.nonce);
    // Optionally, schedule removal of the nonce after token expiry to save memory.
    setTimeout(() => {
      usedNonces.delete(decoded.nonce);
    }, 5 * 60 * 1000); // 5 minutes

    res.json({ success: true, student: decoded });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
});

module.exports = router;

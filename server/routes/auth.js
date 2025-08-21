const express = require('express');
const { userLogin, adminLogin } = require('../controllers/authController');
const router = express.Router();

// @route   POST /api/auth/user
// @desc    User login (name only)
// @access  Public
router.post('/user', userLogin);

// @route   POST /api/auth/admin
// @desc    Admin login (key-based)
// @access  Public
router.post('/admin', adminLogin);

module.exports = router;

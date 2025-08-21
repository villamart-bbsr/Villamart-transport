const express = require('express');
const { createEntry, getAllEntries, getUserEntries } = require('../controllers/entryController');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// @route   POST /api/entries
// @desc    Create new entry
// @access  Private (User)
router.post('/', auth, createEntry);

// @route   GET /api/entries
// @desc    Get all entries (admin) or user entries
// @access  Private
router.get('/', auth, (req, res) => {
  if (req.user.type === 'admin') {
    getAllEntries(req, res);
  } else {
    getUserEntries(req, res);
  }
});

module.exports = router;

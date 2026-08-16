const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { getPayees } = require('../controllers/userController');

// Get all users who can be paid (admin and hr)
router.get('/payees', auth, authorize('admin', 'hr'), getPayees);

module.exports = router; 
const express = require('express');
const router = express.Router();
const { register, login, getCurrentUser } = require('../controllers/authController');
const { getStudents } = require('../controllers/userController');
const { auth, isAdmin } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', auth, getCurrentUser);
router.get('/students', auth, isAdmin, getStudents);

module.exports = router;

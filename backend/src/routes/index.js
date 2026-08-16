console.log('>>> index.js (main router) loaded at', __filename);
const express = require('express');
const router = express.Router();
const employeeRoutes = require('./employeeRoutes');
const departmentRoutes = require('./departmentRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const payrollRoutes = require('./payrollRoutes');
const authRoutes = require('./authRoutes');
const managerRoutes = require('./managerRoutes');
const progressRoutes = require('./progressRoutes');
const userRoutes = require('./userRoutes');
const ticketRoutes = require('./ticketRoutes');

// Authentication routes
router.use('/auth', authRoutes);

// User routes (for general user actions)
router.use('/users', userRoutes);

// Employee routes
router.use('/employees', employeeRoutes);

// Manager routes
router.use('/managers', managerRoutes);

// Department routes
router.use('/departments', departmentRoutes);

// Attendance routes
router.use('/attendance', attendanceRoutes);

// Payroll routes
router.use('/payroll', payrollRoutes);

// Progress routes
router.use('/progress', progressRoutes);

// Ticket routes (SLA ticket escalation system)
router.use('/tickets', ticketRoutes);

module.exports = router; 
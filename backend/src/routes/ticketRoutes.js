const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const {
  createTicket,
  getTicketQueue,
  assignTicket,
  getMyReportedTickets,
  getMyAssignedTickets,
  getAllTickets,
  getTicketById,
  updateTicketStatus,
  escalateTicket,
  closeTicket,
  deleteTicket,
  getTicketStats
} = require('../controllers/ticketController');

// Create a new ticket (anyone - employee reports issue)
router.post('/', auth, createTicket);

// Get dashboard statistics (admin, hr, manager)
router.get('/stats', auth, authorize('admin', 'hr', 'manager'), getTicketStats);

// Get ticket queue (all "New" unassigned tickets) - HR/Manager only
router.get('/queue', auth, authorize('admin', 'hr', 'manager'), getTicketQueue);

// Get tickets I reported (employee)
router.get('/my-reported', auth, getMyReportedTickets);

// Get tickets assigned to me (anyone can check their assignments)
router.get('/my-assigned', auth, getMyAssignedTickets);

// Get all tickets (admin/hr: full history including resolved/closed)
router.get('/', auth, authorize('admin', 'hr'), getAllTickets);

// Get ticket by ID
router.get('/:id', auth, getTicketById);

// Assign ticket and set priority (HR/Manager)
router.post('/:ticketId/assign', auth, authorize('admin', 'hr', 'manager'), assignTicket);

// Update ticket status
router.put('/:id/status', auth, updateTicketStatus);

// Escalate ticket (manager, admin)
router.post('/:id/escalate', auth, authorize('admin', 'hr', 'manager'), escalateTicket);

// Close ticket
router.post('/:id/close', auth, closeTicket);

// Delete ticket (admin only)
router.delete('/:id', auth, authorize('admin'), deleteTicket);

module.exports = router;

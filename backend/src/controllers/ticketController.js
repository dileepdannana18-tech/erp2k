const Ticket = require('../models/Ticket');
const Employee = require('../models/Employee');
const User = require('../models/User');

// Employee: Create a new ticket (simple - just report issue)
exports.createTicket = async (req, res) => {
  try {
    const { title, description, category, dueDate: requestedDueDate } = req.body;

    // Get employee record for current user
    const employee = await Employee.findOne({ email: req.user.email });
    if (!employee) {
      return res.status(404).json({ message: 'Employee record not found' });
    }

    // Set default due date to 3 days from now if none provided
    let dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);
    if (requestedDueDate) {
      const parsedDueDate = new Date(requestedDueDate);
      if (!Number.isNaN(parsedDueDate.getTime())) {
        dueDate = parsedDueDate;
      }
    }

    const ticket = new Ticket({
      title,
      description,
      category: category || 'Other',
      reportedBy: employee._id,
      dueDate,
      status: 'New',
      priority: 'Medium', // HR will set priority
      escalationLevel: 0
    });
    // add initial history entry
    ticket.history = [
      {
        status: 'New',
        changedBy: employee._id,
        notes: 'Ticket reported',
        timestamp: new Date()
      }
    ];

    await ticket.save();
    await ticket.populate([
      { path: 'reportedBy', select: 'name email department' }
    ]);

    res.status(201).json(ticket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// HR/Manager: Get ticket queue (all "New" unassigned tickets)
exports.getTicketQueue = async (req, res) => {
  try {
    const tickets = await Ticket.find({ status: 'New' })
      .populate('reportedBy', 'name email department')
      .populate('history.changedBy', 'name email')
      .sort({ createdAt: 1 });

    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// HR/Manager: Assign ticket and set priority
exports.assignTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { assignedTo, priority } = req.body;

    // Determine reviewer: prefer Employee record, fall back to User record
    let reviewerId = null;
    const reviewerEmployee = await Employee.findOne({ email: req.user.email });
    if (reviewerEmployee) {
      reviewerId = reviewerEmployee._id;
    } else {
      const reviewerUser = await User.findOne({ email: req.user.email });
      if (reviewerUser) reviewerId = reviewerUser._id;
    }
    if (!reviewerId) reviewerId = req.user._id;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    // set fields
    ticket.assignedTo = assignedTo;
    ticket.priority = priority || 'Medium';
    ticket.reviewedBy = reviewerId;
    ticket.status = 'Assigned';
    ticket.updatedAt = new Date();

    // include human-readable assignedTo name when available
    let assignedName = assignedTo;
    try {
      const assEmp = await Employee.findById(assignedTo);
      if (assEmp) assignedName = assEmp.name;
    } catch (e) {}

    // push history entry
    ticket.history = ticket.history || [];
    ticket.history.push({
      status: 'Assigned',
      changedBy: reviewerId,
      notes: `Assigned to ${assignedName}`,
      timestamp: new Date()
    });

    await ticket.save();

    await ticket
      .populate('reportedBy', 'name email department')
      .populate('assignedTo', 'name email')
      .populate('reviewedBy', 'name email')
      .populate('history.changedBy', 'name email');

    res.status(200).json(ticket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Employee: Get tickets they reported
exports.getMyReportedTickets = async (req, res) => {
  try {
    const employee = await Employee.findOne({ email: req.user.email });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const tickets = await Ticket.find({ reportedBy: employee._id })
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('reviewedBy', 'name email')
      .populate('escalatedTo', 'name email')
      .populate('history.changedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// HR/Manager/Assigned: Get tickets assigned to me
exports.getMyAssignedTickets = async (req, res) => {
  try {
    const employee = await Employee.findOne({ email: req.user.email });
    // Admins/HR often have no Employee record; they are not assignees.
    if (!employee) {
      return res.status(200).json([]);
    }

    const tickets = await Ticket.find({
      assignedTo: employee._id,
      status: { $ne: 'Closed' }
    })
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('reviewedBy', 'name email')
      .populate('escalatedTo', 'name email')
      .populate('history.changedBy', 'name email')
      .sort({ priority: -1, dueDate: 1 });

    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all tickets (admin/hr can view all)
exports.getAllTickets = async (req, res) => {
  try {
    const { status, priority } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const tickets = await Ticket.find(filter)
      .populate('reportedBy', 'name email department')
      .populate('assignedTo', 'name email')
      .populate('reviewedBy', 'name email')
      .populate('escalatedTo', 'name email')
      .populate('history.changedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get ticket by ID
exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('reportedBy', 'name email department')
      .populate('assignedTo', 'name email')
      .populate('reviewedBy', 'name email')
      .populate('history.changedBy', 'name email')
      .populate('escalatedTo', 'name email');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update ticket status (assigned person or manager)
exports.updateTicketStatus = async (req, res) => {
  try {
    const { status, resolutionNotes } = req.body;

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    // update fields
    ticket.status = status;
    ticket.resolutionNotes = resolutionNotes || ticket.resolutionNotes;
    ticket.updatedAt = new Date();

    // push history entry
    ticket.history = ticket.history || [];
    ticket.history.push({
      status,
      changedBy: req.user._id,
      notes: resolutionNotes || `${req.user.name || req.user.email} updated status to ${status}`,
      timestamp: new Date()
    });

    await ticket.save();

    await ticket
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('reviewedBy', 'name email')
      .populate('escalatedTo', 'name email')
      .populate('history.changedBy', 'name email');

    res.status(200).json(ticket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Escalate ticket (internal - called by cron job or manually)
exports.escalateTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (ticket.escalationLevel >= 3) {
      return res.status(400).json({ message: 'Ticket already at maximum escalation level' });
    }

    ticket.escalationLevel += 1;
    ticket.updatedAt = new Date();

    const assignee = ticket.assignedTo ? await Employee.findById(ticket.assignedTo) : null;

    if (ticket.escalationLevel === 1 && assignee?.manager) {
      ticket.escalatedTo = assignee.manager;
    } else if (ticket.escalationLevel === 2) {
      const deptHead = await Employee.findOne({
        department: assignee?.department,
        role: { $in: ['hr', 'admin'] }
      });
      if (deptHead) {
        const deptHeadUser = await User.findOne({ email: deptHead.email });
        ticket.escalatedTo = deptHeadUser ? deptHeadUser._id : undefined;
      }
    }

    await ticket.save();

    res.status(200).json({
      message: `Ticket escalated to level ${ticket.escalationLevel}`,
      ticket
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Close ticket
exports.closeTicket = async (req, res) => {
  try {
    const { resolutionNotes } = req.body;

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      {
        status: 'Closed',
        resolutionNotes,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    )
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('reviewedBy', 'name email')
      .populate('escalatedTo', 'name email');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.status(200).json(ticket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete ticket (admin only)
exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.status(200).json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get dashboard statistics
exports.getTicketStats = async (req, res) => {
  try {
    const totalTickets = await Ticket.countDocuments();
    const newTickets = await Ticket.countDocuments({ status: 'New' });
    const assignedTickets = await Ticket.countDocuments({ status: 'Assigned' });
    const inProgressTickets = await Ticket.countDocuments({ status: 'In Progress' });
    const resolvedTickets = await Ticket.countDocuments({ status: 'Resolved' });
    const closedTickets = await Ticket.countDocuments({ status: 'Closed' });
    const criticalTickets = await Ticket.countDocuments({ priority: 'Critical', status: { $ne: 'Closed' } });
    const escalatedTickets = await Ticket.countDocuments({ escalationLevel: { $gt: 0 } });
    const overdueTickets = await Ticket.countDocuments({ 
      dueDate: { $lt: new Date() }, 
      status: { $nin: ['Resolved', 'Closed'] } 
    });

    res.status(200).json({
      totalTickets,
      newTickets,
      assignedTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      criticalTickets,
      escalatedTickets,
      overdueTickets
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

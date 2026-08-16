const cron = require('node-cron');
const Ticket = require('../models/Ticket');
const Employee = require('../models/Employee');
const User = require('../models/User');

/**
 * SLA Escalation Job
 * Runs every hour to escalate unresolved tickets past their due date
 */
const initiateSLAEscalationJob = () => {
  console.log('[SLA] Initializing ticket escalation job - runs every hour');

  // Run at minute 0 of every hour
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('[SLA] Running escalation check at', new Date().toISOString());

      // Find all open/assigned/in-progress tickets past their due date
      const now = new Date();
      const expiredTickets = await Ticket.find({
        status: { $in: ['New', 'Assigned', 'In Progress'] },
        dueDate: { $lt: now },
        escalationLevel: { $lt: 3 }
      }).populate('assignedTo', 'name email manager department');

      if (expiredTickets.length === 0) {
        console.log('[SLA] No tickets to escalate');
        return;
      }

      console.log(`[SLA] Found ${expiredTickets.length} tickets to escalate`);

      for (const ticket of expiredTickets) {
        try {
          ticket.escalationLevel += 1;
          ticket.updatedAt = new Date();

          if (ticket.escalationLevel === 1) {
            if (ticket.assignedTo?.manager) {
              ticket.escalatedTo = ticket.assignedTo.manager;
              console.log(`[SLA] Ticket ${ticket._id} escalated to Level 1 (Manager)`);
            }
          } else if (ticket.escalationLevel === 2) {
            const deptHead = await Employee.findOne({
              department: ticket.assignedTo?.department,
              role: { $in: ['hr', 'admin'] }
            });
            if (deptHead) {
              const deptHeadUser = await User.findOne({ email: deptHead.email });
              ticket.escalatedTo = deptHeadUser ? deptHeadUser._id : undefined;
              console.log(`[SLA] Ticket ${ticket._id} escalated to Level 2 (Department Head)`);
            }
          } else if (ticket.escalationLevel === 3) {
            console.log(`[SLA] Ticket ${ticket._id} escalated to Level 3 (CRITICAL - Admin attention required)`);
          }

          await ticket.save();
        } catch (err) {
          console.error(`[SLA] Error escalating ticket ${ticket._id}:`, err.message);
        }
      }

      console.log('[SLA] Escalation check completed');
    } catch (error) {
      console.error('[SLA] Error in escalation job:', error.message);
    }
  });
};

module.exports = initiateSLAEscalationJob;

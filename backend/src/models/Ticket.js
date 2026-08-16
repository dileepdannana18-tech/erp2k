const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a ticket title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a ticket description']
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['New', 'Assigned', 'In Progress', 'Resolved', 'Closed'],
    default: 'New'
  },
  category: {
    type: String,
    enum: ['IT Support', 'HR', 'Finance', 'Operations', 'Other'],
    default: 'Other'
  },
  // Employee who reported the ticket
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  // HR/Manager who reviews and assigns
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    // reviewer can be an Employee or a User (admin/hr who may not have an Employee record)
    ref: 'User'
  },
  // Person who is currently working on it
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  dueDate: {
    type: Date,
    required: [true, 'Please provide a due date']
  },
  escalationLevel: {
    type: Number,
    default: 0,
    min: 0,
    max: 3
  },
  escalatedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolutionNotes: {
    type: String
  },
  // Change history: records of status changes and who made them
  history: [
    {
      status: { type: String },
      changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      notes: { type: String },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Ticket', ticketSchema);

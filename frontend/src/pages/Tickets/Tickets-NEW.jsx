import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Typography,
  CircularProgress,
  Grid,
  IconButton,
  Tabs,
  Tab
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { getUser } from '../../utils/auth';

const Tickets = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const user = getUser();
  const apiUrl = import.meta.env.VITE_API_URL || '';

  // Employee state
  const [myReportedTickets, setMyReportedTickets] = useState([]);
  const [reportDialog, setReportDialog] = useState(false);
  const [reportForm, setReportForm] = useState({
    title: '',
    description: '',
    category: 'Other'
  });

  // HR/Manager state
  const [ticketQueue, setTicketQueue] = useState([]);
  const [myAssignedTickets, setMyAssignedTickets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [assignDialog, setAssignDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [assignForm, setAssignForm] = useState({
    assignedTo: '',
    priority: 'Medium'
  });
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (user) {
      if (user.role === 'employee') {
        fetchMyReportedTickets();
      } else if (user.role === 'admin' || user.role === 'hr' || user.role === 'manager') {
        fetchEmployees();
        fetchTicketQueue();
        fetchMyAssignedTickets();
        fetchStats();
      }
    }
  }, [user]);

  // Employee functions
  const fetchMyReportedTickets = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/tickets/my-reported`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMyReportedTickets(data);
      }
    } catch (err) {
      setError('Error fetching tickets: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReportTicket = () => {
    setReportDialog(true);
  };

  const handleCloseReportDialog = () => {
    setReportDialog(false);
    setReportForm({ title: '', description: '', category: 'Other' });
  };

  const handleSubmitReport = async () => {
    if (!reportForm.title || !reportForm.description) {
      setError('Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reportForm)
      });

      if (response.ok) {
        setSuccessMessage('Ticket reported successfully!');
        setError('');
        setTimeout(() => {
          handleCloseReportDialog();
          fetchMyReportedTickets();
        }, 1500);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to report ticket');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // HR/Manager functions
  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/employees`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const fetchTicketQueue = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/tickets/queue`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTicketQueue(data);
      }
    } catch (err) {
      console.error('Error fetching queue:', err);
    }
  };

  const fetchMyAssignedTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/tickets/my-assigned`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMyAssignedTickets(data);
      }
    } catch (err) {
      console.error('Error fetching assigned:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/tickets/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleOpenAssignDialog = (ticket) => {
    setSelectedTicket(ticket);
    setAssignForm({ assignedTo: '', priority: 'Medium' });
    setAssignDialog(true);
  };

  const handleCloseAssignDialog = () => {
    setAssignDialog(false);
    setSelectedTicket(null);
  };

  const handleSubmitAssign = async () => {
    if (!assignForm.assignedTo) {
      setError('Please select an employee');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/tickets/${selectedTicket._id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(assignForm)
      });

      if (response.ok) {
        setSuccessMessage('Ticket assigned successfully!');
        setError('');
        setTimeout(() => {
          handleCloseAssignDialog();
          fetchTicketQueue();
          fetchStats();
        }, 1500);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to assign ticket');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return 'error';
      case 'High': return 'warning';
      case 'Medium': return 'info';
      case 'Low': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'New': return 'error';
      case 'Assigned': return 'warning';
      case 'In Progress': return 'info';
      case 'Resolved': return 'success';
      case 'Closed': return 'default';
      default: return 'default';
    }
  };

  // Employee view
  if (user?.role === 'employee') {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssignmentIcon /> Report an Issue
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleReportTicket}
          >
            Report New Issue
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              My Reported Issues
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress />
              </Box>
            ) : myReportedTickets.length === 0 ? (
              <Alert severity="info">No tickets reported yet</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Issue</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Priority</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Reported On</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {myReportedTickets.map(ticket => (
                      <TableRow key={ticket._id}>
                        <TableCell>{ticket.title}</TableCell>
                        <TableCell>{ticket.category}</TableCell>
                        <TableCell>
                          <Chip label={ticket.status} color={getStatusColor(ticket.status)} size="small" />
                        </TableCell>
                        <TableCell>
                          <Chip label={ticket.priority} color={getPriorityColor(ticket.priority)} size="small" />
                        </TableCell>
                        <TableCell>{new Date(ticket.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Report Issue Dialog */}
        <Dialog open={reportDialog} onClose={handleCloseReportDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Report an Issue</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <TextField
              label="Issue Title"
              fullWidth
              margin="normal"
              value={reportForm.title}
              onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
              placeholder="Brief title of the issue"
            />
            <TextField
              label="Description"
              fullWidth
              margin="normal"
              multiline
              rows={4}
              value={reportForm.description}
              onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
              placeholder="Detailed description of the issue"
            />
            <TextField
              select
              label="Category"
              fullWidth
              margin="normal"
              value={reportForm.category}
              onChange={(e) => setReportForm({ ...reportForm, category: e.target.value })}
            >
              <MenuItem value="IT Support">IT Support</MenuItem>
              <MenuItem value="HR">HR</MenuItem>
              <MenuItem value="Finance">Finance</MenuItem>
              <MenuItem value="Operations">Operations</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseReportDialog}>Cancel</Button>
            <Button onClick={handleSubmitReport} variant="contained" color="primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Issue'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // HR/Manager view
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <AssignmentIcon /> Ticket Management System
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

      {/* Statistics */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#fce4ec' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  New (Unassigned)
                </Typography>
                <Typography variant="h5" sx={{ color: '#d32f2f' }}>{stats.newTickets}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#fff3e0' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Assigned
                </Typography>
                <Typography variant="h5">{stats.assignedTickets}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#e3f2fd' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  In Progress
                </Typography>
                <Typography variant="h5">{stats.inProgressTickets}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#e8f5e9' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Overdue
                </Typography>
                <Typography variant="h5" sx={{ color: '#f57c00' }}>{stats.overdueTickets}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label={`Ticket Queue (${ticketQueue.length})`} />
          <Tab label={`My Assigned (${myAssignedTickets.length})`} />
        </Tabs>
      </Box>

      {/* Ticket Queue Tab */}
      {tabValue === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Unassigned Tickets - Ready for Review
            </Typography>
            {loading ? (
              <CircularProgress />
            ) : ticketQueue.length === 0 ? (
              <Alert severity="success">No unassigned tickets!</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Issue</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Reported By</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Reported On</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ticketQueue.map(ticket => (
                      <TableRow key={ticket._id}>
                        <TableCell>{ticket.title}</TableCell>
                        <TableCell>{ticket.category}</TableCell>
                        <TableCell>{ticket.reportedBy?.name}</TableCell>
                        <TableCell>{new Date(ticket.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleOpenAssignDialog(ticket)}
                          >
                            Review & Assign
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* My Assigned Tab */}
      {tabValue === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Tickets Assigned to Me
            </Typography>
            {loading ? (
              <CircularProgress />
            ) : myAssignedTickets.length === 0 ? (
              <Alert severity="info">No tickets assigned to you</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Issue</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Priority</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Reported By</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Due Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {myAssignedTickets.map(ticket => (
                      <TableRow key={ticket._id}>
                        <TableCell>{ticket.title}</TableCell>
                        <TableCell>
                          <Chip label={ticket.status} color={getStatusColor(ticket.status)} size="small" />
                        </TableCell>
                        <TableCell>
                          <Chip label={ticket.priority} color={getPriorityColor(ticket.priority)} size="small" />
                        </TableCell>
                        <TableCell>{ticket.reportedBy?.name}</TableCell>
                        <TableCell>{new Date(ticket.dueDate).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Assign Ticket Dialog */}
      <Dialog open={assignDialog} onClose={handleCloseAssignDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Ticket</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedTicket && (
            <>
              <Box sx={{ mb: 2, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {selectedTicket.title}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {selectedTicket.description}
                </Typography>
              </Box>

              <TextField
                select
                label="Assign To"
                fullWidth
                margin="normal"
                value={assignForm.assignedTo}
                onChange={(e) => setAssignForm({ ...assignForm, assignedTo: e.target.value })}
              >
                {employees.map(emp => (
                  <MenuItem key={emp._id} value={emp._id}>
                    {emp.name} ({emp.position})
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Priority"
                fullWidth
                margin="normal"
                value={assignForm.priority}
                onChange={(e) => setAssignForm({ ...assignForm, priority: e.target.value })}
              >
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Critical">Critical</MenuItem>
              </TextField>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAssignDialog}>Cancel</Button>
          <Button onClick={handleSubmitAssign} variant="contained" color="primary" disabled={loading}>
            {loading ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Tickets;

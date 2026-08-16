import React, { useState, useEffect } from 'react';
import { Box, Button, Alert, Typography, List, ListItem, ListItemText, Chip, Divider, Accordion, AccordionSummary, AccordionDetails, TextField, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Card, CardContent, IconButton, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { getUser } from '../../utils/auth';

const Attendance = () => {
  const [geoMessage, setGeoMessage] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const user = getUser();
  const [searchTerms, setSearchTerms] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [markForm, setMarkForm] = useState({
    employee: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    checkIn: '',
    checkOut: ''
  });
  const apiUrl = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'hr') {
      fetchAttendance();
      fetchEmployees();
    } else if (user?.role === 'employee') {
      fetchEmployeeAttendance();
    }
  }, []);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/employees`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const fetchAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/attendance`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Attendance API response:', data);
        setAttendance(data);
      } else {
        setError('Failed to fetch attendance records.');
      }
    } catch (err) {
      setError('Error fetching attendance records.');
    }
  };

  const fetchEmployeeAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/attendance/my-records/all`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        console.log('[Employee] Attendance records:', data);
        setAttendance(data);
        setError('');
      } else {
        setError('Failed to fetch your attendance records.');
      }
    } catch (err) {
      console.error('[Employee] Error fetching attendance:', err);
      setError('Error fetching attendance records.');
    }
  };

  const handleMarkPresent = () => {
    setGeoMessage('');
    setGeoLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${apiUrl}/api/attendance/auto-geolocation`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({ lat: position.coords.latitude, lng: position.coords.longitude })
            });
            const data = await res.json();
            if (res.ok) {
              setGeoMessage(data.message || 'Attendance marked successfully!');
              setSuccessMessage(data.message || 'Attendance marked successfully!');
              fetchEmployeeAttendance();
            } else {
              setGeoMessage(data.message || 'Could not mark attendance.');
            }
          } catch (err) {
            setGeoMessage('Error marking attendance.');
          } finally {
            setGeoLoading(false);
          }
        },
        (err) => {
          setGeoMessage('Geolocation permission denied or unavailable.');
          setGeoLoading(false);
        }
      );
    } else {
      setGeoMessage('Geolocation is not supported by your browser.');
      setGeoLoading(false);
    }
  };

  // Group attendance records by date
  const groupedByDate = attendance.reduce((acc, record) => {
    const recordDate = record.date ? new Date(record.date) : null;
    const dateKey = recordDate
      ? recordDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : '-';
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(record);
    return acc;
  }, {});
  const dateKeys = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a));

  const handleSearchChange = (dateKey, value) => {
    setSearchTerms(prev => ({ ...prev, [dateKey]: value }));
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
    setEditingRecord(null);
    setError('');
    setSuccessMessage('');
    setMarkForm({
      employee: '',
      date: new Date().toISOString().split('T')[0],
      status: 'present',
      checkIn: '',
      checkOut: ''
    });
  };

  const handleEditRecord = (record) => {
    setEditingRecord(record);
    setMarkForm({
      employee: record.employee?._id || '',
      date: record.date ? record.date.split('T')[0] : new Date().toISOString().split('T')[0],
      status: record.status || 'present',
      checkIn: record.checkIn ? new Date(record.checkIn).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : '',
      checkOut: record.checkOut ? new Date(record.checkOut).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : ''
    });
    setOpenDialog(true);
    setError('');
    setSuccessMessage('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRecord(null);
    setMarkForm({
      employee: '',
      date: new Date().toISOString().split('T')[0],
      status: 'present',
      checkIn: '',
      checkOut: ''
    });
  };

  const handleDeleteRecord = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this attendance record?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/attendance/${recordId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSuccessMessage('Attendance record deleted successfully!');
        setTimeout(() => {
          fetchAttendance();
        }, 1500);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to delete attendance record');
      }
    } catch (err) {
      setError('Error deleting attendance record: ' + err.message);
    }
  };

  const handleFormChange = (field, value) => {
    setMarkForm(prev => ({ ...prev, [field]: value }));
  };

  // Helper function to parse date string as local date (not UTC)
  const parseLocalDate = (dateString) => {
    const [year, month, day] = dateString.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  };

  const handleSubmitAttendance = async () => {
    if (!markForm.employee) {
      setError('Please select an employee');
      return;
    }
    if (!markForm.date) {
      setError('Please select a date');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('token');
      const payload = {
        employee: markForm.employee,
        date: markForm.date, // Send as string (YYYY-MM-DD), not Date object
        status: markForm.status
      };

      // Add check-in/out times if provided
      if (markForm.checkIn) {
        const [hours, minutes] = markForm.checkIn.split(':');
        const checkInTime = parseLocalDate(markForm.date);
        checkInTime.setHours(parseInt(hours), parseInt(minutes), 0);
        payload.checkIn = checkInTime;
      }

      if (markForm.checkOut) {
        const [hours, minutes] = markForm.checkOut.split(':');
        const checkOutTime = parseLocalDate(markForm.date);
        checkOutTime.setHours(parseInt(hours), parseInt(minutes), 0);
        payload.checkOut = checkOutTime;
      }

      const url = editingRecord 
        ? `${apiUrl}/api/attendance/${editingRecord._id}`
        : `${apiUrl}/api/attendance`;
      const method = editingRecord ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const successMsg = editingRecord 
          ? 'Attendance record updated successfully!' 
          : 'Attendance marked successfully!';
        setSuccessMessage(successMsg);
        setTimeout(() => {
          handleCloseDialog();
          fetchAttendance();
        }, 1500);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to save attendance');
      }
    } catch (err) {
      setError('Error saving attendance: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role === 'employee') {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            My Attendance
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleMarkPresent}
            disabled={geoLoading}
          >
            {geoLoading ? 'Marking...' : 'Mark Me as Present'}
          </Button>
        </Box>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {geoMessage && (
          <Alert severity="info" sx={{ mb: 2 }}>{geoMessage}</Alert>
        )}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>
        )}

        {attendance.length === 0 ? (
          <Alert severity="info">No attendance records yet</Alert>
        ) : (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                My Attendance History
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <Table>
                  <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Check-In</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Check-Out</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attendance.map(record => (
                      <TableRow key={record._id}>
                        <TableCell>
                          {record.date ? new Date(record.date).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                            color={
                              record.status === 'present' ? 'success' :
                              record.status === 'late' ? 'warning' :
                              'error'
                            }
                            size="small"
                            sx={{ fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell>
                          {record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '-'}
                        </TableCell>
                        <TableCell>
                          {record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    );
  }

  // Admin/HR view
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Attendance Records
        </Typography>
        {(user?.role === 'admin' || user?.role === 'hr') && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
          >
            Mark Attendance
          </Button>
        )}
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
      {dateKeys.length === 0 ? (
        <Typography variant="body1">No attendance records found.</Typography>
      ) : (
        dateKeys.map(dateKey => {
          const searchTerm = searchTerms[dateKey] || '';
          const filteredRecords = groupedByDate[dateKey].filter(record => {
            const empName = record.employee?.name || '';
            return empName.toLowerCase().includes(searchTerm.toLowerCase());
          });
          return (
            <Accordion key={dateKey} sx={{ mb: 2, borderRadius: 2, boxShadow: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>{dateKey}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TextField
                  label="Search employee by name"
                  variant="outlined"
                  size="small"
                  fullWidth
                  sx={{ mb: 2 }}
                  value={searchTerm}
                  onChange={e => handleSearchChange(dateKey, e.target.value)}
                  autoComplete="off"
                />
                {filteredRecords.length === 0 ? (
                  <Typography variant="body2">No employees found for this search.</Typography>
                ) : (
                  filteredRecords.map(record => (
                    <Box key={record._id} sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: 'background.default', boxShadow: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mr: 2 }}>{record.employee?.name || '-'}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                          Dept: <b>{record.employee?.department?.name || '-'}</b>
                        </Typography>
                        <Typography variant="body2" sx={{ mr: 2 }}>
                          Check In: <b>{record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '-'}</b>
                        </Typography>
                        <Chip
                          label={record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          color={
                            record.status === 'present' ? 'success' :
                            record.status === 'late' ? 'warning' :
                            'error'
                          }
                          size="small"
                          sx={{ fontWeight: 700, ml: 1 }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleEditRecord(record)}
                          title="Edit attendance"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleDeleteRecord(record._id)}
                          title="Delete attendance"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  ))
                )}
              </AccordionDetails>
            </Accordion>
          );
        })
      )}

      {/* Dialog for marking/editing attendance */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingRecord ? 'Edit Attendance Record' : 'Mark Attendance'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
          <TextField
            select
            label="Select Employee"
            fullWidth
            margin="normal"
            value={markForm.employee}
            onChange={(e) => handleFormChange('employee', e.target.value)}
          >
            {employees.map(emp => (
              <MenuItem key={emp._id} value={emp._id}>
                {emp.name} ({emp.position})
              </MenuItem>
            ))}
          </TextField>
          <TextField
            type="date"
            label="Date"
            fullWidth
            margin="normal"
            value={markForm.date}
            onChange={(e) => handleFormChange('date', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            select
            label="Status"
            fullWidth
            margin="normal"
            value={markForm.status}
            onChange={(e) => handleFormChange('status', e.target.value)}
          >
            <MenuItem value="present">Present</MenuItem>
            <MenuItem value="absent">Absent</MenuItem>
            <MenuItem value="late">Late</MenuItem>
          </TextField>
          <TextField
            type="time"
            label="Check-in Time"
            fullWidth
            margin="normal"
            value={markForm.checkIn}
            onChange={(e) => handleFormChange('checkIn', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            type="time"
            label="Check-out Time"
            fullWidth
            margin="normal"
            value={markForm.checkOut}
            onChange={(e) => handleFormChange('checkOut', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmitAttendance}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : (editingRecord ? 'Update Attendance' : 'Save Attendance')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Attendance; 
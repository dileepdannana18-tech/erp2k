import React from 'react';
import { Box, Typography, Grid, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const summary = [
  { title: 'Employees', value: 'Manage employees', path: '/app/employees' },
  { title: 'Departments', value: 'View departments', path: '/app/departments' },
  { title: 'Attendance', value: 'View attendance records', path: '/app/attendance' },
  { title: 'Payroll', value: 'View payroll', path: '/app/payroll' },
];

const HRDashboard = () => {
  const navigate = useNavigate();

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Welcome, HR!
      </Typography>
      <Grid container spacing={3}>
        {summary.map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item.title}>
            <Card
              onClick={() => navigate(item.path)}
              sx={{
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
              }}
            >
              <CardContent>
                <Typography variant="h6">{item.title}</Typography>
                <Typography color="text.secondary">{item.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default HRDashboard; 
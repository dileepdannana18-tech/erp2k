const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');

const populatePayrollEmployee = async (payroll) => {
  if (!payroll) return payroll;

  const employeeId = payroll.employee?._id || payroll.employee;

  await payroll.populate({
    path: 'employee',
    model: 'User',
    select: 'name email'
  });

  if (!payroll.employee && employeeId) {
    const emp = await Employee.findById(employeeId).select('name email');
    if (emp) {
      payroll.employee = emp;
      console.log('[PayrollController] Fallback populated employee from Employee model:', emp.name);
    }
  }

  return payroll;
};

// Create a new payroll record
exports.createPayroll = async (req, res) => {
  try {
    const payrollData = { ...req.body };
    console.log('[PayrollController] Creating payroll with data:', payrollData);
    
    if (!payrollData.employee) {
      throw new Error('Employee ID is required');
    }

    // Validate that the employee exists
    const User = require('../models/User');
    const employee = await User.findById(payrollData.employee);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const payroll = new Payroll(payrollData);
    await payroll.save();
    console.log('[PayrollController] Created payroll:', payroll);
    
    // Populate employee data before returning
    let populatedPayroll = await Payroll.findById(payroll._id);
    populatedPayroll = await populatePayrollEmployee(populatedPayroll);
    res.status(201).json(populatedPayroll);
  } catch (error) {
    console.error('[PayrollController] Error creating payroll:', error);
    res.status(400).json({ message: error.message });
  }
};

// Get all payroll records
exports.getAllPayrolls = async (req, res) => {
  try {
    let payrolls = await Payroll.find();
    payrolls = await Promise.all(payrolls.map(populatePayrollEmployee));
    res.status(200).json(payrolls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get payroll by ID
exports.getPayrollById = async (req, res) => {
  try {
    let payroll = await Payroll.findById(req.params.id);
    payroll = await populatePayrollEmployee(payroll);
    if (!payroll) {
      return res.status(404).json({ message: 'Payroll record not found' });
    }
    res.status(200).json(payroll);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update payroll
exports.updatePayroll = async (req, res) => {
  try {
    const updateData = { ...req.body };
    let payroll = await Payroll.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    payroll = await populatePayrollEmployee(payroll);
    if (!payroll) {
      return res.status(404).json({ message: 'Payroll record not found' });
    }
    res.status(200).json(payroll);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete payroll
exports.deletePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findByIdAndDelete(req.params.id);
    if (!payroll) {
      return res.status(404).json({ message: 'Payroll record not found' });
    }
    res.status(200).json({ message: 'Payroll record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get payroll records for a specific employee or the logged-in user
exports.getPayrollByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const userId = employeeId || req.user._id || req.user.id;
    const userEmail = req.user.email;
    console.log('[PayrollController] Searching for payroll with userId:', userId, 'email:', userEmail, 'role:', req.user.role);

    // Validate that the employee exists in either User or Employee collections
    const User = require('../models/User');
    let user = await User.findById(userId);
    if (!user) {
      user = await Employee.findById(userId);
    }
    if (!user) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // If the requester is an employee, they can only see their own payroll
    if (req.user.role === 'employee' && req.user._id.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You can only view your own payroll records' });
    }

    // Try multiple search strategies to handle data mismatches
    let payrolls = await Payroll.find({ employee: userId }).sort({ year: -1, month: -1 });
    console.log('[PayrollController] Found by User ID:', payrolls.length);

    // If no results and we have an email, try to find by Employee with matching email
    if (payrolls.length === 0 && userEmail) {
      const employeeByEmail = await Employee.findOne({ email: userEmail });
      if (employeeByEmail) {
        console.log('[PayrollController] Found Employee by email:', employeeByEmail._id);
        payrolls = await Payroll.find({ employee: employeeByEmail._id }).sort({ year: -1, month: -1 });
        console.log('[PayrollController] Found by Employee ID:', payrolls.length);
      }
    }

    payrolls = await Promise.all(payrolls.map(populatePayrollEmployee));

    console.log('[PayrollController] Total found payrolls:', payrolls.length);

    res.status(200).json(payrolls);
  } catch (error) {
    console.error('[PayrollController] Error:', error);
    res.status(500).json({ message: error.message });
  }
}; 
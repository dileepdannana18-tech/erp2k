const mongoose = require('mongoose');
const User = require('./src/models/User');
const Employee = require('./src/models/Employee');
const Department = require('./src/models/Department');
const Manager = require('./src/models/Manager');
const Attendance = require('./src/models/Attendance');
const Payroll = require('./src/models/Payroll');

mongoose.connect('mongodb+srv://DILEEP:Erp%401323@cluster0.reaj3vf.mongodb.net/erp?retryWrites=true&w=majority')
  .then(async () => {
    console.log('🔄 Starting data seeding...\n');

    // Clear existing data
    await User.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await Manager.deleteMany({});
    await Attendance.deleteMany({});
    await Payroll.deleteMany({});
    console.log('✓ Cleared existing data');

    // ===== CREATE DEPARTMENTS =====
    const departments = await Department.insertMany([
      { name: 'Human Resources', description: 'HR and employee management' },
      { name: 'Information Technology', description: 'IT and software development' },
      { name: 'Sales', description: 'Sales and business development' },
      { name: 'Marketing', description: 'Marketing and communications' },
      { name: 'Finance', description: 'Finance and accounting' }
    ]);
    console.log('✓ Created 5 departments');

    // ===== CREATE ADMIN USER =====
    const adminUser = await User.create({
      name: 'Dheeraj Sharma',
      email: 'admin@gmail.com',
      password: '123456',
      role: 'admin'
    });
    console.log('✓ Created admin user');

    // ===== CREATE HR USER =====
    const hrUser = await User.create({
      name: 'Tarun Mehta',
      email: 'hr@company.com',
      password: '123456',
      role: 'hr',
      department: departments[0]._id,
      phone: '9876543210',
      address: '123 Main Street, City'
    });
    console.log('✓ Created HR user');

    // ===== CREATE MANAGERS =====
    const manager1 = await Manager.create({
      name: 'Ajith Kumar',
      email: 'ajith.manager@company.com',
      department: departments[1]._id,
      position: 'IT Manager',
      joinDate: new Date('2020-01-15'),
      phone: '9123456789',
      address: '456 Oak Avenue, City',
      salary: 7055000,
      role: 'manager'
    });

    const manager2 = await Manager.create({
      name: 'Pramith Sai',
      email: 'pramith.manager@company.com',
      department: departments[2]._id,
      position: 'Sales Manager',
      joinDate: new Date('2019-06-20'),
      phone: '9987654321',
      address: '789 Pine Road, City',
      salary: 6640000,
      role: 'manager'
    });
    console.log('✓ Created 2 managers');

    // ===== CREATE EMPLOYEES =====
    const employee1 = await Employee.create({
      name: 'Aman Dudi',
      email: 'aman.dudi@company.com',
      department: departments[1]._id,
      position: 'Senior Developer',
      joinDate: new Date('2021-03-10'),
      phone: '9111111111',
      address: '321 Elm Street, City',
      salary: 6225000,
      role: 'employee',
      manager: manager1._id
    });

    const employee2 = await Employee.create({
      name: 'Neha Sharma',
      email: 'neha.sharma@company.com',
      department: departments[1]._id,
      position: 'Junior Developer',
      joinDate: new Date('2022-07-05'),
      phone: '9222222222',
      address: '654 Maple Drive, City',
      salary: 4565000,
      role: 'employee',
      manager: manager1._id
    });

    const employee3 = await Employee.create({
      name: 'Tarun Joshi',
      email: 'tarun.joshi@company.com',
      department: departments[2]._id,
      position: 'Sales Executive',
      joinDate: new Date('2021-09-15'),
      phone: '9333333333',
      address: '987 Birch Lane, City',
      salary: 4980000,
      role: 'employee',
      manager: manager2._id
    });

    const employee4 = await Employee.create({
      name: 'Riya Kapoor',
      email: 'riya.kapoor@company.com',
      department: departments[4]._id,
      position: 'Accountant',
      joinDate: new Date('2020-11-20'),
      phone: '9444444444',
      address: '135 Cedar Court, City',
      salary: 5395000,
      role: 'employee'
    });
    console.log('✓ Created 4 employees');

    // ===== CREATE ATTENDANCE RECORDS (recent, realistic) =====
    const today = new Date();
    const attendanceRecords = [];

    // Generate attendance for the last 7 days (so UI 'last 5 days' has recent data)
    for (let d = 0; d < 7; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() - d);
      date.setHours(0, 0, 0, 0);

      const employees = [employee1, employee2, employee3, employee4];

      employees.forEach((emp, idx) => {
        // simple deterministic pattern with some randomness for realism
        const rand = Math.abs((emp.name.length + d + idx) % 10);
        let status = 'present';
        if (rand === 0) status = 'absent';
        else if (rand <= 2) status = 'late';

        const record = {
          employee: emp._id,
          date: new Date(date),
          status
        };

        if (status === 'absent') {
          record.checkIn = null;
          record.checkOut = null;
        } else if (status === 'late') {
          // late: check in between 9:30 - 10:15, check out 17:00 - 17:15
          const checkInOffset = (9 * 60 + 30 + (rand * 3)) * 60 * 1000;
          const checkOutOffset = (17 * 60 + (rand % 2) * 5) * 60 * 1000;
          record.checkIn = new Date(date.getTime() + checkInOffset);
          record.checkOut = new Date(date.getTime() + checkOutOffset);
        } else {
          // present: normal 9:00 - 17:00 with small variation
          const checkInOffset = (9 * 60 + (rand % 6)) * 60 * 1000;
          const checkOutOffset = (17 * 60 + (rand % 6)) * 60 * 1000;
          record.checkIn = new Date(date.getTime() + checkInOffset);
          record.checkOut = new Date(date.getTime() + checkOutOffset);
        }

        attendanceRecords.push(record);
      });
    }

    await Attendance.insertMany(attendanceRecords);
    console.log(`✓ Created ${attendanceRecords.length} attendance records`);

    // ===== CREATE PAYROLL RECORDS (monthly, realistic) =====
    const payrollRecords = [];

    // Helper to compute monthly amounts from annual salary
    const monthlyFromAnnual = annual => Math.round(annual / 12);

    // Generate payroll for last 6 months with small month-to-month variation
    for (let i = 0; i < 6; i++) {
      const ref = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthNum = ref.getMonth() + 1; // 1-12
      const yearNum = ref.getFullYear();

      const employees = [
        { emp: employee1, annual: 6225000 },
        { emp: employee2, annual: 4565000 },
        { emp: employee3, annual: 4980000 },
        { emp: employee4, annual: 5395000 }
      ];

      employees.forEach(({ emp, annual }) => {
        const baseMonthly = monthlyFromAnnual(annual);
        // allowances ~8-12% of base, deductions ~3-7% of base
        const allowances = Math.round(baseMonthly * (0.08 + (emp.name.length % 5) * 0.01));
        const deductions = Math.round(baseMonthly * (0.03 + (i % 5) * 0.01));
        // small random-ish fluctuation per month
        const fluctuation = Math.round(baseMonthly * ((i % 3) * 0.005));
        const netSalary = baseMonthly + allowances - deductions + fluctuation;

        payrollRecords.push({
          employee: emp._id,
          month: monthNum,
          year: yearNum,
          basicSalary: baseMonthly,
          allowances,
          deductions,
          netSalary,
          status: 'Paid',
          paymentDate: new Date(yearNum, monthNum - 1, 28)
        });
      });
    }

    await Payroll.insertMany(payrollRecords);
    console.log(`✓ Created ${payrollRecords.length} payroll records`);

    // ===== CREATE MANAGER USERS =====
    const managerUser1 = await User.create({
      name: 'Ajith Kumar',
      email: 'ajith.manager@company.com',
      password: '123456',
      role: 'manager',
      department: departments[1]._id,
      phone: '9123456789',
      address: '456 Oak Avenue, City'
    });

    const managerUser2 = await User.create({
      name: 'Pramith Sai',
      email: 'pramith.manager@company.com',
      password: '123456',
      role: 'manager',
      department: departments[2]._id,
      phone: '9987654321',
      address: '789 Pine Road, City'
    });
    console.log('✓ Created 2 manager users');

    // ===== CREATE EMPLOYEE USERS =====
    await User.create({
      name: 'Aman Dudi',
      email: 'aman.employee@company.com',
      password: '123456',
      role: 'employee',
      department: departments[1]._id,
      phone: '9111111111',
      address: '321 Elm Street, City'
    });

    await User.create({
      name: 'Neha Sharma',
      email: 'neha.sharma@company.com',
      password: '123456',
      role: 'employee',
      department: departments[1]._id,
      phone: '9222222222',
      address: '654 Maple Drive, City'
    });

    await User.create({
      name: 'Tarun Joshi',
      email: 'tarun.joshi@company.com',
      password: '123456',
      role: 'employee',
      department: departments[2]._id,
      phone: '9333333333',
      address: '987 Birch Lane, City'
    });

    await User.create({
      name: 'Riya Kapoor',
      email: 'riya.kapoor@company.com',
      password: '123456',
      role: 'employee',
      department: departments[4]._id,
      phone: '9444444444',
      address: '135 Cedar Court, City'
    });
    console.log('✓ Created 4 employee users');

    console.log('\n✅ Data seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log('  - 1 Admin User');
    console.log('  - 1 HR User');
    console.log('  - 2 Manager Users');
    console.log('  - 4 Employee Users');
    console.log('  - 5 Departments');
    console.log('  - 2 Managers');
    console.log('  - 4 Employees');
    console.log('  - 80 Attendance Records');
    console.log('  - 12 Payroll Records');
    console.log('\n🔐 Test Credentials (Password: 123456 for all):');
    console.log('  Admin     | admin@gmail.com              | Dheeraj Sharma');
    console.log('  HR        | hr@company.com               | Tarun Mehta');
    console.log('  Manager 1 | ajith.manager@company.com    | Ajith Kumar');
    console.log('  Manager 2 | pramith.manager@company.com  | Pramith Sai');
    console.log('  Employee  | aman.employee@company.com    | Aman Dudi');
    console.log('  Employee  | neha.sharma@company.com      | Neha Sharma');
    console.log('  Employee  | tarun.joshi@company.com      | Tarun Joshi');
    console.log('  Employee  | riya.kapoor@company.com      | Riya Kapoor');
    console.log('\n💰 All Salaries in Indian Rupees (₹)');
    console.log('  Manager Salary: ₹70,55,000');
    console.log('  Senior Dev: ₹62,25,000');
    console.log('  Junior Dev: ₹45,65,000');
    console.log('  Sales Executive: ₹49,80,000');
    console.log('  Accountant: ₹53,95,000');

    mongoose.connection.close();
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    mongoose.connection.close();
  });

const mongoose = require('mongoose');
const User = require('./src/models/User');
const Employee = require('./src/models/Employee');
const Manager = require('./src/models/Manager');

const MONGO_URI = 'mongodb+srv://DILEEP:Erp%401323@cluster0.reaj3vf.mongodb.net/erp?retryWrites=true&w=majority';

const nameUpdates = [
  { email: 'admin@gmail.com', newName: 'Dheeraj Sharma' },
  { email: 'hr@company.com', newName: 'Tarun Mehta' },
  { email: 'ajith.manager@company.com', newName: 'Ajith Kumar' },
  { email: 'pramith.manager@company.com', newName: 'Pramith Sai' },
  { email: 'aman.dudi@company.com', newName: 'Aman Dudi' },
  { email: 'neha.sharma@company.com', newName: 'Neha Sharma' },
  { email: 'tarun.joshi@company.com', newName: 'Tarun Joshi' },
  { email: 'riya.kapoor@company.com', newName: 'Riya Kapoor' }
];

async function updateCollection(Model, collectionName) {
  for (const item of nameUpdates) {
    const result = await Model.updateMany(
      { email: item.email },
      { $set: { name: item.newName } }
    );
    if (result.matchedCount > 0) {
      console.log(`Updated ${result.modifiedCount}/${result.matchedCount} ${collectionName} record(s) for ${item.email}`);
    }
  }
}

async function run() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    await updateCollection(User, 'User');
    await updateCollection(Employee, 'Employee');
    await updateCollection(Manager, 'Manager');

    console.log('Name update process completed.');
  } catch (err) {
    console.error('Error updating names:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run();

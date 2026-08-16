const mongoose = require('mongoose');
const User = require('./src/models/User');

mongoose.connect('mongodb+srv://DILEEP:Erp%401323@cluster0.reaj3vf.mongodb.net/erp?retryWrites=true&w=majority')
.then(async () => {
    // Delete old admin if exists
    await User.deleteOne({ email: "admin@gmail.com" });
    console.log("Old admin deleted (if existed)");

    // Create new admin
    await User.create({
        name: "Dheeraj Sharma",
        email: "admin@gmail.com",
        password: "123456",
        role: "admin"
    });

    console.log("Admin created successfully");
    console.log("Email: admin@gmail.com");
    console.log("Password: 123456");

    mongoose.connection.close();
})
.catch(err => {
    console.log("Error:", err);
    mongoose.connection.close();
});

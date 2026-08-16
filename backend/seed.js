const mongoose = require('mongoose');
const User = require('./src/models/User');

mongoose.connect('mongodb+srv://DILEEP:Erp%401323@cluster0.reaj3vf.mongodb.net/erp?retryWrites=true&w=majority')
.then(async () => {

    await User.create({
        name: "Dheeraj Sharma",
        email: "admin@gmail.com",
        password: "123456",
        role: "admin"
    });

    console.log("Admin created successfully");

    mongoose.connection.close();
})
.catch(err => console.log(err));
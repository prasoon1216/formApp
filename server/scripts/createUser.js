// const mongoose = require('mongoose');
// const User = require('../models/User');

// const MONGO_URI = 'mongodb+srv://prasoon123:Alliedmed%40151@prasoon123.om5o34r.mongodb.net/?retryWrites=true&w=majority&appName=prasoon123';

// async function createUser() {
//     await mongoose.connect(MONGO_URI);
//     const username = 'prasoon.singh@alliedmed.co.in';
//     const password = 'All';
//     const existing = await User.findOne({ username });
//     if (existing) {
//         console.log('User already exists:', username);
//         process.exit(0);
//     }
//     await User.create({ username, password });
//     console.log('User created:', username);
//     process.exit(0);
// }

// createUser().catch(err => {
//     console.error(err);
//     process.exit(1);
// });
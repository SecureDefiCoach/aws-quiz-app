// models/User.js

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: false }, 
    createdDate: { type: Date, default: Date.now },
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
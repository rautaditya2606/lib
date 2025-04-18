const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentID: { type: String, required: true, unique: true },
  email:     { type: String, required: true, unique: true },
  name:      { type: String, required: true }
  // Add additional fields as needed.
});

module.exports = mongoose.model('Student', studentSchema);

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  studentId: { 
    type: String, 
    sparse: true,
    index: true
  },
  librarianId: { 
    type: String, 
    sparse: true,
    index: true 
  },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'librarian'], default: 'student' },
  name: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

const generateStudentId = () => {
  const year = new Date().getFullYear().toString().slice(-2);
  const major = 'SOCB'; // Can be made dynamic based on input
  return User.find({})
    .then(users => {
      const lastId = users
        .filter(u => u.studentId)
        .map(u => parseInt(u.studentId.slice(-4)))
        .sort((a, b) => b - a)[0] || 0;
      const newNum = (lastId + 1).toString().padStart(4, '0');
      return `ADT${year}${major}${newNum}`;
    });
};

const generateLibrarianId = () => {
  return `LIB-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
};

module.exports = {
  User,
  createUser: async (password, role, name, email) => {
    const user = new User({
      password,
      role,
      name,
      email,
      studentId: role === 'student' ? await generateStudentId() : null,
      librarianId: role === 'librarian' ? generateLibrarianId() : null
    });
    return await user.save();
  },

  findUser: async (email, password) => {
    return await User.findOne({ email, password });
  },

  getUserById: async (id) => {
    return await User.findById(id);
  },

  getAllUsers: async () => {
    return await User.find({});
  },

  findUserByStudentId: async (studentId, password) => {
    return await User.findOne({ studentId, password });
  },

  findUserByLibrarianId: async (librarianId, password) => {
    return await User.findOne({ librarianId, password });
  }
};
const userModel = require('../models/user');

module.exports = {
  getLogin: (req, res) => {
    res.render('auth/login');
  },
  
  postLogin: async (req, res) => {
    const { loginId, password } = req.body;
    
    try {
      // First try student ID
      let user = await userModel.findUserByStudentId(loginId, password);
      
      // Then try librarian ID
      if (!user) {
        user = await userModel.findUserByLibrarianId(loginId, password);
      }
      
      if (user) {
        req.session.user = user;
        res.redirect('/');
      } else {
        req.session.message = {
          type: 'danger',
          text: 'Invalid credentials'
        };
        res.redirect('/login');
      }
    } catch (error) {
      console.error('Login error:', error);
      req.session.message = {
        type: 'danger',
        text: 'Login failed'
      };
      res.redirect('/login');
    }
  },
  
  getRegister: (req, res) => {
    res.render('auth/register');
  },
  
  postRegister: async (req, res) => {
    const { email, password, name } = req.body;
    
    try {
      const existingUser = await userModel.findUser(email, password);
      if (existingUser) {
        req.session.message = 'Email already registered';
        return res.redirect('/register');
      }
      
      await userModel.createUser(password, 'student', name, email);
      req.session.message = 'Registration successful! Please login.';
      res.redirect('/login');
    } catch (error) {
      req.session.message = 'Registration failed';
      res.redirect('/register');
    }
  },
  
  logout: (req, res) => {
    req.session.destroy();
    res.redirect('/');
  },
  
  isLibrarian: (req, res, next) => {
    if (req.session.user && req.session.user.role === 'librarian') {
      next();
    } else {
      req.session.message = 'Access denied. Librarian privileges required.';
      res.redirect('/');
    }
  },
  
  isStudent: (req, res, next) => {
    if (req.session.user && req.session.user.role === 'student') {
      next();
    } else {
      req.session.message = 'Access denied. Student privileges required.';
      res.redirect('/');
    }
  }
};
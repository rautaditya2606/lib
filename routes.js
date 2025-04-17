const express = require('express');
const router = express.Router();
const bookController = require('./controllers/bookController');
const userController = require('./controllers/userController');

const validateIssueBook = (req, res, next) => {
  const { bookId, userId } = req.body;
  if (!bookId || !userId) {
    req.session.message = 'Missing required fields';
    return res.redirect('/books/issue');
  }
  next();
};

// Add error handling wrapper
function catchAsync(fn) {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

// Home route
router.get('/', (req, res) => {
  res.render('index');
});

// Authentication routes
router.get('/login', userController.getLogin);
router.post('/login', userController.postLogin);
router.get('/register', userController.getRegister);
router.post('/register', userController.postRegister);
router.get('/logout', userController.logout);

// Book routes
router.get('/books/available', catchAsync(bookController.getAvailableBooks));
router.get('/books/issue', userController.isLibrarian, catchAsync(bookController.getIssueBook));
router.post('/books/issue', validateIssueBook, catchAsync(bookController.postIssueBook));
router.get('/books/return', userController.isLibrarian, catchAsync(bookController.getReturnBook));
router.post('/books/return', userController.isLibrarian, catchAsync(bookController.postReturnBook));
router.get('/books/mybooks', userController.isStudent, catchAsync(bookController.getMyBooks));

module.exports = router;
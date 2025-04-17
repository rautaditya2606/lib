const bookModel = require('../models/book');
const userModel = require('../models/user');
const { sendDueReminder } = require('../utils/emailService');

module.exports = {
  testEmailReminder: async (req, res) => {
    const issuedBooks = bookModel.getAllBooks().filter(book => !book.available);
    const results = [];

    for (const book of issuedBooks) {
      const user = userModel.getUserById(book.issuedTo);
      if (user && user.email) {
        try {
          await sendDueReminder(user, book);
          results.push({
            success: true,
            book: book.title,
            user: user.name,
            email: user.email
          });
        } catch (error) {
          results.push({
            success: false,
            book: book.title,
            user: user.name,
            email: user.email,
            error: error.message
          });
        }
      }
    }

    res.render('test/email-reminder', { results });
  },

  testSpecificReminder: async (req, res) => {
    // Get a specific book that's issued to a student
    const book = bookModel.getAllBooks().find(b => !b.available);
    if (!book) {
      return res.render('test/scenario', { 
        error: 'No issued books found' 
      });
    }

    // Set due date to 5 days from now for testing
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 5);
    book.dueDate = dueDate;

    const user = userModel.getUserById(book.issuedTo);
    if (!user) {
      return res.render('test/scenario', { 
        error: 'User not found' 
      });
    }

    try {
      const result = await sendDueReminder(user, book);
      res.render('test/scenario', {
        success: true,
        book,
        user,
        dueDate,
        messageId: result.messageId
      });
    } catch (error) {
      res.render('test/scenario', {
        error: error.message,
        book,
        user
      });
    }
  }
};

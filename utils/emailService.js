const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const bookModel = require('../models/book');
const userModel = require('../models/user');

const sendDueReminder = async (user, book) => {
  const mailOptions = {
    from: `"Library System" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: 'Library Book Due Date Reminder',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3498db;">Library Book Due Date Reminder</h2>
        <p>Dear ${user.name},</p>
        <p>This is a reminder that the following book is due for return in 5 days:</p>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Book Title:</strong> ${book.title}</p>
          <p><strong>Author:</strong> ${book.author}</p>
          <p><strong>Due Date:</strong> ${book.dueDate.toDateString()}</p>
        </div>
        <p>Please return the book on time to avoid any late fees.</p>
        <p style="color: #666;">Thank you for using our library!</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

const checkDueBooks = async () => {
  const books = bookModel.getAllBooks();
  const today = new Date();

  books.forEach(book => {
    if (!book.available && book.dueDate) {
      const daysUntilDue = Math.ceil((book.dueDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue === 5) {
        const user = userModel.getUserById(book.issuedTo);
        if (user && user.email) {
          sendDueReminder(user, book);
        }
      }
    }
  });
};


module.exports = { checkDueBooks };
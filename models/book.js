const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  section: { type: String, required: true },
  available: { type: Boolean, default: true },
  issuedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  dueDate: { type: Date, default: null },
  coverUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const transactionSchema = new mongoose.Schema({
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  issueDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  returnDate: { type: Date },
  returned: { type: Boolean, default: false }
});

const Book = mongoose.model('Book', bookSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

// Export both the model and methods
module.exports = {
  Book,
  Transaction,
  getAllBooks: async () => await Book.find(),
  getAvailableBooks: async () => await Book.find({ available: true }),
  getBookById: async (id) => await Book.findById(id),
  
  issueBook: async (bookId, userId) => {
    const book = await Book.findById(bookId);
    if (book && book.available) {
      book.available = false;
      book.issuedTo = userId;
      
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);
      book.dueDate = dueDate;
      
      await book.save();
      
      await Transaction.create({
        bookId,
        userId,
        issueDate: new Date(),
        dueDate: book.dueDate
      });
      return true;
    }
    return false;
  },

  returnBook: async (bookId) => {
    const book = await Book.findById(bookId);
    if (book && !book.available) {
      book.available = true;
      book.issuedTo = null;
      book.dueDate = null;
      
      await book.save();
      
      const transaction = await Transaction.findOne({ bookId, returned: false });
      if (transaction) {
        transaction.returned = true;
        transaction.returnDate = new Date();
        await transaction.save();
      }
      return true;
    }
    return false;
  },

  renewBook: async (bookId) => {
    const book = await Book.findById(bookId);
    if (book && !book.available) {
      book.dueDate.setDate(book.dueDate.getDate() + 14);
      await book.save();
      
      const transaction = await Transaction.findOne({ bookId, returned: false });
      if (transaction) {
        transaction.dueDate = book.dueDate;
        await transaction.save();
      }
      return true;
    }
    return false;
  },

  getTransactionByBookId: async (bookId) => {
    return await Transaction.findOne({ bookId, returned: false }) || null;
  },

  calculateFine: async (bookId) => {
    const book = await Book.findById(bookId);
    if (!book || book.available) return 0;
    
    const today = new Date();
    if (book.dueDate >= today) return 0;
    
    const daysOverdue = Math.ceil((today - book.dueDate) / (1000 * 60 * 60 * 24));
    return daysOverdue * 5; // ₹5 per day fine
  }
};
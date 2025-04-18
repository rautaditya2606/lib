const bookModel = require('../models/book');
const userModel = require('../models/user');

module.exports = {
  getAvailableBooks: async (req, res) => {
    try {
      // Read query parameters and convert to lowercase for case-insensitive matching
      const searchQuery = req.query.q ? req.query.q.toLowerCase() : '';
      const sectionFilter = req.query.section ? req.query.section.toLowerCase() : '';

      // Get all books from DB and then filter for available ones
      const allBooks = await bookModel.getAllBooks();
      let availableBooks = allBooks.filter(book => book.available);

      // Apply search filter on title and author fields
      if (searchQuery) {
        availableBooks = availableBooks.filter(book =>
          book.title.toLowerCase().includes(searchQuery) ||
          book.author.toLowerCase().includes(searchQuery)
        );
      }

      // Apply section filter based on the book's section (in lowercase)
      if (sectionFilter) {
        availableBooks = availableBooks.filter(book =>
          book.section.toLowerCase() === sectionFilter
        );
      }

      // Build the list of unique sections (all in lowercase) for the dropdown
      const sections = [...new Set(allBooks.map(book => book.section.toLowerCase()))];

      // Only librarians need full user list; for students send an empty array
      const users = req.session.user?.role === 'librarian'
        ? await userModel.getAllUsers()
        : [];

      res.render('books/available', {
        books: availableBooks,
        sections,
        searchQuery: req.query.q || '',
        sectionFilter: req.query.section || '',
        users
      });
    } catch (error) {
      console.error('Error in getAvailableBooks:', error);
      req.session.message = {
        type: 'danger',
        text: 'Error loading books'
      };
      res.redirect('/');
    }
  },

  getIssueBook: async (req, res) => {
    try {
      const [availableBooks, allBooks, allUsers] = await Promise.all([
        bookModel.getAvailableBooks(),
        bookModel.getAllBooks(),
        userModel.getAllUsers()
      ]);

      const issuedBooks = allBooks.filter(book => !book.available);
      const students = allUsers.filter(user => user.role === 'student');

      res.render('books/issue', {
        availableBooks,
        issuedBooks,
        students,
        allUsers
      });
    } catch (error) {
      console.error('Error in getIssueBook:', error);
      req.session.message = {
        type: 'danger',
        text: 'Error loading issue page'
      };
      res.redirect('/');
    }
  },

  postIssueBook: async (req, res) => {
    try {
      const { bookId, userId } = req.body;

      // Validate inputs
      if (!bookId || !userId) {
        req.session.message = {
          type: 'danger',
          text: 'Please select both a book and a student'
        };
        return res.redirect('/books/issue');
      }

      // Remove parseInt conversion: use IDs as provided (strings)
      const [book, user] = await Promise.all([
        bookModel.getBookById(bookId),
        userModel.getUserById(userId)
      ]);

      // Validate book and user exist
      if (!book) {
        req.session.message = {
          type: 'danger',
          text: 'Invalid book selected'
        };
        return res.redirect('/books/issue');
      }

      if (!user || user.role !== 'student') {
        req.session.message = {
          type: 'danger',
          text: 'Invalid student selected'
        };
        return res.redirect('/books/issue');
      }

      // Try to issue the book
      if (await bookModel.issueBook(bookId, userId)) {
        req.session.message = {
          type: 'success',
          text: `Successfully issued "${book.title}" to ${user.name} (${user.studentId})`
        };
      } else {
        req.session.message = {
          type: 'danger',
          text: 'Book is not available for issue'
        };
      }
      res.redirect('/books/issue');
    } catch (error) {
      console.error('Error in postIssueBook:', error);
      req.session.message = {
        type: 'danger',
        text: 'Error issuing book'
      };
      res.redirect('/books/issue');
    }
  },

  getReturnBook: async (req, res) => {
    try {
      const [allBooks, allUsers] = await Promise.all([
        bookModel.getAllBooks(),
        userModel.getAllUsers()
      ]);

      const issuedBooks = allBooks.filter(book => !book.available);

      res.render('books/return', {
        issuedBooks,
        allUsers
      });
    } catch (error) {
      console.error('Error in getReturnBook:', error);
      req.session.message = {
        type: 'danger',
        text: 'Error loading return page'
      };
      res.redirect('/');
    }
  },

  postReturnBook: async (req, res) => {
    try {
      const { bookId } = req.body;
      // Use bookId as is (string) instead of parseInt(bookId)
      if (await bookModel.returnBook(bookId)) {
        req.session.message = 'Book returned successfully!';
      } else {
        req.session.message = 'Failed to return book. It may not be issued.';
      }
      res.redirect('/books/return');
    } catch (error) {
      console.error('Error in postReturnBook:', error);
      req.session.message = {
        type: 'danger',
        text: 'Error returning book'
      };
      res.redirect('/books/return');
    }
  },

  getMyBooks: async (req, res) => {
    try {
      // Get user id from session; support both _id and id
      const userId = req.session.user && (req.session.user._id || req.session.user.id);
      if (!userId) throw new Error('User not logged in properly');

      const allBooks = await bookModel.getAllBooks();

      const myBooks = await Promise.all(
        allBooks
          .filter(book =>
            !book.available &&
            book.issuedTo != null &&
            book.issuedTo.toString() === String(userId)
          )
          .map(async book => {
            // Convert Mongoose document to a plain object, setting an explicit id property
            const plain = book.toObject();
            plain.id = plain._id.toString();
            const transaction = await bookModel.getTransactionByBookId(plain.id);
            const daysRemaining = Math.ceil((plain.dueDate - new Date()) / (1000 * 60 * 60 * 24));
            return {
              ...plain,
              transaction: transaction || { issueDate: new Date() },
              fine: await bookModel.calculateFine(plain.id),
              daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
              isOverdue: daysRemaining <= 0
            };
          })
      );

      res.render('books/mybooks', {
        myBooks,
        currentDate: new Date()
      });
    } catch (error) {
      console.error('Error in getMyBooks:', error);
      req.session.message = {
        type: 'danger',
        text: 'Error loading my books'
      };
      res.redirect('/');
    }
  },

  getRenewBook: async (req, res) => {
    try {
      const userId = req.session.user.id;
      const myBooks = (await bookModel.getAllBooks()).filter(book =>
        !book.available && book.issuedTo === userId
      );
      res.render('books/renew', { myBooks });
    } catch (error) {
      console.error('Error in getRenewBook:', error);
      req.session.message = {
        type: 'danger',
        text: 'Error loading renew page'
      };
      res.redirect('/');
    }
  },

  postRenewBook: async (req, res) => {
    try {
      const { bookId } = req.body;
      if (await bookModel.renewBook(parseInt(bookId))) {
        req.session.message = 'Book renewed successfully!';
      } else {
        req.session.message = 'Failed to renew book.';
      }
      res.redirect('/books/mybooks');
    } catch (error) {
      console.error('Error in postRenewBook:', error);
      req.session.message = {
        type: 'danger',
        text: 'Error renewing book'
      };
      res.redirect('/books/mybooks');
    }
  },

  searchBooks: async (req, res) => {
    try {
      const query = req.query.q.toLowerCase();
      const allBooks = await bookModel.getAllBooks();
      const results = allBooks.filter(book =>
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query)
      );
      res.render('books/search', { results, query });
    } catch (error) {
      console.error('Error in searchBooks:', error);
      req.session.message = {
        type: 'danger',
        text: 'Error searching books'
      };
      res.redirect('/');
    }
  },

  getAdminDashboard: async (req, res) => {
    try {
      const allBooks = await bookModel.getAllBooks();
      const stats = {
        totalBooks: allBooks.length,
        availableBooks: (await bookModel.getAvailableBooks()).length,
        issuedBooks: allBooks.filter(b => !b.available).length,
        overdueBooks: allBooks.filter(b => !b.available && new Date(b.dueDate) < new Date()).length
      };
      res.render('admin/dashboard', { stats });
    } catch (error) {
      console.error('Error in getAdminDashboard:', error);
      req.session.message = {
        type: 'danger',
        text: 'Error loading admin dashboard'
      };
      res.redirect('/');
    }
  },

  exportBooks: async (req, res) => {
    try {
      const books = await bookModel.getAllBooks();
      let csv = 'ID,Title,Author,Status\n';
      books.forEach(book => {
        csv += `${book.id},${book.title},${book.author},${book.available ? 'Available' : 'Issued'}\n`;
      });
      res.header('Content-Type', 'text/csv');
      res.attachment('books.csv');
      res.send(csv);
    } catch (error) {
      console.error('Error in exportBooks:', error);
      req.session.message = {
        type: 'danger',
        text: 'Error exporting books'
      };
      res.redirect('/');
    }
  }
};
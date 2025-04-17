require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./database');

// Import models - update these lines
const { Book } = require('../models/book');
const { User } = require('../models/user');

const books = [
  // Coding Section
  {
    title: 'Introduction to Algorithms',
    author: 'Thomas H. Cormen',
    section: 'coding',
    available: true,
    coverUrl: 'https://m.media-amazon.com/images/I/41T5-vXl-fL._SX258_BO1,204,203,200_.jpg'
  },
  {
    title: 'Clean Code',
    author: 'Robert C. Martin',
    section: 'coding',
    available: true,
    coverUrl: 'https://m.media-amazon.com/images/I/41xShlnTZTL._SX376_BO1,204,203,200_.jpg'
  },
  {
    title: 'Design Patterns',
    author: 'Erich Gamma',
    section: 'coding',
    available: true,
    coverUrl: 'https://m.media-amazon.com/images/I/51szD9HC9pL._SX395_BO1,204,203,200_.jpg'
  },
  {
    title: 'Eloquent JavaScript',
    author: 'Marijn Haverbeke',
    section: 'coding',
    available: true,
    coverUrl: 'https://m.media-amazon.com/images/I/51InjRPaF7L._SX377_BO1,204,203,200_.jpg'
  },
  {
    title: 'Learning Python',
    author: 'Mark Lutz',
    section: 'coding',
    available: true,
    coverUrl: 'https://m.media-amazon.com/images/I/514b6RqKCFL._SX379_BO1,204,203,200_.jpg'
  },

  // Philosophy Section
  {
    title: 'The Republic',
    author: 'Plato',
    section: 'philosophy',
    available: true,
    coverUrl: 'https://m.media-amazon.com/images/I/71S-z++6+wL._AC_UF1000,1000_QL80_.jpg'
  },
  {
    title: 'Meditations',
    author: 'Marcus Aurelius',
    section: 'philosophy',
    available: true,
    coverUrl: 'https://m.media-amazon.com/images/I/71WLB9hE+4L._AC_UF1000,1000_QL80_.jpg'
  },
  {
    title: 'Beyond Good and Evil',
    author: 'Friedrich Nietzsche',
    section: 'philosophy',
    available: true,
    coverUrl: 'https://m.media-amazon.com/images/I/71jklKlkowL._AC_UF1000,1000_QL80_.jpg'
  },
  {
    title: 'The Art of War',
    author: 'Sun Tzu',
    section: 'philosophy',
    available: true,
    coverUrl: 'https://m.media-amazon.com/images/I/71KM8O-ZSCL._AC_UF1000,1000_QL80_.jpg'
  },
  {
    title: 'Ethics',
    author: 'Aristotle',
    section: 'philosophy',
    available: true,
    coverUrl: 'https://m.media-amazon.com/images/I/61GxNXRQDiL._AC_UF1000,1000_QL80_.jpg'
  },

  // Physics Section
  {
    title: 'A Brief History of Time',
    author: 'Stephen Hawking',
    section: 'physics',
    available: true,
    coverUrl: 'https://m.media-amazon.com/images/I/A1xkFZX5k-L._AC_UF1000,1000_QL80_.jpg'
  },
  {
    title: 'The Feynman Lectures on Physics',
    author: 'Richard Feynman',
    section: 'physics',
    available: true,
    coverUrl: 'https://m.media-amazon.com/images/I/71DgL3lG7yL._AC_UF1000,1000_QL80_.jpg'
  },
  {
    title: 'The Elegant Universe',
    author: 'Brian Greene',
    section: 'physics',
    available: true,
    coverUrl: 'https://m.media-amazon.com/images/I/71jyp7Egt5L._AC_UF1000,1000_QL80_.jpg'
  },
  {
    title: 'Quantum Mechanics',
    author: 'Leonard Susskind',
    section: 'physics',
    available: true,
    coverUrl: 'https://m.media-amazon.com/images/I/71mXPZ+QyxL._AC_UF1000,1000_QL80_.jpg'
  },
  {
    title: 'Six Easy Pieces',
    author: 'Richard P. Feynman',
    section: 'physics',
    available: true,
    coverUrl: 'https://m.media-amazon.com/images/I/71zT5OEVT9L._AC_UF1000,1000_QL80_.jpg'
  },

  // Biography Section
  {
    title: 'Wings of Fire',
    author: 'A.P.J. Abdul Kalam',
    section: 'biography',
    available: true,
    coverUrl: 'https://m.media-amazon.com/images/I/61ZvYESQv4L._AC_UF1000,1000_QL80_.jpg'
  },
  {
    title: 'Steve Jobs',
    author: 'Walter Isaacson',
    section: 'biography',
    available: true,
    coverUrl: 'https://m.media-amazon.com/images/I/71GAxAnNkhL._AC_UF1000,1000_QL80_.jpg'
  },
  {
    title: 'The Story of My Life',
    author: 'Helen Keller',
    section: 'biography',
    available: true,
    coverUrl: 'https://m.media-amazon.com/images/I/71c4clXhklL._AC_UF1000,1000_QL80_.jpg'
  },
  {
    title: 'Long Walk to Freedom',
    author: 'Nelson Mandela',
    section: 'biography',
    available: true,
    coverUrl: 'https://m.media-amazon.com/images/I/71SzLhBFPHL._AC_UF1000,1000_QL80_.jpg'
  },
  {
    title: 'Mahatma Gandhi Autobiography',
    author: 'M.K. Gandhi',
    section: 'biography',
    available: true,
    coverUrl: 'https://m.media-amazon.com/images/I/71h1y98OcHL._AC_UF1000,1000_QL80_.jpg'
  }
];

const users = [
  {
    role: 'librarian',
    password: 'librarian123',
    name: 'Dr. Rajesh Kumar',
    email: 'librarian@library.com',
    librarianId: 'LIB-ADM001'  // Add librarian ID
  },
  {
    studentId: 'ADT24SOCB0001',
    password: 'student123',
    role: 'student',
    name: 'Aarav Patel',
    email: 'aarav@student.com'
  },
  {
    studentId: 'ADT24SOCB0002',
    password: 'student123',
    role: 'student',
    name: 'Priya Sharma',
    email: 'priya@student.com'
  },
  {
    studentId: 'ADT24SOCB0003',
    password: 'student123',
    role: 'student',
    name: 'Arjun Reddy',
    email: 'arjun@student.com'
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Clear existing data
    await Book.deleteMany({});
    await User.deleteMany({});

    // Insert new data
    await Book.insertMany(books);
    await User.insertMany(users);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();

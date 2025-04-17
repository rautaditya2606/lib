require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');
const testRoutes = require('./routes/test');
const cron = require('node-cron');
const { checkDueBooks } = require('./utils/emailService');
const connectDB = require('./config/database');

const app = express();

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Other middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'library_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
    httpOnly: true
  }
}));

// Make session variables available to all views
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  res.locals.message = req.session.message;
  delete req.session.message;
  next();
});

// Routes
app.use('/', routes);
app.use('/', testRoutes);

// Schedule reminder check every day at 9 AM
cron.schedule('0 9 * * *', () => {
  checkDueBooks();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');
const testRoutes = require('./routes/test');
const studentRoutes = require('./routes/studentRoutes');
const librarianRoutes = require('./routes/librarianRoutes');
const cron = require('node-cron');
const { checkDueBooks } = require('./utils/emailService');
const connectDB = require('./config/database');
const MongoStore = require('connect-mongo');

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

// Session configuration
const mongoUrl = (process.env.MONGODB_URI && process.env.MONGODB_URI.trim() !== "")
  ? process.env.MONGODB_URI
  : `mongodb://${process.env.MONGODB_USERNAME}:${encodeURIComponent(process.env.MONGODB_PASSWORD)}@127.0.0.1:27017/library_system?authSource=admin`;

const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'library_secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: mongoUrl,
    ttl: 24 * 60 * 60, // Session TTL in seconds (1 day)
    autoRemove: 'native',
    crypto: {
      secret: process.env.SESSION_ENCRYPT_SECRET || 'encrypt_secret'
    }
  }),
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
    httpOnly: true,
    sameSite: 'strict'
  }
};

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); // trust first proxy
  sessionConfig.cookie.secure = true; // serve secure cookies
}

app.use(session(sessionConfig));

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
app.use('/', studentRoutes);
app.use('/', librarianRoutes);

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
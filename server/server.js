
require('dotenv').config();
const express = require('express');
const cors = require('cors');
// MongoDB connection not needed - project uses Supabase
// const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');
const { apiLimiter } = require('./middleware/rateLimit');

// Database connection skipped - using Supabase instead
// connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://yourdomain.com' // Change this to your production domain
    : 'http://localhost:3000'
}));

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/programs', require('./routes/programs'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/registrations', require('./routes/registrations'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/features', require('./routes/features')); // Add features route

// Error handler (should be last piece of middleware)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

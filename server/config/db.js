
const mongoose = require('mongoose');

const connectDB = async () => {
  // Skip MongoDB connection if URI is not provided (e.g., when using Supabase)
  if (!process.env.MONGODB_URI) {
    console.log('MongoDB URI not provided. Skipping MongoDB connection. (Using Supabase instead)');
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error('Server will continue without MongoDB. Make sure MONGODB_URI is set if you need MongoDB.');
    // Don't exit - allow server to run without MongoDB
  }
};

module.exports = connectDB;

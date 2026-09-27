const mongoose = require('mongoose');

/**
 * Connects to MongoDB using MONGO_URI from environment.
 */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const conn = mongoose.connection;
    console.log(`MongoDB connected: ${conn.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    // Keep API alive and retry so frontend gets a clear 503 instead of process crashes.
    setTimeout(() => {
      connectDB();
    }, 5000);
  }
};

module.exports = connectDB;

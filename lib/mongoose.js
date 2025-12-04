const mongoose = require('mongoose');

async function connectToDB() {
  if (mongoose.connection.readyState === 1) return;
  if (!process.env.MONGODB_URI) throw new Error('Missing env var MONGODB_URI');
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'DanielPanWebDev'
    });
    console.log('MongoDB connected successfully.');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    throw error;
  }
}

module.exports = { connectToDB };


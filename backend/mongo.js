const mongoose = require('mongoose');
require('dotenv').config();

async function connectMongo() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully.');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
  }
}

module.exports = connectMongo;
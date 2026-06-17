// server.js
const dotenv = require('dotenv');
const { app } = require('./app');
const connectMongo = require('./mongo');

dotenv.config(); // Load environment variables from .env file

connectMongo(); // Connect to MongoDB

const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
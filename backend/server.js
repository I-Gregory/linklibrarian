// server.js
const dotenv = require('dotenv');
const { app } = require('./app');

dotenv.config(); // Load environment variables from .env file

const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
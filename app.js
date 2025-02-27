// Load environment variables
require('dotenv').config();

// Import dependencies
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(express.json()); // Parses JSON request body
app.use(cors()); // Enables Cross-Origin Resource Sharing
app.use(morgan('dev')); // Logs HTTP requests

// Routes
app.use('/api/auth', require('./routes/authRoutes'));

app.use('/api/transactions', require('./routes/transactionRoutes'));

app.use('/api/notifications', require('./routes/notificationRoutes'));


// Test route
app.get('/', (req, res) => {
  res.send('API is running...');
});


app.get('/test-db', async (req, res) => {
  try {
      const dbStatus = mongoose.connection.readyState === 1 ? "Connected" : "Not Connected";
      res.json({ database: dbStatus });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

const listEndpoints = require('express-list-endpoints');
console.log("//...Registered Routes:", listEndpoints(app));


// Export app instance
module.exports = app;

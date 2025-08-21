const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

// Load environment variables
require('dotenv').config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL, // Read from .env
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // if using cookies or auth headers
  })
);
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/entries', require('./routes/entries'));

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Distribution Tracker API is running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

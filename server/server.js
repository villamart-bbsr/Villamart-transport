const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

// Load environment variables
require('dotenv').config();

// Set default JWT_SECRET if not in environment
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'fallback_jwt_secret_key_for_development';
}
if (!process.env.ADMIN_SECRET) {
  process.env.ADMIN_SECRET = 'fallback_admin_secret_key';
}

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(
  cors({
    origin: [process.env.FRONTEND_URL, '*'], // Allow Expo and web
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
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

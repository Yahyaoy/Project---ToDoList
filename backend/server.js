// Import necessary packages and modules
const express = require('express')  // For creating Express app
const dotenv = require('dotenv')  // For handling environment variables
const colors = require('colors')  // For adding colors to console logs
const connectDB = require('./config/db')  // For connecting to the database
const userRoutes = require('./routes/userRoutes')  // For routing user requests
const taskRoutes = require('./routes/taskRoutes')  // For routing task requests

// Load environment variables from .env file
dotenv.config()

// Connect to the database
connectDB()

// Create an Express app
const app = express()

// Add middleware for parsing incoming requests
app.use(express.json())
app.use(express.urlencoded({extended: false}))

// Route user requests to userRoutes module
app.use('/api/users', userRoutes)

// Route task requests to taskRoutes module
app.use('/api/tasks', taskRoutes)

// Global error handling middleware
app.use((err, req, res, next) => {
  // Set status code for response
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode
  res.status(statusCode)
  // Send error message and stack trace in response
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  })
})

// Set the port number for the server
const PORT = process.env.PORT || 5000

// Start the server
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold)
})

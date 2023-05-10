// Define a function that handles errors thrown by other middleware functions
const errorHandler = (err, req, res, next) => {
    // Determine the status code for the response, defaulting to 500
    const statusCode = res.statusCode ? res.statusCode : 500
  
    // Set the response status code
    res.status(statusCode)
  
    // Send a JSON response with the error message and stack trace (if not in production)
    res.json({
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? null : err.stack
    })
  }
  
  // Export the error handling middleware function
  module.exports = {
    errorHandler
  }
  
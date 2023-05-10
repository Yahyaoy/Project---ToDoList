
const mongoose = require('mongoose') // Import the Mongoose library

// Define an asynchronous function that connects to the MongoDB database
const connectDB = async () => {
  try {
    // Use Mongoose to connect to the database using the URI stored in the environment variable
    const conn = await mongoose.connect(process.env.MONGO_URI)
// If the connection is successful, log a message with the hostname of the database server
    console.log(`MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error(`Error: ${error.message}`)
    process.exit(1)
  }
}

module.exports = connectDB
const mongoose = require('mongoose')

// Define the schema for the Task model
const taskSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true, // The 'text' field is required
    },
    completed: {
      type: Boolean,
      default: false, // The 'completed' field defaults to false
    },
    canceled: {
      type: Boolean,
      default: false, // The 'canceled' field defaults to false
    },
    order: {
      type: Number,
      default: 0, // The 'order' field defaults to 0
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true, // The 'user' field is required and is a reference to the User model
      ref: 'User',
    },
    createdAt: {
      type: Date,
      default: Date.now, // The 'createdAt' field defaults to the current date and time
    },
    subtasks: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subtask' // The 'subtasks' field is an array of Subtask model IDs
    }]
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields to the schema
  }
)

// Create the Task model from the schema
const Task = mongoose.model('Task', taskSchema)

// Export the Task model
module.exports = Task

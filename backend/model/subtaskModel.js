// Import Mongoose library
const mongoose = require('mongoose')

// Define subtask schema using mongoose
const subtaskSchema = new mongoose.Schema(
  {
    // Define text field for subtasks text
    text: {
      type: String,
      required: true,
    },
    // Define completed field to indicate whether the subtask is completed or not
    completed: {
      type: Boolean,
      default: false,
    },
    // Define canceled field to indicate whether the subtask is canceled or not
    canceled: {
      type: Boolean,
      default: false,
    },
    // Define order field for ordering subtasks
    order: {
      type: Number,
      default: 0,
    },
    // Define task field as a reference to the parent task
    task: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Task',
    },
    // Define user field as a reference to the user who created the subtask
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    // Define createdAt field to store the creation date of the subtask
    createdAt: {
      type: Date,
      default: Date.now,
    }
  },
  // Add timestamps to the schema to track creation and modification dates
  {
    timestamps: true,
  }
)

// Create a mongoose model for subtasks using the defined schema
const Subtask = mongoose.model('Subtask', subtaskSchema)

// Export the Subtask model
module.exports = Subtask

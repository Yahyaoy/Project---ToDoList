// Import the 'express-async-handler' library to handle asynchronous errors
const asyncHandler = require('express-async-handler')

// Import the 'Task' and 'Subtask' models
const Task = require('../model/taskModel')
const Subtask = require('../model/subtaskModel')

//**********Create Task **********************//
// Define the 'createTask' function that handles the creation of a new task
const createTask = asyncHandler(async (req, res) => {
  // Get the text of the task from the request body
  const { text } = req.body

  // Create a new task with the text, user ID, and creation date
  const task = await Task.create({
    text,
    user: req.user._id, // Get the user ID from the request object
    createdAt: Date.now(), // Get the current date and time
  })

  // If the task was created successfully, send a 201 status code and the task object
  if (task) {
    res.status(201).json(task)
  } else {
    // If the task was not created successfully, send a 400 status code and an error message
    res.status(400)
    throw new Error('Invalid task data')
  }
})


//**********Update Task **********************//
// Define the 'updateTask' function that handles updating a task
const updateTask = asyncHandler(async (req, res) => {
  // Get the properties of the task to update from the request body
  const { text, completed, canceled, order } = req.body

  // Find the task by ID and user ID
  const task = await Task.findOne({
    _id: req.params.id,
    user: req.user._id,
  })
  if (task) {
    // Update the task properties with the new values, or keep the original value if not provided
    task.text = text || task.text
    task.completed = completed || task.completed
    task.canceled = canceled || task.canceled
    task.order = order || task.order

    // Save the updated task
    const updatedTask = await task.save()

    // Return the updated task as a JSON response
    res.json(updatedTask)
  } else {
    // If the task was not found, send a 404 status code and an error message
    res.status(404)
    throw new Error('Task not found')
  }
})

//**********Update Task **********************//
// Define the 'deleteTask' function that handles deleting a task
const deleteTask = asyncHandler(async (req, res) => {
  // Find the task by ID and user ID
  const task = await Task.findOne({
    _id: req.params.id,
    user: req.user._id,
  })

  if (task) {
    // Delete all subtasks associated with the task
    await Task.deleteMany({ _id: { $in: task.subtasks } })

    // Delete the task itself
    await task.remove()

    // Send a JSON response with a success message
    res.json({ message: 'Task removed successfully' })
  } else {
    // If the task was not found, send a 404 status code and an error message
    res.status(404)
    throw new Error('The Task not found')
  }
})

//**********Create Sub-Task **********************//
const createSubtask = asyncHandler(async (req, res) => {
  const { text } = req.body
  const { taskId } = req.params // from params

  // Check if the task with the specified id exists and belongs to the current user
  const task = await Task.findOne({
    _id: taskId,
    user: req.user._id,
  })

  if (task) {
    // Create a new subtask and associate it with the current task and user
    const subtask = await Subtask.create({
      text,
      task: task._id,
      user: req.user._id,
    })
     
    // Add the subtask id to the list of subtasks for the current task
    if (task.subtasks) {
      task.subtasks.push(subtask._id) /// if have an subtasks before
    } else {
      task.subtasks = [subtask._id]
    }
    await task.save()

    // Return the created subtask
    if (subtask) {
      res.status(201).json(subtask)
    } else {
      res.status(400)
      throw new Error('Invalid subtask data')
    }
  } else {
    res.status(404)
    throw new Error('Task not found')
  }
})

//**********Update Sub-Task **********************//
const updateSubtask = asyncHandler(async (req, res) => {
  const { text, completed, canceled, order } = req.body

  // Check if the subtask with the specified id exists and belongs to the current user
  const subtask = await Subtask.findOne({
    _id: req.params.id,
    user: req.user._id,
  })

  if (subtask) {
    // Update the subtask fields with the provided data
    subtask.text = text || subtask.text
    subtask.completed = completed || subtask.completed
    subtask.canceled = canceled || subtask.canceled
    subtask.order = order || subtask.order

    // Save the updated subtask and return it
    const updatedSubtask = await subtask.save()

    res.json(updatedSubtask)
  } else {
    res.status(404)
    throw new Error('Subtask not found')
  }
})

//**********Delete Sub-Task **********************//
const deleteSubtask = asyncHandler(async (req, res) => {
    // Find the subtask by ID and ensure it belongs to the logged in user
  const subtask = await Subtask.findOne({
    _id: req.params.id,
    user: req.user._id,
  })

  // If the subtask is found
  if (subtask) {
 // Find the task that the subtask belongs to and ensure it belongs to the logged in user
    const task = await Task.findOne({
      _id: subtask.task,
      user: req.user._id,
    })
    
// If the task is found
    if (task) {
// Remove the subtask from the task's subtasks array
      if (task.subtasks) {
  // Remove the subtask from the tasks-subtasks array
// المهام الفرعية الي ما بتحقق الشرط راح نخليها 
      task.subtasks = task.subtasks.filter( // راح نشيل منه الي بدنا نحذفه
        (subtaskId) => subtaskId.toString() !== subtask._id.toString()
      )
    }
// راح يحذف المهمة الفرعية الي بتحقق الشرط
      // Delete the subtask from the database
      await Subtask.deleteOne({ _id: subtask._id })
      await task.save()

      res.json({ message: 'Subtask removed successfully' })
    } else {
 // If the task is not found, just delete the subtask from the database
      await Subtask.deleteOne({ _id: subtask._id , user: req.user._id })
      res.json({ message: 'Subtask removed successfully' })
    }
  } else {
    res.status(404).json({ message: 'Subtask not found' })
  }
})

// ******************** Get all tasks 
const getTasksAndSort = asyncHandler(async (req, res) => {
  const { sortBy } = req.query // http://localhost:5000/api/tasks/?sortBy=completedAt-asc

  // sort options for tasks based on different criteria
  const sortOptions = {
    'createdAt-asc': { createdAt: 1 },
    'createdAt-desc': { createdAt: -1 },
    'completedAt-asc': { completed: 1 },
    'completedAt-desc': { completed: -1 },
    'order-asc': { order: 1 },
    'order-desc': { order: -1 },
  }

  // set the selected sorting option or default to createdAt-desc
  const sortOption = sortOptions[sortBy] || sortOptions['createdAt-desc']

  // find all tasks for the current user, sorted by the selected option
  const tasks = await Task.find({ user: req.user._id })
    .populate({
      path: 'subtasks',
      populate: {
        path: 'user',
        select: 'name',
      },
    })
    .sort(sortOption)

  // return tasks in response
  res.json({ tasks})
})

//*********** Stats of Tasks **********************//

const calculateTaskStats = asyncHandler(async (req, res) => {
  // find all tasks for the given user, with subtasks and their user info populated
  const tasks = await Task.find({ user: req.params.userId}).populate({
    path: 'subtasks',
    populate: {
      path: 'user',
      select: 'name',
    },
  })

  // calculate the completed tasks percentage
  const completedTasks = tasks.filter((task) => task.completed)
  const totalTasks = tasks.length
  const completedPercentage = totalTasks === 0 ? 0 : (completedTasks.length / totalTasks) * 100

  
  // return the calculated statistics in the response
  res.json({completedTasks, completedPercentage })
})
//***********calculate average of completeion of tasks by day */
const calculateAvgCompletionByDay = async(req, res) =>{
  const tasks = await Task.find({ user: req.params.userId }).populate({
    path: 'subtasks',
    populate: {
      path: 'user',
      select: 'name',
    },
  })
  // calculate tasks completed and total for each day
  const tasksByDay = {}
  tasks.forEach((task) => {
    const day = task.createdAt.toDateString()
    if (!tasksByDay[day]) {
      tasksByDay[day] = {
        totalTasks: 0,
        completedTasks: 0,
      }
    }
    tasksByDay[day].totalTasks++
    if (task.completed) {
      tasksByDay[day].completedTasks++
    }
  })

  // calculate completed percentage for each day and return stats object
  const days = Object.keys(tasksByDay)
  const stats = days.map((day) => {
    const { totalTasks, completedTasks } = tasksByDay[day]
    const percentage = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100
    return {
      day,
      percentage,
    }
  })

  // calculate the total and average completed percentage for all days
  const totalPercentage = stats.reduce((sum, { percentage }) => sum + percentage, 0)
  const averagePercentage = stats.length === 0 ? 0 : totalPercentage / stats.length

  // return the calculated statistics in the response
  res.json({stats, averagePercentage })
}
module.exports = {
  createTask,
  updateTask,
  deleteTask,
  createSubtask,
  updateSubtask,
  deleteSubtask,
  getTasksAndSort,
  calculateTaskStats,
  calculateAvgCompletionByDay
}
const asyncHandler = require('express-async-handler')
const Task = require('../model/taskModel')
const Subtask = require('../model/subtaskModel')

const createTask = asyncHandler(async (req, res) => {
  const { text } = req.body

  const task = await Task.create({
    text,
    user: req.user._id,
    createdAt: Date.now(),
  })

  if (task) {
    res.status(201).json(task)
  } else {
    res.status(400)
    throw new Error('Invalid task data')
  }
})

const updateTask = asyncHandler(async (req, res) => {
  const { text, completed, canceled, order } = req.body

  const task = await Task.findOne({
    _id: req.params.id,
    user: req.user._id,
  })

  if (task) {
    task.text = text || task.text
    task.completed = completed || task.completed
    task.canceled = canceled || task.canceled
    task.order = order || task.order

    const updatedTask = await task.save()

    res.json(updatedTask)
  } else {
    res.status(404)
    throw new Error('Task not found')
  }
})

const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({
    _id: req.params.id,
    user: req.user._id,
  })

  if (task) {
    //حذف المهام الفرعية مع المهمة الاصلية
    await Task.deleteMany({ _id: { $in: task.subtasks } })
    await task.remove
    res.json({ message: 'Task removed' })
  } else {
    res.status(404)
    throw new Error('Task not found')
  }
})

const createSubtask = asyncHandler(async (req, res) => {
  const { text } = req.body
  const { taskId } = req.params

  const task = await Task.findOne({
    _id: taskId,
    user: req.user._id,
  })

  if (task) {
    const subtask = await Subtask.create({
      text,
      task: task._id,
      user: req.user._id,
    })
     
    if (task.subtasks) {
      task.subtasks.push(subtask._id)
    } else {
      task.subtasks = [subtask._id]
    }
    // task.subtasks.push(subtask._id)
    await task.save()

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

const updateSubtask = asyncHandler(async (req, res) => {
  const { text, completed, canceled, order } = req.body

  const subtask = await Subtask.findOne({
    _id: req.params.id,
    user: req.user._id,
  })

  if (subtask) {
    subtask.text = text || subtask.text
    subtask.completed = completed || subtask.completed
    subtask.canceled = canceled || subtask.canceled
    subtask.order = order || subtask.order

    const updatedSubtask = await subtask.save()

    res.json(updatedSubtask)
  } else {
    res.status(404)
    throw new Error('Subtask not found')
  }
})

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
    task.subtasks = task.subtasks.filter(
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
const getTasks = asyncHandler(async (req, res) => {
  const { sortBy } = req.query

  const sortOptions = {
    'createdAt-asc': { createdAt: 1 },
    'createdAt-desc': { createdAt: -1 },
    'completedAt-asc': { completed: 1 },
    'completedAt-desc': { completed: -1 },
    'order-asc': { order: 1 },
    'order-desc': { order: -1 },
  }

  const sortOption = sortOptions[sortBy] || sortOptions['createdAt-desc']

  const tasks = await Task.find({ user: req.user._id })
    .populate({
      path: 'subtasks',
      populate: {
        path: 'user',
        select: 'name',
      },
    })
    .sort(sortOption)

  
  res.json({ tasks})
})


const calculateTaskStats = asyncHandler(async (req, res) => {
  const tasks = await Task.find({ user: req.params.userId }).populate({
    path: 'subtasks',
    populate: {
      path: 'user',
      select: 'name',
    },
  })

  const completedTasks = tasks.filter((task) => task.completed)
  const totalTasks = tasks.length
  const completedPercentage = totalTasks === 0 ? 0 : (completedTasks.length / totalTasks) * 100

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

  const days = Object.keys(tasksByDay)
  const stats = days.map((day) => {
    const { totalTasks, completedTasks } = tasksByDay[day]
    const percentage = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100
    return {
      day,
      percentage,
    }
  })

  const totalPercentage = stats.reduce((sum, { percentage }) => sum + percentage, 0)
  const averagePercentage = stats.length === 0 ? 0 : totalPercentage / stats.length

  res.json({ completedPercentage, stats, averagePercentage })
})

module.exports = {
  createTask,
  updateTask,
  deleteTask,
  createSubtask,
  updateSubtask,
  deleteSubtask,
  getTasks,
  calculateTaskStats,
}
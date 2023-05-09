
const express = require('express')
const {
  createTask,
  updateTask,
  deleteTask,
  createSubtask,
  updateSubtask,
  deleteSubtask,
  getTasks,
  calculateTaskStats,
} = require('../controllers/taskController')
const { protect } = require('../middleware/authMiddleware')

const router = express.Router()

router.route('/').post(protect, createTask).get(protect, getTasks)
router.route('/:id').put(protect, updateTask).delete(protect, deleteTask)
router.route('/stats/:userId').get(protect,calculateTaskStats)
router
  .route('/:taskId/subtasks')
  .post(protect, createSubtask)
router
  .route('/:taskId/subtasks/:id')
  .put(protect, updateSubtask)
  .delete(protect, deleteSubtask)

module.exports = router
const express = require('express');
const router = express.Router();
const Task = require('../models/task');
const User = require('../models/user');
const auth = require('../middleware/auth');

// Create a new task
router.post('/tasks', auth, async (req, res) => {
  try {
    const task = new Task({
      user: req.user._id,
      text: req.body.text,
      dateAdded: new Date(),
      order: req.body.order,
      subtasks: []
    });
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all tasks for the authenticated user
router.get('/tasks', auth, async (req, res) => {
  try {
    const sort = req.query.sort;
    let tasks;
    if (sort === 'dateAdded') {
      tasks = await Task.find({ user: req.user._id }).sort({ dateAdded: 1 });
    } else if (sort === 'dateCompleted') {
      tasks = await Task.find({ user: req.user._id, dateCompleted: { $ne: null } }).sort({ dateCompleted: 1 });
    } else { // Default to user order
      tasks = await Task.find({ user: req.user._id }).sort({ order: 1 });
    }
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a task
router.put('/tasks/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    task.text = req.body.text || task.text;
    task.order = req.body.order || task.order;
    if (req.body.completed) {
      task.dateCompleted = req.body.completed === 'true' ? new Date() : null;
    }
    if (req.body.canceled) {
      task.dateCanceled = req.body.canceled === 'true' ? new Date() : null;
    }
    await task.save();
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a task
router.delete('/tasks/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    await task.remove();
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new subtask for a task
router.post('/tasks/:id/subtasks', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    task.subtasks.push({
      text: req.body.text,
      order: req.body.order,
      completed: false,
      canceled: false
    });
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a subtask for a task
router.put('/tasks/:taskId/subtasks/:subtaskId', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.taskId, user: req.user._id });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    const subtask = task.subtasks.id(req.params.subtaskId);
    if (!subtask) {
      return res.status(404).json({ error: 'Subtask not found' });
    }
    subtask.text = req.body.text || subtask.text;
    subtask.order = req.body.order || subtask.order;
    if (req.body.completed) {
      subtask.completed = req.body.completed === 'true';
    }
    if (req.body.canceled) {
      subtask.canceled = req.body.canceled === 'true';
    }
    await task.save();
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a subtask for a task
router.delete('/tasks/:taskId/subtasks/:subtaskId', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.taskId, user: req.user._id });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    const subtask = task.subtasks.id(req.params.subtaskId);
    if (!subtask) {
      return res.status(404).json({ error: 'Subtask not found' });
    }
    subtask.remove();
    await task.save();
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get the user's profile
router.get('/users/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new user
router.post('/users', async (req, res) => {
  try {
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password
    });
    await user.save();
    const token = await user.generateAuthToken();
    res.status(201).json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Log in a user
router.post('/users/login', async (req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password);
    const token = await user.generateAuthToken();
    res.json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Log out the user from the current device
router.post('/users/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
    await req.user.save();
    res.json({ message: 'Logged out' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Log out the user from all devices
router.post('/users/logoutAll', auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.json({ message: 'Logged out from all devices' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
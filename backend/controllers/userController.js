const asyncHandler = require('express-async-handler') // Middleware to handle asynchronous functions in Express
const jwt = require('jsonwebtoken') // Library for JSON Web Tokens مكتبة مشهورة
const bcrypt = require('bcrypt') // Library for password hashing تشفير الباسوورد
const Joi = require('joi') // Library for data validation تعلمناها من د.محمد
const User = require('../model/userModel') // User Mongoose model  

const registerUser = asyncHandler(async (req, res) => { // Controller function to register a new user تسجيل مستخدم
  const { error } = validateUser(req.body) // Validate the incoming request body using the Joi schema بدنا نتحقق 
  if (error) {
    res.status(400)
    throw new Error(error.details[0].message) // Throw an error if the request body is invalid هات اول ايرور بيطلع معك
  }

  const { name, email, password } = req.body // fetch info.

  const userExists = await User.findOne({ email }) // if user is exist or no 

  if (userExists) {
    res.status(400)
    throw new Error('User already exists') // Throw an error if the user already exists in the database
  }

  const user = await User.create({ // add user 
    name,
    email,
    password,
  })

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id), // Generate a JWT token for the new user
    })
  } else {
    res.status(400)
    throw new Error('Invalid user data') // Throw an error if the request body is invalid
  }
})

// start auth user
const authUser = asyncHandler(async (req, res) => { // Controller function to authenticate a user
  const { error } = validateAuth(req.body) // Validate the incoming request body using the Joi schema تحقق
  if (error) {
    res.status(400)
    throw new Error(error.details[0].message) // Throw an error if the request body is invalid
  }

  const { email, password } = req.body

  const user = await User.findOne({ email })

  if (user && (await user.matchPassword(password))) { // if is user exist and password of user = password in request
    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id), // Generate a JWT token for the authenticated user
    })
  } else {
    res.status(401)
    throw new Error('Invalid email or password') // Throw an error if the email or password are incorrect
  }
})
// end auth

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  })
}

const validateUser = (user) => { // Joi validation schema for user registration
  const schema = Joi.object({
    name: Joi.string().alphanum().min(4).max(11).required()
    .messages({
      'string.empty': 'Name is required',
    }),
    email: Joi.string().email().required().messages({
      'string.empty': 'Email is required',
      'string.email': 'Please enter a valid email address',
    }),
    password: Joi.string()
      .min(8)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})')) // Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character
      .required()
      .messages({
        'string.empty': 'Password is required',
        'string.min': 'Your Password must be at least 8 characters',
        'string.pattern.base': 'Your Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character',
      }),
  })
  return schema.validate(user)
}

const validateAuth = (userData) => { // Joi validation schema for user authentication
  const schema = Joi.object({
    email: Joi.string().email().required()
    .messages({
      'string.empty': 'Email is required', // if empty
      'string.email': 'Please enter a valid email address', //valid email
    }),
    password: Joi.string().min(8).required()
    .messages({
      'string.empty': 'Password is required', // if empty password
      'string.min': 'Your Password must be at least 8 characters',
    }),
  })
  return schema.validate(userData)
}

module.exports = { registerUser, authUser } // Export the controller functions for user registration and authentication 
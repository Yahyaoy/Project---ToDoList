// import necessary modules
const jwt = require('jsonwebtoken')
const asyncHandler = require('express-async-handler')
const User = require('../model/userModel')

// define protect middleware
const protect = asyncHandler(async (req, res, next) => {
  let token

  // check if request has an authorization header with a bearer token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // get token from authorization header and verify it using JWT_SECRET
      token = req.headers.authorization.split(' ')[1]
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      // find user associated with decoded JWT and add to request object
      req.user = await User.findById(decoded.id).select('-password')

      // call next middleware function
      next()
    } catch (error) {
      console.error(error)
      res.status(401)
      throw new Error('Not authorized, token failed')
    }
  }

  // if no token was found, send 401 response and throw error
  if (!token) {
    res.status(401)
    throw new Error('Not authorized, no token')
  }
})

// export protect middleware
module.exports = { protect }

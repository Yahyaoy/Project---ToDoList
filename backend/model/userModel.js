// Importing modules
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

// Defining user schema for Mongo DB
const userSchema = mongoose.Schema({
    name:{
        type:String,
        required: [true,'Please add a name'] // Name is a required field
    },
    email:{
        type:String,
        required: [true,'Please add an email'], // Email is a required field
        unique: true // Email field is unique
    },
    password:{
        type:String,
        required: [true,'Please add a password'] // Password is a required field
    },
},
   {
    timestamps:true // Adding timestamps to the schema
   }
)

// Adding a custom method to the user schema to compare passwords
// عملناها حتى نقارن بين الباسوورد الي موجود والي بدخله اليوزر
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}
//This check is important because if the password field is hashed again 

/* even though it has not been modified,
  it can cause unnecessary processing overhead
   and potential issues with comparing passwords. 
  By only hashing the password if it has been modified,
   the code ensures that the password is not unnecessarily hashed.
 Adding a pre-hook to the user schema to hash the password before saving */

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) { // Only hash password if it has been modified
    next()
  }
// hash password
  const salt = await bcrypt.genSalt(10) // add additional salt
  this.password = await bcrypt.hash(this.password, salt)
})

// Creating a User model from the user schema
const User = mongoose.model('User', userSchema)

// Exporting the User model for use in other files
module.exports = User

const mongoose = require("mongoose")
const validator = require("validator")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

const userSchema = mongoose.Schema({
  role: {
    type: Number
  },
  username: {
    type: String,
    unique: true,
    minLength: 3,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minLength: 5,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: (value) => {
      if (!validator.isEmail(value)) {
        throw new Error({ error: "Invalid Email Address" })
      }
    },
  },
  // Array isn't required but if a token is present it needs a value
  tokens: [
    {
      token: {
        type: String,
        required: true,
      },
    },
  ],
})

userSchema.pre("save", async function (next) {
  //hashing the password
  const user = this
  if (user.isModified("password")) {
    user.username = user.username.toLowerCase()
    user.password = await bcrypt.hash(user.password, 8)
  }
})

userSchema.statics.findByCredentials = async (username, password) => {
  const user = await User.findOne({ username })
  if (!user) {
    return null
  }
  const isPasswordMatch = await bcrypt.compare(password, user.password)
  if (!isPasswordMatch) {
    return null
  }

  return user
}

userSchema.statics.deleteUser = async (userID) => {
  var id = new mongoose.Types.ObjectId(userID)

  const user = await User.deleteOne({ _id: id })

  if (!user) {
    return false
  }

  return true
}

userSchema.statics.getRole = async (userID) => {
  try {
    const role = await User.findOne({"_id": userID}).select("role")
    return role.role
  } catch {
    return null
  }
}

// Tokens

userSchema.statics.createAccessToken = async (userID) => {
  const accessToken = jwt.sign(
    {
      userID: userID,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "1h", //Test Expiry Time
    }
  )
  return accessToken
}

userSchema.statics.createRefreshToken = async (userID) => {
  const refreshToken = jwt.sign(
    {
      userID: userID,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: "1d", //Test Expiry Time
    }
  )

  try {
    await User.updateOne(
      { _id: userID },
      { $push: { tokens: { token: refreshToken } } }
    )
  } catch (error) {
    throw new Error({ error: "Failed to create refresh token." })
  }

  return refreshToken
}

userSchema.statics.deleteRefreshToken = async (userID, refreshToken) => {
  try {
    return await User.updateOne(
      { _id: userID },
      { $pull: { tokens: { token: refreshToken } } }
    )
  } catch (error) {
    throw new Error({ error: "Failed to delete refresh token." })
  }
}

userSchema.statics.deleteAllRefreshTokens = async (userID) => {
  try {
    return await User.updateOne({ _id: userID }, { $set: { tokens: [] } })
  } catch (error) {
    throw new Error({ error: "Failed to delete all refresh token." })
  }
}

userSchema.statics.checkRefreshToken = async (userID, refreshToken) => {
  const user = await User.findOne({ _id: userID })
  if (!user) {
    return null
  }
  try {
    return await user.tokens.some((token) => token.token === refreshToken)
  } catch (error) {
    return null
  }
}

const User = mongoose.model("User", userSchema)
module.exports = User

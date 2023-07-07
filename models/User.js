const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const userSchema = mongoose.Schema({
	username: {
		type: String,
		unique: true,
		minLength: 3,
		required: true,
		trim: true
	},
	password: {
		type: String,
		required: true,
		minLength: 5,
		trim: true
	},
	email: {
		type: String,
		required: true,
		unique: true,
		lowercase: true,
		validate: value => {
			if (!validator.isEmail(value)) {
				throw new Error({error: 'Invalid Email Address'})
			}
		}
	},
	// Array isn't required but if a token is present it needs a value
	tokens: [{
		token: {
			type: String,
			required: true
		}
	}]
})

userSchema.pre('save', async function (next){
	//hashing the password
	const user = this
	if (user.isModified('password')) {
		user.username = user.username.toLowerCase()
		user.password = await bcrypt.hash(user.password, 8) 
	}
})

userSchema.statics.findByCredentials = async (username, password) => {
	const user = await User.findOne({username})
	if (!user) {
		return null
	}
	const isPasswordMatch = await bcrypt.compare(password, user.password)
	if (!isPasswordMatch) {
		return null
	}

	return user
}

const User = mongoose.model('User', userSchema)
module.exports = User
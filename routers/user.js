const express = require('express')
const User = require('../models/User')
const router = express.Router()
const rateLimit = require('express-rate-limit')

const loginRateLimit = rateLimit({
	windowMs: 2 * 60 * 1000,
	max: 10,
	message: {error: "Too many login attempts. Please try again later."}
})
const registerRateLimit = rateLimit({
	windowMs: 5 * 60 * 1000,
	max: 5,
	message: {error: "Too many register attempts. Please try again later."}
})

// Ping
router.get('/', async(req, res) => {
    console.log("Status 200: Ping")
    res.status(200).send({message: "pong"})
})

// User Create

router.post	('/user/create', registerRateLimit, async(req, res) => {
	try {
		const user = new User(req.body)
		await user.save()
		console.log("Status 201: Created a new user!")
		res.status(201).send({success: "User Registered"})
	} catch(errors) {
		console.log("Status 400: Failed to create a new user!")
		res.status(400).send({error: "Failed to create a new user!"})
	}
})

// User Login

router.post('/user/login', loginRateLimit, async(req, res) => {
	try {
		const username = req.body.username
		const password = req.body.password

		// User authentication
		const user = await User.findByCredentials(username.toLowerCase(), password)
		if (!user) {
			return res.status(401).send({error: "Login Failed! Check your Credentials"})
		}

		console.log(`Status 200: ${username} successfully logged in!`)
		res.status(200).send({user})
	} catch (errors) {
		console.log(`Status 400: Login failed for ${req.body.username}`)
		console.log(errors)
		res.status(400).send({error})
	}
})

module.exports = router
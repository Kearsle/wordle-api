const express = require('express')
const Wordle = require('../models/Wordle')
const router = express.Router()
const auth = require('../middleware/auth')

module.exports = router

router.get('/wordle', auth.authenticateToken, async(req, res) => {
    console.log("Status 200: Ping")
    res.status(200).send({message: "pong"})
})
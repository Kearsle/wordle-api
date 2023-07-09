const express = require('express')
const Word = require('../models/Word')
const router = express.Router()
const auth = require('../middleware/auth')

module.exports = router

router.get('/word/generate', auth.authenticateToken, async(req, res) => {
    console.log("Status 200: Ping")
    res.status(200).send({message: "pong"})
})
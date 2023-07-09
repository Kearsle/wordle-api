const express = require('express')
const router = express.Router()
const Wordle = require('../models/Wordle')
const WordList = require('../models/WordList')
const WordOfTheDay   = require('../models/WordOfTheDay')
const auth = require('../middleware/auth')
const fs = require('fs')
const { error } = require('console')

module.exports = router

router.get('/wordle', async(req, res) => {
    console.log("Status 200: Ping")
    res.status(200).send({message: "pong"})
    //res.status(200).send({message: "pong"})
})



// Wordlist
router.post	('/wordle/wordlist/create', async(req, res) => {
	try {
		const wordlist = new WordList(req.body)
		await wordlist.save()
		console.log(`Status 201: Created a new ${req.body.title}!`)
		res.status(201).send({success: `${req.body.title} created.`})
	} catch(errors) {
        console.log(errors)
		console.log("Status 400: Failed to create a new wordlist!")
		res.status(400).send({error: "Failed to create a new wordlist!"})
	}
})

router.post	('/wordle/wordlist/addWord', async(req, res) => {
    const wordlistTitle = req.body.title
    const word = req.body.word

    if (wordlistTitle && word) {
        if(await WordList.addWord(wordlistTitle, word)) {
            res.status(201).send({success: `${word} added to ${wordlistTitle}`})
        } else {
            res.status(400).send({error: "Failed to add word to the word list!"})
        }
    } else {
        res.status(400).send({error: "Word list title or word not sent."})
    }
})

router.get ('/wordle/wordlist/getRandomWord', async(req, res) => {
    try {
        const wordlistTitle = req.body.title
        const word = await WordList.getRandomWord(wordlistTitle)
        if(!word)
        {
            return res.status(401).send({error: "Wordlist is not valid."})
        }
        res.status(201).send({word: word, success: `Taken from ${wordlistTitle}`})
    } catch(error) {
        res.status(401).send({error: error})
    }
})
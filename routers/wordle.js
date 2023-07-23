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
})

// Wordlist
router.post	('/wordle/wordlist/create', auth.authenticateToken, auth.isAdmin, async(req, res) => {
	try {
		const wordlist = new WordList(req.body)
        if (!req.body.title) {
            return res.status(400).send({error: "Failed to create a new wordlist!"})
        }
		await wordlist.save()
		console.log(`Status 201: Created a new ${req.body.title}!`)
		res.status(201).send({success: `${req.body.title} created.`})
	} catch(errors) {
        console.log(errors)
		console.log("Status 400: Failed to create a new wordlist!")
		res.status(400).send({error: "Failed to create a new wordlist!"})
	}
})

router.post	('/wordle/wordlist/addWord', auth.authenticateToken, auth.isAdmin, async(req, res) => {
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

router.get ('/wordle/wordlists', auth.authenticateToken, async(req, res) => {
    // Return all active wordlists aka active games

    try {
		const wordlists = await WordList.getActiveWordlists()
		if (!wordlists) {
			return res.status(401).send({error: "Failed to find any active wordlists"})
		}
		res.status(200).send(wordlists)
	} catch (error) {
		res.status(400).send(error)
	}
})

router.get ('/wordle/wordlist/:wordlist', auth.authenticateToken, async(req, res) => {
    const wordlistID = req.params.wordlist
    const wordlist = await WordList.getWordlistTitle(wordlistID)
    if (!wordlist) {
        return res.status(404).send({error: "No wordlist found."})
    }
    res.status(200).send({wordlist})
})

// Word of the Day

router.post ('/wordle/wordoftheday/new', auth.authenticateToken, auth.isAdmin, async(req, res) => {
    const wordlistTitle =  req.body.title
    const word = await WordList.getRandomWord(wordlistTitle)
    if(!word)
    {
        return res.status(401).send({error: "Wordlist is not valid."})
    }
    // delete current word and save new word
    if (!await WordOfTheDay.deleteWordOfTheDay(wordlistTitle)) {
        return res.status(401).send({error: "Failed to delete current word of the day."})
    }
    try {
        const wordOfTheDay = new WordOfTheDay({word: word})
        await wordOfTheDay.save()
        console.log("Status 201: New word of the day.")
        res.status(201).send({success: "New word of the day.", word: word})
    } catch (error) {
        console.log("Status 400: Failed to set new Word of the Day.")
        console.log(error)
        res.status(400).send({error: "Failed to set new Word of the Day."})
    }
})

// Game
router.post('/wordle/guess', auth.authenticateToken, async(req, res) => {
    // get guess, return array of b, y or green for each character passed
    const wordlistTitle = req.body.wordlistTitle
    const guess = req.body.guess
    // Check if guess is valid
    if (guess.length != 5) {
        return res.status(401).send({error: "Guess must be 5 characters long"})
    }
    // Check if wordlist is correct
    const wordlist = await WordList.getWordlistTitle(wordlistID)
    if (!wordlist) {
        return res.status(404).send({error: "No wordlist found."})
    }

    // Check if a current word of the day is there, if not add one

    // check if the guess won

    // go through each letter to see if its either a correct letter and in the correct spot (green) else a correct letter but not in that spot (yellow), else the letter is wrong (black). 

})
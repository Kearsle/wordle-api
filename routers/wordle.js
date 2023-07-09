const express = require('express')
const router = express.Router()
const Wordle = require('../models/Wordle')
const WordList = require('../models/WordList')
const WordOfTheDay   = require('../models/WordOfTheDay')
const auth = require('../middleware/auth')
const fs = require('fs')

module.exports = router

router.get('/wordle', async(req, res) => {
    const filename = '../text/wordlist.txt'
    //var data = fs.readFileSync('../text/wordlist.txt', 'utf8')
    fs.readFile(filename, 'utf8', function(err, data) {
        if (err) {console.log(err)};
        console.log('OK: ' + filename);
        console.log(data)
      });
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